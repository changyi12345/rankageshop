import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { G2bulkService } from '../g2bulk/g2bulk.service';
import { buildValidatePayload, getFieldLabel } from '../g2bulk/g2bulk-fields.util';
import { GameFieldDefinition } from '../g2bulk/g2bulk-fields.util';
import { SettingsService } from '../settings/settings.service';

export interface GameListItem {
  id: number;
  code: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  type: 'direct_topup';
  minPriceMmk: number | null;
  currency: 'MMK';
}

export interface GamePackageDto {
  id: number;
  name: string;
  amount: number;
  unitPrice: number;
  sourcePriceUsd: number;
  currency: 'MMK';
}

export interface GameDetail extends GameListItem {
  packages: GamePackageDto[];
  playerFields: GameFieldDefinition[];
  fieldNotes: string | null;
}

@Injectable()
export class GamesService {
  private static readonly GAME_LIST_TTL_MS = 5 * 60 * 1000;

  private gameListCache: { data: GameListItem[]; expiresAt: number } | null = null;

  constructor(
    private g2bulk: G2bulkService,
    private settings: SettingsService,
    private prisma: PrismaService,
  ) {}

  private toMmk(usd: number, exchange: Awaited<ReturnType<SettingsService['getExchangeSettings']>>): number {
    return this.settings.convertUsdToMmk(usd, exchange);
  }

  private isMlbbVariant(code: string): boolean {
    return code === 'mlbb' || code.startsWith('mlbb_');
  }

  private popularityKey(code: string): string {
    return this.isMlbbVariant(code) ? 'mlbb' : code;
  }

  private async getActiveGameCodeMap(): Promise<Map<string, boolean>> {
    const rows = await this.prisma.product.findMany({
      where: { g2bulkGameCode: { not: null } },
      select: { g2bulkGameCode: true, isActive: true },
    });
    return new Map(rows.map((r) => [r.g2bulkGameCode!, r.isActive]));
  }

  private filterActiveRawGames<T extends { code: string }>(
    games: T[],
    activeMap: Map<string, boolean>,
  ): T[] {
    return games.filter((game) => activeMap.get(game.code) !== false);
  }

  private getCachedGameList(): GameListItem[] | null {
    if (this.gameListCache && Date.now() < this.gameListCache.expiresAt) {
      return this.gameListCache.data;
    }
    return null;
  }

  private setCachedGameList(data: GameListItem[]) {
    this.gameListCache = {
      data,
      expiresAt: Date.now() + GamesService.GAME_LIST_TTL_MS,
    };
  }

  private async getOrderPopularity(): Promise<Map<string, number>> {
    const orderCounts = await this.prisma.orderTopUpInput.groupBy({
      by: ['gameCode'],
      _count: { gameCode: true },
      where: {
        order: {
          status: { in: ['COMPLETED', 'PROCESSING', 'PAYMENT_PENDING', 'PENDING'] },
        },
      },
    });

    const popularity = new Map<string, number>();
    for (const row of orderCounts) {
      const key = this.popularityKey(row.gameCode);
      popularity.set(key, (popularity.get(key) ?? 0) + row._count.gameCode);
    }
    return popularity;
  }

  private rankPopularGames(
    games: GameListItem[],
    popularity: Map<string, number>,
    limit: number,
  ): GameListItem[] {
    const seenMlbb = new Set<string>();
    const ranked = [...games]
      .filter((game) => {
        if (!this.isMlbbVariant(game.code)) return true;
        if (seenMlbb.has('mlbb')) return false;
        seenMlbb.add('mlbb');
        return true;
      })
      .sort((a, b) => {
        const scoreB = popularity.get(this.popularityKey(b.code)) ?? 0;
        const scoreA = popularity.get(this.popularityKey(a.code)) ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        const priceA = a.minPriceMmk ?? Number.MAX_SAFE_INTEGER;
        const priceB = b.minPriceMmk ?? Number.MAX_SAFE_INTEGER;
        if (priceA !== priceB) return priceA - priceB;
        return a.name.localeCompare(b.name);
      });

    return ranked.slice(0, limit);
  }

  private async hydrateGamesWithPrices(
    games: Array<{ id: number; code: string; name: string; image_url: string | null }>,
    exchange: Awaited<ReturnType<SettingsService['getExchangeSettings']>>,
  ): Promise<GameListItem[]> {
    return Promise.all(
      games.map(async (game) => {
        const catalogue = await this.g2bulk.fetchCatalogue(game.code);
        const minUsd = catalogue?.catalogues?.length
          ? Math.min(...catalogue.catalogues.map((c) => c.amount))
          : null;

        return {
          id: game.id,
          code: game.code,
          slug: game.code,
          name: game.name,
          imageUrl: this.g2bulk.resolveImageUrl(
            catalogue?.game?.image_url ?? game.image_url,
          ),
          type: 'direct_topup' as const,
          minPriceMmk: minUsd != null ? this.toMmk(minUsd, exchange) : null,
          currency: 'MMK' as const,
        };
      }),
    );
  }

