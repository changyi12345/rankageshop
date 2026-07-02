import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { buildFieldDefinitions, GameFieldDefinition, buildOrderPayload } from './g2bulk-fields.util';

const G2BULK_BASE = 'https://api.g2bulk.com';

/** Fallback when category has no image_url — match title keywords to known assets */
const CATEGORY_TITLE_IMAGES: [string, string][] = [
  ['itunes', '/images/cat_itunes_giftcards.jpg'],
  ['pubg', '/images/cat_pubg_mobile.jpg'],
  ['playstation', '/images/cat_playsation_network.jpg'],
  ['psn', '/images/cat_playsation_network.jpg'],
  ['steam', '/images/1000041588.png'],
  ['xbox', '/images/cat_xbox.jpg'],
  ['roblox', '/images/cat_roblox.jpg'],
  ['razer', '/images/cat_razer_giftcards.jpg'],
  ['nintendo', '/images/cat_nintendo.jpg'],
  ['discord', '/images/cat_discord.jpg'],
  ['free fire', '/images/cat_free_fire.jpg'],
  ['imo', '/images/cat_imo.jpg'],
  ['jawaker', '/images/1000041592.png'],
  ['new state', '/images/cat_new_state.jpg'],
  ['yalla ludo', '/images/cat_yalla_ludo.jpg'],
];

export interface G2BulkGame {
  id: number;
  code: string;
  name: string;
  image_url: string | null;
}

export interface G2BulkGamesResponse {
  success: boolean;
  games: G2BulkGame[];
}

export interface G2BulkVoucherProduct {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_title: string;
  unit_price: number;
  face_value: number | null;
  stock: number;
}

export interface G2BulkProductsResponse {
  success: boolean;
  products: G2BulkVoucherProduct[];
}

export interface G2BulkCategory {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  custom_emoji_id: string | null;
  product_count: number;
}

export interface G2BulkCategoriesResponse {
  success: boolean;
  categories: G2BulkCategory[];
}

export interface G2BulkCatalogueItem {
  id: number;
  name: string;
  amount: number;
}

export interface G2BulkCatalogueResponse {
  success: boolean;
  game: {
    code: string;
    name: string;
    image_url: string | null;
  };
  catalogues: G2BulkCatalogueItem[];
}

export interface G2BulkFieldsResponse {
  code: string;
  info: {
    fields: string[];
    notes?: string;
  };
}

export interface G2BulkServersResponse {
  code: string;
  servers: Record<string, string>;
}

export interface G2BulkValidateResponse {
  valid: string;
  name?: string;
  openid?: string;
  message?: string;
}

export interface GameFieldsResult {
  fields: GameFieldDefinition[];
  notes: string | null;
}

export interface G2BulkMeResponse {
  success: boolean;
  user_id: number;
  username: string;
  first_name: string;
  balance: number;
}

export interface G2BulkTransaction {
  id: number;
  user_id: number;
  transaction_type: 'add_balance' | 'charge_balance' | string;
  amount: string;
  balance_before: string;
  balance_after: string;
  status: string;
  description: string;
  created_at: string;
}

export interface G2BulkTransactionsResponse {
  success: boolean;
  data: G2BulkTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface G2BulkOrderItem {
  id: number;
  user_id: number;
  product_id: number;
  product_title: string;
  quantity: number;
  total_price: string;
  status: string;
  description: string;
  created_at: string;
}

export interface G2BulkOrdersResponse {
  success: boolean;
  orders: G2BulkOrderItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface G2BulkDashboardData {
  connected: boolean;
  error?: string;
  profile: {
    userId: number;
    username: string;
    firstName: string;
    balance: number;
  } | null;
  stats: {
    gamesCount: number;
    categoriesCount: number;
    productsCount: number;
  };
  recentTransactions: G2BulkTransaction[];
  recentOrders: G2BulkOrderItem[];
}

@Injectable()
export class G2bulkService {
  private readonly logger = new Logger(G2bulkService.name);
  private cachedApiKey: string | null = null;
  private cacheExpiry = 0;

  constructor(private settingsService: SettingsService) {}

  invalidateApiKeyCache() {
    this.cachedApiKey = null;
    this.cacheExpiry = 0;
  }

  async getApiKey(): Promise<string> {
    if (Date.now() < this.cacheExpiry && this.cachedApiKey !== null) {
      return this.cachedApiKey;
    }
    const secrets = await this.settingsService.getIntegrationSecrets();
    this.cachedApiKey = secrets.g2bulkApiKey;
    this.cacheExpiry = Date.now() + 30_000;
    return this.cachedApiKey;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = await this.getApiKey();
    if (apiKey) headers['X-API-Key'] = apiKey;
    return headers;
  }

  resolveImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${G2BULK_BASE}${path}`;
  }

  buildCategoryImageMap(categories: G2BulkCategory[]): Map<number, string> {
    const map = new Map<number, string>();
    for (const cat of categories) {
      const url = this.resolveCategoryImage(cat.id, cat.title, cat.image_url);
      if (url) map.set(cat.id, url);
    }
    return map;
  }

  resolveCategoryImage(
    categoryId: number,
    categoryTitle: string,
    apiImageUrl?: string | null,
    imageMap?: Map<number, string>,
  ): string | null {
    if (imageMap?.has(categoryId)) return imageMap.get(categoryId)!;
    if (apiImageUrl?.trim()) return this.resolveImageUrl(apiImageUrl);
    const title = categoryTitle.toLowerCase();
    for (const [keyword, path] of CATEGORY_TITLE_IMAGES) {
      if (title.includes(keyword)) return this.resolveImageUrl(path);
    }
    return null;
  }

  async fetchCategories(): Promise<G2BulkCategory[]> {
    const res = await fetch(`${G2BULK_BASE}/v1/category`, {
      headers: await this.authHeaders(),
    });
    if (!res.ok) {
      throw new Error(`G2Bulk categories request failed: ${res.status}`);
    }
    const data = (await res.json()) as G2BulkCategoriesResponse;
    if (!data.success || !Array.isArray(data.categories)) {
      throw new Error('Invalid G2Bulk categories response');
    }
    return data.categories;
  }

  async fetchGames(): Promise<G2BulkGame[]> {
    const res = await fetch(`${G2BULK_BASE}/v1/games`);
    if (!res.ok) {
      throw new Error(`G2Bulk games request failed: ${res.status}`);
    }
    const data = (await res.json()) as G2BulkGamesResponse;
    if (!data.success || !Array.isArray(data.games)) {
      throw new Error('Invalid G2Bulk games response');
    }
    return data.games;
  }

  async fetchVoucherProducts(): Promise<G2BulkVoucherProduct[]> {
    const res = await fetch(`${G2BULK_BASE}/v1/products`, {
      headers: await this.authHeaders(),
    });
    if (!res.ok) {
      throw new Error(`G2Bulk products request failed: ${res.status}`);
    }
    const data = (await res.json()) as G2BulkProductsResponse;
    if (!data.success || !Array.isArray(data.products)) {
      throw new Error('Invalid G2Bulk products response');
    }
    return data.products;
  }

  async fetchCatalogue(gameCode: string): Promise<G2BulkCatalogueResponse | null> {
    try {
      const res = await fetch(`${G2BULK_BASE}/v1/games/${encodeURIComponent(gameCode)}/catalogue`);
      if (!res.ok) return null;
      return (await res.json()) as G2BulkCatalogueResponse;
    } catch (err) {
      this.logger.warn(`Catalogue fetch failed for ${gameCode}`, err);
      return null;
    }
  }

  async fetchFields(gameCode: string): Promise<G2BulkFieldsResponse | null> {
    try {
      const res = await fetch(`${G2BULK_BASE}/v1/games/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: gameCode }),
      });
      if (!res.ok) return null;
      return (await res.json()) as G2BulkFieldsResponse;
    } catch (err) {
      this.logger.warn(`Fields fetch failed for ${gameCode}`, err);
      return null;
    }
  }

  async fetchServers(gameCode: string): Promise<Record<string, string> | null> {
    try {
      const res = await fetch(`${G2BULK_BASE}/v1/games/servers`, {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify({ game: gameCode }),
      });
      if (res.status === 403) return null;
      if (!res.ok) return null;
      const data = (await res.json()) as G2BulkServersResponse;
      return data.servers ?? null;
    } catch (err) {
      this.logger.warn(`Servers fetch failed for ${gameCode}`, err);
      return null;
    }
  }

  async getGameFields(gameCode: string): Promise<GameFieldsResult> {
    const fieldsRes = await this.fetchFields(gameCode);
    const apiFields = fieldsRes?.info?.fields ?? ['userid'];
    const notes = fieldsRes?.info?.notes ?? null;

    const needsServers = apiFields.some((f) =>
      ['serverid', 'server_id', 'server', 'zone', 'zoneid', 'zone_id'].includes(f.toLowerCase()),
    );
    const servers = needsServers ? await this.fetchServers(gameCode) : null;

    return {
      fields: buildFieldDefinitions(apiFields, servers),
      notes,
    };
  }

  async checkPlayerId(payload: Record<string, string>): Promise<G2BulkValidateResponse> {
    const res = await fetch(`${G2BULK_BASE}/v1/games/checkPlayerId`, {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as G2BulkValidateResponse & { message?: string };
    if (!res.ok) {
      throw new Error(data.message ?? 'Player validation failed');
    }
    return data;
  }

  async fetchMe(): Promise<G2BulkMeResponse> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('G2Bulk API key not configured');
    }
    const res = await fetch(`${G2BULK_BASE}/v1/getMe`, {
      headers: await this.authHeaders(),
    });
    const data = (await res.json()) as G2BulkMeResponse & { message?: string };
    if (!res.ok || !data.success) {
      throw new Error(data.message ?? `G2Bulk getMe failed (${res.status})`);
    }
    return data;
  }

  async fetchTransactions(page = 1, limit = 20): Promise<G2BulkTransactionsResponse> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('G2Bulk API key not configured');
    }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${G2BULK_BASE}/v1/transactions?${params}`, {
      headers: await this.authHeaders(),
    });
    const data = (await res.json()) as G2BulkTransactionsResponse & { message?: string };
    if (!res.ok || !data.success) {
      throw new Error(data.message ?? `G2Bulk transactions failed (${res.status})`);
    }
    return data;
  }

  async fetchOrders(page = 1, limit = 10): Promise<G2BulkOrdersResponse> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('G2Bulk API key not configured');
    }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${G2BULK_BASE}/v1/orders?${params}`, {
      headers: await this.authHeaders(),
    });
    const data = (await res.json()) as G2BulkOrdersResponse & { message?: string };
    if (!res.ok || !data.success) {
      throw new Error(data.message ?? `G2Bulk orders failed (${res.status})`);
    }
    return data;
  }

  async getDashboardData(): Promise<G2BulkDashboardData> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return {
        connected: false,
        error: 'G2Bulk API key not configured. Add it in Settings → Integrations.',
        profile: null,
        stats: { gamesCount: 0, categoriesCount: 0, productsCount: 0 },
        recentTransactions: [],
        recentOrders: [],
      };
    }

    try {
      const [me, games, categories, products, transactions, orders] = await Promise.all([
        this.fetchMe(),
        this.fetchGames().catch(() => [] as G2BulkGame[]),
        this.fetchCategories().catch(() => [] as G2BulkCategory[]),
        this.fetchVoucherProducts().catch(() => [] as G2BulkVoucherProduct[]),
        this.fetchTransactions(1, 15).catch(() => ({
          success: true,
          data: [],
          pagination: { page: 1, limit: 15, total: 0, total_pages: 0 },
        })),
        this.fetchOrders(1, 10).catch(() => ({
          success: true,
          orders: [],
          pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
        })),
      ]);

      return {
        connected: true,
        profile: {
          userId: me.user_id,
          username: me.username,
          firstName: me.first_name,
          balance: me.balance,
        },
        stats: {
          gamesCount: games.length,
          categoriesCount: categories.length,
          productsCount: products.length,
        },
        recentTransactions: transactions.data ?? [],
        recentOrders: orders.orders ?? [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to G2Bulk';
      this.logger.warn(`G2Bulk dashboard: ${message}`);
      return {
        connected: false,
        error: message,
        profile: null,
        stats: { gamesCount: 0, categoriesCount: 0, productsCount: 0 },
        recentTransactions: [],
        recentOrders: [],
      };
    }
  }

  async placeGameOrder(
    gameCode: string,
    params: {
      catalogue_id?: number;
      catalogue_name: string;
      playerId?: string | null;
      serverId?: string | null;
      charname?: string | null;
    },
  ): Promise<{ success: boolean; order_id?: string; message?: string }> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return { success: false, message: 'G2Bulk API key not configured' };
    }
    const code = gameCode.trim();
    if (!code) {
      return { success: false, message: 'Game code is required' };
    }
    try {
      const body = buildOrderPayload(params);
      const res = await fetch(
        `${G2BULK_BASE}/v1/games/${encodeURIComponent(code)}/order`,
        {
          method: 'POST',
          headers: await this.authHeaders(),
          body: JSON.stringify(body),
        },
      );
      const data = (await res.json()) as {
        success?: boolean;
        order_id?: string | number;
        message?: string;
      };
      if (!res.ok || !data.success) {
        return { success: false, message: data.message ?? `G2Bulk order failed (${res.status})` };
      }
      return { success: true, order_id: String(data.order_id ?? '') };
    } catch (err) {
      this.logger.error('placeGameOrder failed', err);
      return { success: false, message: err instanceof Error ? err.message : 'G2Bulk request failed' };
    }
  }

  async placeVoucherOrder(payload: {
    product_id: number;
    quantity?: number;
  }): Promise<{ success: boolean; transaction_id?: string; codes?: string[]; message?: string }> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return { success: false, message: 'G2Bulk API key not configured' };
    }
    try {
      const res = await fetch(`${G2BULK_BASE}/v1/products/purchase`, {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        success?: boolean;
        transaction_id?: string | number;
        codes?: string[];
        voucher_codes?: string[];
        message?: string;
      };
      if (!res.ok || !data.success) {
        return { success: false, message: data.message ?? `G2Bulk purchase failed (${res.status})` };
      }
      const codes = data.codes ?? data.voucher_codes ?? [];
      return {
        success: true,
        transaction_id: data.transaction_id != null ? String(data.transaction_id) : undefined,
        codes,
      };
    } catch (err) {
      this.logger.error('placeVoucherOrder failed', err);
      return { success: false, message: err instanceof Error ? err.message : 'G2Bulk request failed' };
    }
  }
}
