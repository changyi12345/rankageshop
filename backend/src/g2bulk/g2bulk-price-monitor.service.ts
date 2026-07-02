import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { G2bulkService } from './g2bulk.service';
import { SettingsService, ExchangeSettingsDto } from '../settings/settings.service';

export interface G2BulkPriceAlertDto {
  id: number;
  itemKey: string;
  itemType: string;
  label: string;
  previousUsd: number;
  currentUsd: number;
  increaseUsd: number;
  increasePct: number;
  createdAt: string;
}

interface PriceItem {
  itemKey: string;
  itemType: 'voucher' | 'topup';
  label: string;
  sourceUsd: number;
  gameCode?: string;
  catalogueName?: string;
}

@Injectable()
export class G2bulkPriceMonitorService {
  private readonly logger = new Logger(G2bulkPriceMonitorService.name);
  private lastCheckAt = 0;
  private readonly cooldownMs = 10 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private g2bulk: G2bulkService,
    private settings: SettingsService,
  ) {}

  async listAlerts(opts?: { limit?: number; undismissedOnly?: boolean }): Promise<G2BulkPriceAlertDto[]> {
    const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
    const rows = await this.prisma.g2BulkPriceAlert.findMany({
      where: opts?.undismissedOnly ? { dismissed: false } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.mapAlert(r));
  }

  async undismissedCount(): Promise<number> {
    return this.prisma.g2BulkPriceAlert.count({ where: { dismissed: false } });
  }

  async dismissAlert(id: number) {
    await this.prisma.g2BulkPriceAlert.updateMany({
      where: { id, dismissed: false },
      data: { dismissed: true },
    });
    return { ok: true };
  }

  async dismissAllAlerts() {
    const result = await this.prisma.g2BulkPriceAlert.updateMany({
      where: { dismissed: false },
      data: { dismissed: true },
    });
    return { dismissed: result.count };
  }

  /** Compare G2Bulk API prices with stored snapshots; create alerts on increases. */
  async checkPrices(force = false): Promise<{
    checked: number;
    newAlerts: number;
    pricesUpdated: number;
    error?: string;
    baselineOnly?: boolean;
  }> {
    const apiKey = await this.g2bulk.getApiKey();
    if (!apiKey?.trim()) {
      return {
        checked: 0,
        newAlerts: 0,
        pricesUpdated: 0,
        error: 'G2Bulk API key not configured. Add it in Settings → Email & API.',
      };
    }

    const now = Date.now();
    if (!force && now - this.lastCheckAt < this.cooldownMs) {
      return {
        checked: 0,
        newAlerts: 0,
        pricesUpdated: 0,
        error: 'Price check skipped — wait 10 minutes between automatic checks (use force to run now).',
      };
    }

    this.lastCheckAt = now;

    let items: PriceItem[];
    try {
      items = await this.collectCurrentPrices();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Price check failed';
      this.logger.warn(`Price check failed: ${message}`);
      return { checked: 0, newAlerts: 0, pricesUpdated: 0, error: message };
    }

    const shop = await this.settings.getShopSettings();
    const rawMinPct = Number(shop.g2bulkPriceAlertMinPct ?? 2);
    const minPct = rawMinPct > 0 ? rawMinPct : 2;
    const rawMinUsd = Number(shop.g2bulkPriceAlertMinUsd ?? 0.25);
    const minUsd = rawMinUsd > 0 ? rawMinUsd : 0.25;
    const autoSync = shop.g2bulkAutoPriceSync !== false;

    const snapshots = await this.prisma.g2BulkPriceSnapshot.findMany();
    const snapshotMap = new Map(snapshots.map((s) => [s.itemKey, s]));
    const hadSnapshots = snapshots.length > 0;

    let newAlerts = 0;
    let seeded = 0;

    for (const item of items) {
      const prev = snapshotMap.get(item.itemKey);
      if (!prev) {
        await this.prisma.g2BulkPriceSnapshot.create({
          data: {
            itemKey: item.itemKey,
            itemType: item.itemType,
            label: item.label,
            sourceUsd: item.sourceUsd,
          },
        });
        seeded += 1;
        continue;
      }

      const prevUsd = Number(prev.sourceUsd);
      const currUsd = item.sourceUsd;

      if (currUsd > prevUsd) {
        const increaseUsd = currUsd - prevUsd;
        const increasePct = prevUsd > 0 ? (increaseUsd / prevUsd) * 100 : 100;

        if (increasePct >= minPct && increaseUsd >= minUsd) {
          const existing = await this.prisma.g2BulkPriceAlert.findFirst({
            where: { itemKey: item.itemKey, dismissed: false },
            orderBy: { createdAt: 'desc' },
          });

          const alertData = {
            itemType: item.itemType,
            label: item.label,
            previousUsd: existing ? Number(existing.previousUsd) : prevUsd,
            currentUsd: currUsd,
            increaseUsd: existing ? currUsd - Number(existing.previousUsd) : increaseUsd,
            increasePct: existing
              ? prevUsd > 0
                ? Math.round(((currUsd - Number(existing.previousUsd)) / Number(existing.previousUsd)) * 10000) / 100
                : increasePct
              : Math.round(increasePct * 100) / 100,
          };

          if (existing) {
            if (currUsd > Number(existing.currentUsd) + 0.0001) {
              await this.prisma.g2BulkPriceAlert.update({
                where: { id: existing.id },
                data: alertData,
              });
            }
          } else {
            await this.prisma.g2BulkPriceAlert.create({
              data: { itemKey: item.itemKey, ...alertData },
            });
            newAlerts += 1;
          }
        }
      }

      if (Math.abs(currUsd - prevUsd) > 0.0001 || prev.label !== item.label) {
        await this.prisma.g2BulkPriceSnapshot.update({
          where: { itemKey: item.itemKey },
          data: { sourceUsd: currUsd, label: item.label },
        });
      }
    }

    if (newAlerts > 0) {
      this.logger.log(`G2Bulk price increase: ${newAlerts} new alert(s)`);
    }

    const pricesUpdated = autoSync ? await this.syncProductPrices(items, shop) : 0;
    if (pricesUpdated > 0) {
      this.logger.log(`G2Bulk auto price sync: ${pricesUpdated} product(s) updated`);
    }

    const baselineOnly = !hadSnapshots && seeded > 0;

    return { checked: items.length, newAlerts, pricesUpdated, baselineOnly };
  }

  /** Write latest G2Bulk USD → MMK (with markup) into Product rows for admin/reporting. */
  private async syncProductPrices(
    items: PriceItem[],
    shop: ExchangeSettingsDto,
  ): Promise<number> {
    let updated = 0;

    for (const item of items) {
      if (item.itemType === 'voucher') {
        const g2bulkProductId = Number(item.itemKey.replace('voucher:', ''));
        if (!Number.isFinite(g2bulkProductId)) continue;

        const mmk = this.settings.convertUsdToMmk(item.sourceUsd, shop);
        const result = await this.prisma.product.updateMany({
          where: { g2bulkProductId, type: 'voucher' },
          data: { unitPrice: mmk },
        });
        updated += result.count;
        continue;
      }

      if (item.itemType === 'topup' && item.gameCode && item.catalogueName) {
        const mmk = this.settings.convertUsdToMmk(item.sourceUsd, shop);
        const result = await this.prisma.topUpPackage.updateMany({
          where: {
            game: { g2bulkCode: item.gameCode },
            g2bulkCatalogueName: item.catalogueName,
          },
          data: { price: mmk },
        });
        updated += result.count;
      }
    }

    return updated;
  }

  private async collectCurrentPrices(): Promise<PriceItem[]> {
    const [vouchers, games] = await Promise.all([
      this.g2bulk.fetchVoucherProducts(),
      this.g2bulk.fetchGames(),
    ]);

    const items: PriceItem[] = vouchers.map((v) => ({
      itemKey: `voucher:${v.id}`,
      itemType: 'voucher' as const,
      label: v.title,
      sourceUsd: v.unit_price,
    }));

    const catalogues = await Promise.all(
      games.map(async (game) => {
        try {
          const cat = await this.g2bulk.fetchCatalogue(game.code);
          return { game, catalogues: cat?.catalogues ?? [] };
        } catch {
          return { game, catalogues: [] as { id: number; name: string; amount: number }[] };
        }
      }),
    );

    for (const { game, catalogues: pkgs } of catalogues) {
      for (const pkg of pkgs) {
        items.push({
          itemKey: `topup:${game.code}:${pkg.id}`,
          itemType: 'topup',
          label: `${game.name} — ${pkg.name}`,
          sourceUsd: pkg.amount,
          gameCode: game.code,
          catalogueName: pkg.name,
        });
      }
    }

    return items;
  }

  private mapAlert(row: {
    id: number;
    itemKey: string;
    itemType: string;
    label: string;
    previousUsd: { toString(): string };
    currentUsd: { toString(): string };
    increaseUsd: { toString(): string };
    increasePct: { toString(): string };
    createdAt: Date;
  }): G2BulkPriceAlertDto {
    return {
      id: row.id,
      itemKey: row.itemKey,
      itemType: row.itemType,
      label: row.label,
      previousUsd: Number(row.previousUsd),
      currentUsd: Number(row.currentUsd),
      increaseUsd: Number(row.increaseUsd),
      increasePct: Number(row.increasePct),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
