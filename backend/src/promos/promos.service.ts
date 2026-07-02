import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreatePromoDto, UpdatePromoDto, ValidatePromoDto } from './dto/promo.dto';

@Injectable()
export class PromosService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  findAll() {
    return this.prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreatePromoDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.promoCode.findUnique({ where: { code } });
    if (existing) throw new BadRequestException('Promo code already exists');

    return this.prisma.promoCode.create({
      data: {
        code,
        discountPercent: dto.discountPercent,
        maxUsage: dto.maxUsage,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: number, dto: UpdatePromoDto) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo not found');

    return this.prisma.promoCode.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.discountPercent != null && { discountPercent: dto.discountPercent }),
        ...(dto.maxUsage != null && { maxUsage: dto.maxUsage }),
        ...(dto.validFrom && { validFrom: new Date(dto.validFrom) }),
        ...(dto.validUntil && { validUntil: new Date(dto.validUntil) }),
        ...(dto.isActive != null && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: number) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo not found');
    return this.prisma.promoCode.delete({ where: { id } });
  }

  async validate(dto: ValidatePromoDto) {
    await this.settings.assertFeatureEnabled('promoCodesEnabled');
    const code = dto.code.trim().toUpperCase();
    const promo = await this.prisma.promoCode.findUnique({ where: { code } });
    const now = new Date();

    if (
      !promo ||
      !promo.isActive ||
      promo.usageCount >= promo.maxUsage ||
      now < promo.validFrom ||
      now > promo.validUntil
    ) {
      return { valid: false, discountPercent: 0, discountAmount: 0 };
    }

    const discountAmount = Math.round((dto.subtotal * promo.discountPercent) / 100);
    return {
      valid: true,
      code: promo.code,
      discountPercent: promo.discountPercent,
      discountAmount,
    };
  }

  async applyUsage(code: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!promo) return;
    await this.prisma.promoCode.update({
      where: { id: promo.id },
      data: { usageCount: { increment: 1 } },
    });
  }
}
