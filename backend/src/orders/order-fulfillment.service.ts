import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { G2bulkService } from '../g2bulk/g2bulk.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class OrderFulfillmentService {
  private readonly logger = new Logger(OrderFulfillmentService.name);

  constructor(
    private prisma: PrismaService,
    private g2bulk: G2bulkService,
    private notifications: NotificationsService,
    private wallet: WalletService,
  ) {}

  async fulfillOrder(orderId: number): Promise<{ success: boolean; message?: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        topUpInput: true,
        topUpPackage: true,
        user: { select: { email: true, phone: true } },
      },
    });

    if (!order) return { success: false, message: 'Order not found' };
    if (order.status === 'COMPLETED') return { success: true, message: 'Already completed' };

    try {
      if (order.type === 'direct_topup' && order.product.g2bulkGameCode) {
        const catalogueName =
          order.topUpInput?.catalogueName ?? order.topUpPackage?.g2bulkCatalogueName;
        if (!catalogueName) {
          await this.markProcessing(orderId, 'Missing catalogue — manual fulfillment required');
          return { success: false, message: 'Missing catalogue' };
        }

        const input = order.topUpInput;
        const result = await this.g2bulk.placeGameOrder(order.product.g2bulkGameCode, {
          catalogue_name: catalogueName,
          playerId: input?.playerId,
          serverId: input?.serverId,
          charname: input?.playerName,
        });

        if (result.success) {
          await this.chargeWalletIfNeeded(order);
          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              ...(result.order_id ? { g2bulkOrderId: parseInt(result.order_id, 10) || undefined } : {}),
            },
          });
          await this.notifications.notifyOrderCompleted(
            order.user.email,
            orderId,
            order.userId,
          );
          return { success: true };
        }

        await this.markProcessing(orderId, result.message ?? 'G2Bulk fulfillment failed');
        return { success: false, message: result.message };
      }

      if (order.type === 'voucher' && order.product.g2bulkProductId) {
        const result = await this.g2bulk.placeVoucherOrder({
          product_id: order.product.g2bulkProductId,
          quantity: order.quantity,
        });

        if (result.success && result.codes?.length) {
          await this.chargeWalletIfNeeded(order);
          await this.prisma.$transaction(async (tx) => {
            for (const code of result.codes!) {
              await tx.orderVoucherCode.create({ data: { orderId, voucherCode: code } });
            }
            await tx.order.update({
              where: { id: orderId },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                ...(result.transaction_id
                  ? { g2bulkTransactionId: parseInt(result.transaction_id, 10) || undefined }
                  : {}),
              },
            });
          });
          await this.notifications.notifyOrderCompleted(
            order.user.email,
            orderId,
            order.userId,
          );
          return { success: true };
        }

        await this.markProcessing(orderId, result.message ?? 'Voucher fulfillment failed');
        return { success: false, message: result.message };
      }

      await this.markProcessing(orderId, 'No G2Bulk mapping — manual fulfillment');
      return { success: false, message: 'Manual fulfillment required' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Fulfillment error';
      this.logger.error(`Order ${orderId} fulfillment failed`, err);
      await this.markProcessing(orderId, msg);
      return { success: false, message: msg };
    }
  }

  private async chargeWalletIfNeeded(order: {
    id: number;
    userId: number;
    paymentMethod: string | null;
    totalPrice: { toString(): string } | number;
    product: { name: string };
  }) {
    if (order.paymentMethod !== 'wallet') return;

    const amount = Math.round(Number(order.totalPrice));
    await this.wallet.spend(
      order.userId,
      amount,
      `Order #${order.id} — ${order.product.name}`,
      String(order.id),
    );
  }

  /** Charge wallet for a wallet-paid order if not already charged (idempotent). */
  async ensureWalletCharged(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });
    if (!order || order.paymentMethod !== 'wallet') return;
    await this.chargeWalletIfNeeded(order);
  }

  private async markProcessing(orderId: number, remark: string) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING', remark },
    });
  }
}
