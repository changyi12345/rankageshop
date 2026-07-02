import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SubmitPaymentProofDto } from './dto/payment-proof.dto';
import { PromosService } from '../promos/promos.service';
import { OrderFulfillmentService } from './order-fulfillment.service';
import { OrderProductResolver } from './order-product.resolver';
import { SettingsService } from '../settings/settings.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

const ACTIVE_ORDER_STATUSES = ['PENDING', 'PAYMENT_PENDING', 'PROCESSING'] as const;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private promosService: PromosService,
    private fulfillment: OrderFulfillmentService,
    private productResolver: OrderProductResolver,
    private settings: SettingsService,
    private wallet: WalletService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto) {
    if (!createOrderDto.items?.length) {
      throw new BadRequestException('At least one order item is required');
    }

    const paymentMethod = createOrderDto.paymentMethod ?? 'bank';
    if (paymentMethod === 'wallet') {
      await this.settings.assertFeatureEnabled('walletEnabled');
    }

    const resolved = await Promise.all(
      createOrderDto.items.map((item) => this.productResolver.resolveItem(item)),
    );

    let subtotal = resolved.reduce((sum, r) => sum + r.lineTotal, 0);
    let discount = 0;
    if (createOrderDto.promoCode?.trim()) {
      await this.settings.assertFeatureEnabled('promoCodesEnabled');
      const promo = await this.promosService.validate({
        code: createOrderDto.promoCode.trim(),
        subtotal,
      });
      if (promo.valid) {
        discount = promo.discountAmount;
        await this.promosService.applyUsage(createOrderDto.promoCode.trim());
      }
    }

    const payableTotal = Math.max(0, Math.round(subtotal - discount));
    const lineTotals = allocateLineTotals(resolved.map((r) => r.lineTotal), payableTotal);
    const batchId = randomUUID();

    const activeOrderCount = await this.prisma.order.count({
      where: {
        userId,
        status: { in: [...ACTIVE_ORDER_STATUSES] },
      },
    });
    if (activeOrderCount > 0) {
      throw new BadRequestException(
        'You already have an order in progress. Please wait until it completes before placing another order.',
      );
    }

    if (paymentMethod === 'wallet') {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || Number(user.walletBalance) < payableTotal) {
        throw new BadRequestException('Insufficient wallet balance');
      }
    }

    const orders = await this.prisma.$transaction(async (tx) => {
      const created = [];
      for (let i = 0; i < resolved.length; i++) {
        const item = resolved[i];
        const orderLineTotal = lineTotals[i];
        const status = paymentMethod === 'wallet' ? 'PROCESSING' : 'PENDING';
        const order = await tx.order.create({
          data: {
            userId,
            productId: item.product.id,
            topUpPackageId: item.topUpPackageId,
            type: item.product.type,
            quantity: item.quantity,
            totalPrice: orderLineTotal,
            paymentMethod,
            status,
            batchId,
            ...(item.topUpInput
              ? {
                  topUpInput: {
                    create: {
                      gameCode: item.topUpInput.gameCode,
                      playerId: item.topUpInput.playerId,
                      serverId: item.topUpInput.serverId,
                      playerName: item.topUpInput.playerName,
                      catalogueName: item.topUpInput.catalogueName,
                    },
                  },
                }
              : {}),
          },
          include: { product: true, topUpInput: true, voucherCodes: true, paymentProof: true },
        });

        if (item.product.stock != null) {
          await tx.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }

        if (paymentMethod === 'wallet') {
          await this.wallet.spend(
            userId,
            orderLineTotal,
            `Order #${order.id} — ${item.product.name}`,
            String(order.id),
            tx,
          );
        }

        created.push(order);
      }
      return created;
    });

    for (const order of orders) {
      const productName = order.product?.name ?? 'Order';
      if (paymentMethod === 'wallet') {
        await this.fulfillment.fulfillOrder(order.id);
        const fresh = await this.prisma.order.findUnique({ where: { id: order.id } });
        if (fresh?.status !== 'COMPLETED') {
          await this.notifications.notifyOrderProcessing(userId, order.id, productName);
        }
      } else {
        await this.notifications.notifyOrderPending(userId, order.id, productName);
      }
    }

    if (orders.length === 1) {
      return orders[0];
    }

    return {
      batchId,
      primaryOrderId: orders[0].id,
      orders,
      totalPrice: payableTotal,
    };
  }

  async findAllByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        product: true,
        paymentProof: true,
        voucherCodes: true,
        topUpInput: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        topUpInput: true,
        voucherCodes: true,
        paymentProof: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (userId != null && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  async submitPaymentProof(orderId: number, userId: number, dto: SubmitPaymentProofDto) {
    const order = await this.findOne(orderId, userId);
    if (order.paymentMethod === 'wallet') {
      throw new BadRequestException('Wallet orders do not require payment proof');
    }
    if (order.paymentProof) {
      throw new BadRequestException('Payment proof already submitted');
    }

    const batchOrders = order.batchId
      ? await this.prisma.order.findMany({
          where: { batchId: order.batchId, userId, paymentMethod: { not: 'wallet' } },
        })
      : [order];

    const proof = await this.prisma.paymentProof.create({
      data: {
        orderId,
        method: dto.method,
        reference: dto.reference,
        note: dto.note,
        imageUrl: dto.imageUrl,
      },
    });

    const orderIds = batchOrders.map((o) => o.id);
    await this.prisma.order.updateMany({
      where: { id: { in: orderIds }, status: 'PENDING' },
      data: { status: 'PAYMENT_PENDING' },
    });

    return proof;
  }

  async cancelByUser(orderId: number, userId: number) {
    await this.settings.assertFeatureEnabled('userOrderCancelEnabled');
    const order = await this.findOne(orderId, userId);
    if (order.paymentMethod === 'wallet') {
      throw new BadRequestException('Wallet orders cannot be cancelled');
    }

    const cancellable = ['PENDING', 'PAYMENT_PENDING'] as const;
    const batchOrders = order.batchId
      ? await this.prisma.order.findMany({
          where: {
            batchId: order.batchId,
            userId,
            paymentMethod: { not: 'wallet' },
            status: { in: [...cancellable] },
          },
          include: { product: true },
        })
      : cancellable.includes(order.status as (typeof cancellable)[number])
        ? [order]
        : [];

    if (!batchOrders.some((o) => o.id === orderId)) {
      throw new BadRequestException('This order cannot be cancelled');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const batchOrder of batchOrders) {
        if (batchOrder.product.stock != null) {
          await tx.product.update({
            where: { id: batchOrder.productId },
            data: { stock: { increment: batchOrder.quantity } },
          });
        }
        await tx.order.update({
          where: { id: batchOrder.id },
          data: { status: 'CANCELLED' },
        });
      }
    });

    return this.findOne(orderId, userId);
  }
}

function allocateLineTotals(lineAmounts: number[], payableTotal: number): number[] {
  if (lineAmounts.length === 0) return [];
  const raw = lineAmounts.reduce((a, b) => a + b, 0);
  if (raw <= 0) return lineAmounts.map(() => 0);
  const result: number[] = [];
  let allocated = 0;
  for (let i = 0; i < lineAmounts.length; i++) {
    if (i === lineAmounts.length - 1) {
      result.push(Math.max(0, payableTotal - allocated));
    } else {
      const share = Math.round((lineAmounts[i] / raw) * payableTotal);
      result.push(share);
      allocated += share;
    }
  }
  return result;
}

function formatOrderBatchLabel(orders: { id: number; product: { name: string } }[]): string {
  if (orders.length <= 2) {
    return orders.map((o) => `#${o.id} ${o.product.name}`).join(', ');
  }
  return `#${orders[0].id} ${orders[0].product.name} +${orders.length - 1} more`;
}
