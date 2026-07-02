import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { G2bulkService } from '../g2bulk/g2bulk.service';
import { SettingsService } from '../settings/settings.service';

export interface ResolvedOrderItem {
  product: {
    id: number;
    name: string;
    type: string;
    g2bulkGameCode: string | null;
    g2bulkProductId: number | null;
    stock: number | null;
  };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  topUpPackageId: number | null;
  topUpInput: {
    gameCode: string;
    playerId: string;
    serverId: string | null;
    playerName: string | null;
    catalogueName: string;
  } | null;
}

@Injectable()
export class OrderProductResolver {
  constructor(
    private prisma: PrismaService,
    private g2bulk: G2bulkService,
    private settings: SettingsService,
  ) {}

  async resolveItem(item: {
    productId?: number;
    g2bulkGameCode?: string;
    g2bulkProductId?: number;
    catalogueName?: string;
    packageName?: string;
    unitPrice?: number;
    quantity: number;
    playerId?: string;
    serverId?: string;
    playerName?: string;
    gameCode?: string;
  }): Promise<ResolvedOrderItem> {
    const quantity = Math.max(1, Math.floor(item.quantity || 1));

    if (item.g2bulkProductId != null) {
      return this.resolveVoucherItem(item.g2bulkProductId, quantity, item.unitPrice);
    }

    const gameCode = item.g2bulkGameCode ?? item.gameCode;
    if (gameCode) {
      if (!item.catalogueName?.trim()) {
        throw new BadRequestException('Package (catalogue) is required for game top-up');
      }
      if (!item.playerId?.trim()) {
        throw new BadRequestException('Player ID is required for game top-up');
      }
      return this.resolveTopUpItem(
        gameCode,
        item.catalogueName.trim(),
        item.packageName?.trim() ?? item.catalogueName.trim(),
        quantity,
        item.playerId.trim(),
        item.serverId?.trim() || null,
        item.playerName?.trim() || null,
        item.unitPrice,
      );
    }

    if (item.productId != null) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      if (!product.isActive) throw new BadRequestException(`Product "${product.name}" is unavailable`);
      const unitPrice = this.pickUnitPrice(Number(product.unitPrice), item.unitPrice);
      return {
        product,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
        topUpPackageId: null,
        topUpInput: null,
      };
    }

    throw new BadRequestException('Each order item must include productId, g2bulkProductId, or g2bulkGameCode');
  }

  private pickUnitPrice(dbPrice: number, clientPrice?: number): number {
    if (clientPrice != null && Number.isFinite(clientPrice) && clientPrice > 0) {
      return Math.round(clientPrice);
    }
    if (dbPrice > 0) return Math.round(dbPrice);
    throw new BadRequestException('Could not determine product price');
  }

  private async resolveVoucherItem(
    g2bulkProductId: number,
    quantity: number,
    clientUnitPrice?: number,
  ): Promise<ResolvedOrderItem> {
    const shop = await this.settings.getShopSettings();
    let product = await this.prisma.product.findFirst({ where: { g2bulkProductId } });

    const vouchers = await this.g2bulk.fetchVoucherProducts();
    const voucher = vouchers.find((v) => v.id === g2bulkProductId);
    if (!voucher) throw new NotFoundException('Voucher product not found');

    const autoSync = shop.g2bulkAutoPriceSync !== false;
    const pricing = this.settings.resolveUsdProductPrice(
      voucher.unit_price,
      shop,
      product?.unitPrice != null ? Number(product.unitPrice) : null,
      autoSync,
    );
    const unitPrice = this.pickUnitPrice(pricing.unitPrice, clientUnitPrice);

    if (product && autoSync && Math.round(Number(product.unitPrice)) !== unitPrice) {
      product = await this.prisma.product.update({
        where: { id: product.id },
        data: { unitPrice },
      });
    }

    if (!product) {
      product = await this.prisma.product.create({
        data: {
          name: voucher.title,
          type: 'voucher',
          unitPrice,
          faceValue: voucher.face_value,
          stock: voucher.stock,
          g2bulkProductId: voucher.id,
          categoryId: voucher.category_id,
          categoryTitle: voucher.category_title,
          description: voucher.description || null,
          isActive: true,
        },
      });
    }

    if (!product.isActive) throw new BadRequestException(`"${product.name}" is unavailable`);

    const stock = product.stock ?? voucher.stock;
    if (stock != null && stock < quantity) {
      throw new BadRequestException(`Insufficient stock for ${product.name}`);
    }

    return {
      product,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      topUpPackageId: null,
      topUpInput: null,
    };
  }

  private async resolveTopUpItem(
    gameCode: string,
    catalogueName: string,
    packageName: string,
    quantity: number,
    playerId: string,
    serverId: string | null,
    playerName: string | null,
    clientUnitPrice?: number,
  ): Promise<ResolvedOrderItem> {
    const exchange = await this.settings.getExchangeSettings();
    const catalogue = await this.g2bulk.fetchCatalogue(gameCode);
    const catEntry = catalogue?.catalogues?.find((c) => c.name === catalogueName);
    if (!catEntry) {
      throw new BadRequestException(`Package "${catalogueName}" not found for ${gameCode}`);
    }

    const unitPrice = this.pickUnitPrice(
      this.settings.convertUsdToMmk(catEntry.amount, exchange),
      clientUnitPrice,
    );

    let product = await this.prisma.product.findFirst({ where: { g2bulkGameCode: gameCode } });
    if (!product) {
      const games = await this.g2bulk.fetchGames();
      const game = games.find((g) => g.code === gameCode);
      if (!game) throw new NotFoundException(`Game "${gameCode}" not found`);
      product = await this.prisma.product.create({
        data: {
          name: game.name,
          type: 'direct_topup',
          unitPrice,
          stock: null,
          g2bulkGameCode: game.code,
          imageUrl: this.g2bulk.resolveImageUrl(game.image_url),
          isActive: true,
        },
      });
    }

    if (!product.isActive) throw new BadRequestException(`"${product.name}" is unavailable`);

    let topUpPackageId: number | null = null;
    const pkg = await this.prisma.topUpPackage.findFirst({
      where: { productId: product.id, g2bulkCatalogueName: catalogueName },
    });
    if (pkg) {
      topUpPackageId = pkg.id;
    }

    return {
      product,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      topUpPackageId,
      topUpInput: {
        gameCode,
        playerId,
        serverId,
        playerName,
        catalogueName,
      },
    };
  }
}
