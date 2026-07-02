import { Test, TestingModule } from '@nestjs/testing';
import { PromosService } from './promos.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

describe('PromosService', () => {
  let service: PromosService;

  const prisma = {
    promoCode: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const settings = {
    assertFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromosService,
        { provide: PrismaService, useValue: prisma },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();

    service = module.get(PromosService);
  });

  it('validate returns invalid for unknown code', async () => {
    prisma.promoCode.findUnique.mockResolvedValue(null);
    const result = await service.validate({ code: 'NOPE', subtotal: 10000 });
    expect(result.valid).toBe(false);
    expect(result.discountAmount).toBe(0);
  });

  it('validate returns discount for active promo', async () => {
    const now = new Date();
    prisma.promoCode.findUnique.mockResolvedValue({
      id: 1,
      code: 'SAVE10',
      discountPercent: 10,
      maxUsage: 100,
      usageCount: 0,
      isActive: true,
      validFrom: new Date(now.getTime() - 86400000),
      validUntil: new Date(now.getTime() + 86400000),
    });
    const result = await service.validate({ code: 'save10', subtotal: 50000 });
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(5000);
    expect(result.code).toBe('SAVE10');
  });
});