  private async buildGameList(): Promise<GameListItem[]> {
    const cached = this.getCachedGameList();
    if (cached) return cached;

    const [games, exchange, activeMap] = await Promise.all([
      this.g2bulk.fetchGames(),
      this.settings.getExchangeSettings(),
      this.getActiveGameCodeMap(),
    ]);

    const activeGames = this.filterActiveRawGames(games, activeMap);
    const withPrices = await this.hydrateGamesWithPrices(activeGames, exchange);
    this.setCachedGameList(withPrices);
    return withPrices;
  }

  async findAll(): Promise<GameListItem[]> {
    await this.settings.assertFeatureEnabled('gamesTopupEnabled');
    return this.buildGameList();
  }

  async findPopular(limit = 12): Promise<GameListItem[]> {
    await this.settings.assertFeatureEnabled('gamesTopupEnabled');
    const capped = Math.min(Math.max(limit, 1), 24);

    const cached = this.getCachedGameList();
    const popularity = await this.getOrderPopularity();
    if (cached) {
      return this.rankPopularGames(cached, popularity, capped);
    }

    const [games, exchange, activeMap] = await Promise.all([
      this.g2bulk.fetchGames(),
      this.settings.getExchangeSettings(),
      this.getActiveGameCodeMap(),
    ]);

    const activeGames = this.filterActiveRawGames(games, activeMap);
    const seenMlbb = new Set<string>();
    const rankedRaw = [...activeGames]
      .filter((game) => {
        if (!this.isMlbbVariant(game.code)) return true;
        if (seenMlbb.has('mlbb')) return false;
        seenMlbb.add('mlbb');
        return true;
      })
      .sort((a, b) => {
        const scoreB = popularity.get(this.popularityKey(b.code)) ?? 0;
        const scoreA = popularity.get(this.popularityKey(a.code)) ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.name.localeCompare(b.name);
      })
      .slice(0, capped);

    const popular = await this.hydrateGamesWithPrices(rankedRaw, exchange);
    return popular;
  }

  async findOne(code: string): Promise<GameDetail> {
    await this.settings.assertFeatureEnabled('gamesTopupEnabled');
    const games = await this.g2bulk.fetchGames();
    const game = games.find((g) => g.code === code);
    if (!game) {
      throw new NotFoundException(`Game "${code}" not found`);
    }

    const [catalogue, { fields: playerFields, notes: fieldNotes }, exchange] = await Promise.all([
      this.g2bulk.fetchCatalogue(code),
      this.g2bulk.getGameFields(code),
      this.settings.getExchangeSettings(),
    ]);

    const packages: GamePackageDto[] =
      catalogue?.catalogues?.map((c) => ({
        id: c.id,
        name: c.name,
        amount: c.amount,
        sourcePriceUsd: c.amount,
        unitPrice: this.toMmk(c.amount, exchange),
        currency: 'MMK' as const,
      })) ?? [];

    const minPriceMmk = packages.length
      ? Math.min(...packages.map((p) => p.unitPrice))
      : null;

    return {
      id: game.id,
      code: game.code,
      slug: game.code,
      name: game.name,
      imageUrl: this.g2bulk.resolveImageUrl(
        catalogue?.game?.image_url ?? game.image_url,
      ),
      type: 'direct_topup',
      minPriceMmk,
      currency: 'MMK',
      packages,
      playerFields,
      fieldNotes,
    };
  }

  async validatePlayer(code: string, fieldValues: Record<string, string>) {
    const fieldsRes = await this.g2bulk.fetchFields(code);
    const apiFields = fieldsRes?.info?.fields ?? ['userid'];

    for (const field of apiFields) {
      if (!fieldValues[field]?.trim()) {
        throw new BadRequestException(`${getFieldLabel(field)} is required`);
      }
    }

    const payload = buildValidatePayload(code, apiFields, fieldValues);
    if (!payload.user_id) {
      throw new BadRequestException('User ID is required');
    }

    let result;
    try {
      result = await this.g2bulk.checkPlayerId(payload);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Player validation failed',
      );
    }

    if (result.valid !== 'valid') {
      throw new BadRequestException(
        result.message ?? 'Invalid Player ID. Please check and try again.',
      );
    }

    return {
      valid: true,
      name: result.name ?? '',
      playerName: result.name ?? '',
      openid: result.openid ?? null,
    };
  }
}
