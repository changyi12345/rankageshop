import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { PromosService } from '../promos/promos.service';
import { OrderFulfillmentService } from './order-fulfillment.service';
import { OrderProductResolver } from './order-product.resolver';
import { SettingsService } from '../settings/settings.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    type: 'VOUCHER',
    g2bulkGameCode: null,
    g2bulkProductId: 10,
    stock: 100,
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    paymentProof: {
      create: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };

  const promosService = {
    validate: jest.fn().mockResolvedValue({ valid: false, discountAmount: 0 }),
    applyUsage: jest.fn(),
  };

  const fulfillment = {
    fulfillOrder: jest.fn().mockResolvedValue(undefined),
  };

  const productResolver = {
    resolveItem: jest.fn().mockResolvedValue({
      product: mockProduct,
      quantity: 1,
      unitPrice: 5000,
      lineTotal: 5000,
      topUpPackageId: null,
      topUpInput: null,
    }),
  };

  const settings = {
    assertFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  };

  const wallet = {
    spend: jest.fn().mockResolvedValue({ balance: 5000, transactionId: 1 }),
  };

  const notifications = {
    notifyOrderProcessing: jest.fn().mockResolvedValue(undefined),
    notifyOrderPending: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.order.count.mockResolvedValue(0);
    prisma.order.findUnique.mockResolvedValue({ id: 1, status: 'PROCESSING' });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: PromosService, useValue: promosService },
        { provide: OrderFulfillmentService, useValue: fulfillment },
        { provide: OrderProductResolver, useValue: productResolver },
        { provide: SettingsService, useValue: settings },
        { provide: WalletService, useValue: wallet },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('rejects empty cart', async () => {
    await expect(service.create(1, { items: [] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates manual payment order as PENDING', async () => {
    prisma.order.create.mockResolvedValue({
      id: 42,
      status: 'PENDING',
      paymentMethod: 'kbz',
      totalPrice: 5000,
      product: mockProduct,
      topUpInput: null,
      voucherCodes: [],
      paymentProof: null,
    });

    const result = await service.create(1, {
      items: [{ g2bulkProductId: 10, quantity: 1, unitPrice: 5000 }],
      paymentMethod: 'kbz',
    });

    expect(result).toMatchObject({ id: 42, status: 'PENDING' });
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING', paymentMethod: 'kbz' }),
      }),
    );
    expect(fulfillment.fulfillOrder).not.toHaveBeenCalled();
    expect(wallet.spend).not.toHaveBeenCalled();
  });

  it('creates wallet order, deducts balance upfront, and fulfills', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, walletBalance: 10000 });
    prisma.order.create.mockResolvedValue({
      id: 7,
      status: 'PROCESSING',
      paymentMethod: 'wallet',
      totalPrice: 5000,
      product: mockProduct,
      topUpInput: null,
      voucherCodes: [],
      paymentProof: null,
    });

    const result = await service.create(1, {
      items: [{ g2bulkProductId: 10, quantity: 1, unitPrice: 5000 }],
      paymentMethod: 'wallet',
    });

    expect(result).toMatchObject({ id: 7, status: 'PROCESSING' });
    expect(wallet.spend).toHaveBeenCalledWith(
      1,
      5000,
      'Order #7 — Test Product',
      '7',
      prisma,
    );
    expect(fulfillment.fulfillOrder).toHaveBeenCalledWith(7);
  });

  it('rejects wallet order when balance insufficient', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, walletBalance: 100 });

    await expect(
      service.create(1, {
        items: [{ g2bulkProductId: 10, quantity: 1, unitPrice: 5000 }],
        paymentMethod: 'wallet',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects new order when user has an active order', async () => {
    prisma.order.count.mockResolvedValue(1);

    await expect(
      service.create(1, {
        items: [{ g2bulkProductId: 10, quantity: 1, unitPrice: 5000 }],
        paymentMethod: 'wallet',
      }),
    ).rejects.toThrow('You already have an order in progress');
  });

  it('submits payment proof and updates batch status', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 5,
      userId: 1,
      status: 'PENDING',
      paymentMethod: 'kbz',
      batchId: 'batch-1',
    });
    prisma.order.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }]);
    prisma.paymentProof.create.mockResolvedValue({ id: 1, status: 'PENDING' });
    prisma.order.updateMany.mockResolvedValue({ count: 2 });

    const proof = await service.submitPaymentProof(5, 1, {
      method: 'KBZ Pay',
      reference: 'TXN123',
      imageUrl: '/uploads/proof.jpg',
    });

    expect(proof).toEqual({ id: 1, status: 'PENDING' });
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [5, 6] }, status: 'PENDING' },
      data: { status: 'PAYMENT_PENDING' },
    });
  });

  it('rejects payment proof for wallet orders', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 5,
      userId: 1,
      status: 'COMPLETED',
      paymentMethod: 'wallet',
    });

    await expect(
      service.submitPaymentProof(5, 1, { method: 'wallet' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancels PENDING order and restores stock', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 3,
      userId: 1,
      status: 'PENDING',
      paymentMethod: 'kbz',
      batchId: null,
      productId: 1,
      quantity: 1,
      product: { ...mockProduct, stock: 10 },
    });
    prisma.order.findMany.mockResolvedValue([]);
    prisma.product.update.mockResolvedValue({});
    prisma.order.update.mockResolvedValue({ id: 3, status: 'CANCELLED' });

    await service.cancelByUser(3, 1);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { stock: { increment: 1 } },
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { status: 'CANCELLED' },
    });
  });

  it('rejects cancel for wallet orders', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 5,
      userId: 1,
      status: 'PROCESSING',
      paymentMethod: 'wallet',
    });

    await expect(service.cancelByUser(5, 1)).rejects.toBeInstanceOf(BadRequestException);
  });
});
