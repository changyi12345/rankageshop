import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TopUpWalletDto } from './dto/topup-wallet.dto';
import { SettingsService } from '../settings/settings.service';
import { PaymentAccount, DEFAULT_PAYMENT_ACCOUNTS } from '../settings/payment-account.types';

function toMmkInt(value: number): number {
  if (!Number.isFinite(value)) {
    throw new BadRequestException('Invalid amount');
  }
  return Math.round(value);
}

function safeMmk(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function mapTopUpStatus(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'completed') return 'approved';
  return normalized;
}

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  async getWallet(userId: number) {
    try {
      await this.settings.assertFeatureEnabled('walletEnabled');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });
      if (!user) throw new BadRequestException('User not found');

      const transactions = await this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        balance: safeMmk(user.walletBalance),
        wallet_balance: safeMmk(user.walletBalance),
        currency: 'MMK',
        pending_top_ups: transactions.filter(
          (t) => t.type === 'topup' && t.status === 'PENDING',
        ).length,
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: safeMmk(t.amount),
          balanceBefore: safeMmk(t.balanceBefore),
          balanceAfter: safeMmk(t.balanceAfter),
          status: t.status,
          description: t.description,
          reference: t.reference,
          proofImageUrl: t.proofImageUrl,
          createdAt: t.createdAt.toISOString(),
        })),
      };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof ForbiddenException) throw err;
      throw new ServiceUnavailableException('Wallet is temporarily unavailable. Please try again.');
    }
  }

  async getPaymentMethods() {
    try {
      const shop = await this.settings.getPublicShopInfo();
      const accounts =
        shop.paymentAccounts?.filter((a) => a.enabled !== false) ?? [];
      if (accounts.length === 0) {
        return DEFAULT_PAYMENT_ACCOUNTS.map((account) =>
          this.mapPaymentMethod({
            ...account,
            accountHolder: shop.shopName || account.accountHolder || 'RanKageShop',
          }),
        );
      }
      return accounts.map((account) => this.mapPaymentMethod(account));
    } catch {
      return DEFAULT_PAYMENT_ACCOUNTS.map((account) =>
        this.mapPaymentMethod({
          ...account,
          accountHolder: 'RanKageShop',
        }),
      );
    }
  }

  async listTopUps(userId: number) {
    await this.settings.assertFeatureEnabled('walletEnabled');
    const rows = await this.prisma.walletTransaction.findMany({
      where: { userId, type: 'topup' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((t) => ({
      id: t.id,
      amount: toMmkInt(Number(t.amount)),
      status: mapTopUpStatus(t.status),
      payment_method: this.paymentMethodFromDescription(t.description),
      payment_method_name: this.paymentMethodFromDescription(t.description),
      created_at: t.createdAt.toISOString(),
      proof_image_url: t.proofImageUrl,
    }));
  }

  async requestTopUpFromBody(
    userId: number,
    body: { amount: number; payment_method_id?: string; paymentMethod?: string; proofImageUrl?: string },
  ) {
    const paymentMethod = await this.resolvePaymentMethod(
      body.payment_method_id ?? body.paymentMethod,
    );
    return this.requestTopUp(userId, {
      amount: body.amount,
      paymentMethod: paymentMethod.name,
      proofImageUrl: body.proofImageUrl,
    });
  }

  private mapPaymentMethod(account: PaymentAccount) {
    return {
      id: account.id,
      name: account.name,
      account_number: account.accountNumber,
      account_holder_name: account.accountHolder,
      logo_url: null,
    };
  }

  private paymentMethodFromDescription(description: string | null) {
    if (!description) return null;
    const match = description.match(/Top-up via (.+)$/i);
    return match?.[1]?.trim() ?? null;
  }

  private async resolvePaymentMethod(idOrName?: string) {
    const methods = await this.getPaymentMethods();
    if (!idOrName?.trim()) {
      throw new BadRequestException('Payment method is required');
    }
    const key = idOrName.trim().toLowerCase();
    const match = methods.find(
      (method) =>
        method.id.toLowerCase() === key ||
        method.name.toLowerCase() === key,
    );
    if (!match) {
      throw new BadRequestException('Payment method not found');
    }
    return match;
  }

  async requestTopUp(userId: number, dto: TopUpWalletDto) {
    await this.settings.assertFeatureEnabled('walletEnabled');
    await this.settings.assertFeatureEnabled('walletTopupEnabled');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const balance = toMmkInt(Number(user.walletBalance));
    const amount = toMmkInt(dto.amount);
    const txn = await this.prisma.walletTransaction.create({
      data: {
        userId,
        type: 'topup',
        amount,
        balanceBefore: balance,
        balanceAfter: balance,
        status: 'PENDING',
        description: `Top-up via ${dto.paymentMethod}`,
        reference: dto.reference ?? null,
        proofImageUrl: dto.proofImageUrl ?? null,
      },
    });

    return {
      id: txn.id,
      status: txn.status,
      amount: toMmkInt(Number(txn.amount)),
      message: 'Top-up request submitted. Awaiting payment verification.',
    };
  }

  async spend(
    userId: number,
    amount: number,
    description: string,
    reference?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    const spendAmount = toMmkInt(amount);

    if (reference) {
      const existing = await db.walletTransaction.findFirst({
        where: {
          userId,
          type: 'spend',
          reference,
          status: 'COMPLETED',
        },
      });
      if (existing) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');
        return {
          balance: safeMmk(user.walletBalance),
          transactionId: existing.id,
          alreadyCharged: true,
        };
      }
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const balance = toMmkInt(Number(user.walletBalance));
    if (balance < spendAmount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const newBalance = balance - spendAmount;

    if (tx) {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: newBalance },
      });
      const txn = await tx.walletTransaction.create({
        data: {
          userId,
          type: 'spend',
          amount: spendAmount,
          balanceBefore: balance,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          description,
          reference: reference ?? null,
        },
      });
      return {
        balance: safeMmk(updatedUser.walletBalance),
        transactionId: txn.id,
        alreadyCharged: false,
      };
    }

    const [updatedUser, txn] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: newBalance },
      }),
      this.prisma.walletTransaction.create({
        data: {
          userId,
          type: 'spend',
          amount: spendAmount,
          balanceBefore: balance,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          description,
          reference: reference ?? null,
        },
      }),
    ]);

    return {
      balance: safeMmk(updatedUser.walletBalance),
      transactionId: txn.id,
      alreadyCharged: false,
    };
  }
}
