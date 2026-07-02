import { Injectable, NotFoundException } from '@nestjs/common';
import { G2bulkService, G2BulkVoucherProduct } from '../g2bulk/g2bulk.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService, ExchangeSettingsDto } from '../settings/settings.service';

export interface VoucherCategoryDto {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
  minPriceMmk: number | null;
  minPriceUsd: number | null;
}

export interface VoucherProductDto {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryTitle: string;
  imageUrl: string | null;
  sourcePriceUsd: number;
  unitPrice: number;
  currency: 'MMK';
  faceValue: number | null;
  stock: number;
  inStock: boolean;
}

@Injectable()
export class VouchersService {
  constructor(
    private g2bulk: G2bulkService,
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  private async hiddenVoucherIds(): Promise<Set<number>> {
    const hidden = await this.prisma.product.findMany({
      where: { type: 'voucher', isActive: false, g2bulkProductId: { not: null } },
      select: { g2bulkProductId: true },
    });
    return new Set(hidden.map((p) => p.g2bulkProductId!));
  }

  private toProductDto(
    p: G2BulkVoucherProduct,
    imageUrl: string | null,
    exchange: ExchangeSettingsDto,
    dbUnitPrice?: number | null,
    autoSync = true,
  ): VoucherProductDto {
    const pricing = this.settings.resolveUsdProductPrice(
      p.unit_price,
      exchange,
      dbUnitPrice,
      autoSync,
    );
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      categoryId: p.category_id,
      categoryTitle: p.category_title,
      imageUrl,
      sourcePriceUsd: p.unit_price,
      unitPrice: pricing.unitPrice,
      currency: 'MMK',
      faceValue: p.face_value,
      stock: p.stock,
      inStock: p.stock > 0,
    };
  }

  async findCategories(): Promise<VoucherCategoryDto[]> {
    await this.settings.assertFeatureEnabled('voucherShopEnabled');
    const [categories, products, hiddenIds, exchange] = await Promise.all([
      this.g2bulk.fetchCategories(),
      this.g2bulk.fetchVoucherProducts(),
      this.hiddenVoucherIds(),
      this.settings.getExchangeSettings(),
    ]);

    const imageMap = this.g2bulk.buildCategoryImageMap(categories);
    const visibleByCategory = new Map<number, G2BulkVoucherProduct[]>();

    for (const p of products) {
      if (hiddenIds.has(p.id)) continue;
      const list = visibleByCategory.get(p.category_id) ?? [];
      list.push(p);
      visibleByCategory.set(p.category_id, list);
    }

    return categories
      .filter((c) => c.id !== 11 && (visibleByCategory.get(c.id)?.length ?? 0) > 0)
      .map((c) => {
        const visible = visibleByCategory.get(c.id) ?? [];
        const minPriceUsd = visible.length
          ? Math.min(...visible.map((p) => p.unit_price))
          : null;
        const minPriceMmk =
          minPriceUsd != null
            ? this.settings.convertUsdToMmk(minPriceUsd, exchange)
            : null;
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          imageUrl: this.g2bulk.resolveCategoryImage(c.id, c.title, c.image_url, imageMap),
          productCount: visible.length,
          minPriceMmk,
          minPriceUsd,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  async findAll(categoryId?: number): Promise<VoucherProductDto[]> {
    await this.settings.assertFeatureEnabled('voucherShopEnabled');
    const [categories, products, hiddenIds, shop, dbOverrides] = await Promise.all([
      this.g2bulk.fetchCategories(),
      this.g2bulk.fetchVoucherProducts(),
      this.hiddenVoucherIds(),
      this.settings.getShopSettings(),
      this.prisma.product.findMany({
        where: { type: 'voucher', g2bulkProductId: { not: null } },
        select: { g2bulkProductId: true, unitPrice: true },
      }),
    ]);

    const autoSync = shop.g2bulkAutoPriceSync !== false;
    const exchange = shop;

    const priceByG2bulkId = new Map(
      dbOverrides.map((p) => [p.g2bulkProductId!, p.unitPrice]),
    );

    const imageMap = this.g2bulk.buildCategoryImageMap(categories);
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    return products
      .filter((p) => !hiddenIds.has(p.id))
      .filter((p) => categoryId == null || p.category_id === categoryId)
      .map((p) => {
        const cat = categoryById.get(p.category_id);
        const imageUrl = this.g2bulk.resolveCategoryImage(
          p.category_id,
          p.category_title,
          cat?.image_url,
          imageMap,
        );
        return this.toProductDto(
          p,
          imageUrl,
          exchange,
          priceByG2bulkId.has(p.id) ? Number(priceByG2bulkId.get(p.id)) : null,
          autoSync,
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  async findOne(id: number): Promise<VoucherProductDto> {
    await this.settings.assertFeatureEnabled('voucherShopEnabled');
    const hiddenIds = await this.hiddenVoucherIds();
    if (hiddenIds.has(id)) throw new NotFoundException('Voucher not found');

    const [categories, products, shop, dbOverride] = await Promise.all([
      this.g2bulk.fetchCategories(),
      this.g2bulk.fetchVoucherProducts(),
      this.settings.getShopSettings(),
      this.prisma.product.findFirst({
        where: { g2bulkProductId: id },
        select: { unitPrice: true },
      }),
    ]);

    const autoSync = shop.g2bulkAutoPriceSync !== false;

    const product = products.find((p) => p.id === id);
    if (!product) throw new NotFoundException('Voucher not found');

    const imageMap = this.g2bulk.buildCategoryImageMap(categories);
    const cat = categories.find((c) => c.id === product.category_id);
    const imageUrl = this.g2bulk.resolveCategoryImage(
      product.category_id,
      product.category_title,
      cat?.image_url,
      imageMap,
    );

    return this.toProductDto(
      product,
      imageUrl,
      shop,
      dbOverride?.unitPrice != null ? Number(dbOverride.unitPrice) : null,
      autoSync,
    );
  }
}
