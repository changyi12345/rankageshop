import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_PAYMENT_ACCOUNTS,
  PaymentAccount,
  parsePaymentAccounts,
} from './payment-account.types';
import {
  DEFAULT_FEATURE_FLAGS,
  FeatureFlags,
  parseFeatureFlags,
} from './feature-flags.types';
import {
  IntegrationSecrets,
  IntegrationSettingsDto,
  maskSecret,
} from './integration.types';

export interface ExchangeSettingsDto {
  usdToMmkRate: number;
  priceMarkupPercent: number;
  updatedAt: string;
}

export interface ShopSettingsDto {
  shopName: string;
  shopTagline: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  supportTelegram: string | null;
  liveChatUrl: string | null;
  paymentMethods: string[];
  paymentAccounts: PaymentAccount[];
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  minWalletTopup: number;
  logoUrl: string | null;
  faviconUrl: string | null;
  featureFlags: FeatureFlags;
  updatedAt: string;
}

export interface FullShopSettingsDto extends ShopSettingsDto, ExchangeSettingsDto {
  g2bulkLowBalanceThreshold: number | null;
  g2bulkPriceAlertMinPct: number;
  g2bulkPriceAlertMinUsd: number;
  g2bulkAutoPriceSync: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private async ensureSettings() {
    return this.prisma.shopSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        shopName: 'RanKageShop',
        paymentMethods: ['KBZ Pay', 'Wave Pay', 'Bank Transfer'],
        usdToMmkRate: 4500,
        priceMarkupPercent: 0,
        minWalletTopup: 1000,
      },
    });
  }

  private mapShopRow(row: Awaited<ReturnType<typeof this.ensureSettings>>): FullShopSettingsDto {
    const paymentAccounts = parsePaymentAccounts(
      row.paymentAccounts,
      row.paymentMethods ?? [],
      row.contactPhone,
      row.shopName,
    );
    return {
      shopName: row.shopName,
      shopTagline: row.shopTagline,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      supportTelegram: row.supportTelegram,
      liveChatUrl: row.liveChatUrl,
      paymentMethods: paymentAccounts.filter((a) => a.enabled !== false).map((a) => a.name),
      paymentAccounts,
      maintenanceMode: row.maintenanceMode,
      maintenanceMessage: row.maintenanceMessage,
      minWalletTopup: Number(row.minWalletTopup),
      logoUrl: row.logoUrl,
      faviconUrl: row.faviconUrl,
      featureFlags: parseFeatureFlags(row.featureFlags),
      usdToMmkRate: Number(row.usdToMmkRate),
      priceMarkupPercent: Number(row.priceMarkupPercent),
      g2bulkLowBalanceThreshold:
        row.g2bulkLowBalanceThreshold != null ? Number(row.g2bulkLowBalanceThreshold) : null,
      g2bulkPriceAlertMinPct: Number(row.g2bulkPriceAlertMinPct ?? 2),
      g2bulkPriceAlertMinUsd: Number(row.g2bulkPriceAlertMinUsd ?? 0.25),
      g2bulkAutoPriceSync: row.g2bulkAutoPriceSync !== false,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getFeatureFlags(): Promise<FeatureFlags> {
    const row = await this.ensureSettings();
    return parseFeatureFlags(row.featureFlags);
  }

  async assertFeatureEnabled(flag: keyof FeatureFlags): Promise<void> {
    const flags = await this.getFeatureFlags();
    if (!flags[flag]) {
      throw new ForbiddenException('This feature is currently disabled');
    }
  }

  async getShopSettings(): Promise<FullShopSettingsDto> {
    const row = await this.ensureSettings();
    return this.mapShopRow(row);
  }

  async getPublicShopInfo(): Promise<ShopSettingsDto> {
    try {
      const full = await this.getShopSettings();
      const activeAccounts = full.paymentAccounts.filter((a) => a.enabled !== false);
      return {
        shopName: full.shopName,
        shopTagline: full.shopTagline,
        contactEmail: full.contactEmail,
        contactPhone: full.contactPhone,
        supportTelegram: full.supportTelegram,
        liveChatUrl: full.liveChatUrl,
        paymentMethods: activeAccounts.map((a) => a.name),
        paymentAccounts: activeAccounts,
        maintenanceMode: full.maintenanceMode,
        maintenanceMessage: full.maintenanceMessage,
        minWalletTopup: full.minWalletTopup,
        logoUrl: full.logoUrl,
        faviconUrl: full.faviconUrl,
        featureFlags: full.featureFlags,
        updatedAt: full.updatedAt,
      };
    } catch {
      const paymentAccounts = parsePaymentAccounts(
        null,
        DEFAULT_PAYMENT_ACCOUNTS.map((a) => a.name),
        null,
        'RanKageShop',
      );
      return {
        shopName: 'RanKageShop',
        shopTagline: null,
        contactEmail: null,
        contactPhone: null,
        supportTelegram: null,
        liveChatUrl: null,
        paymentMethods: paymentAccounts.map((a) => a.name),
        paymentAccounts,
        maintenanceMode: false,
        maintenanceMessage: null,
        minWalletTopup: 1000,
        logoUrl: null,
        faviconUrl: null,
        featureFlags: { ...DEFAULT_FEATURE_FLAGS },
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async updateShopSettings(data: {
    shopName?: string;
    shopTagline?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    supportTelegram?: string | null;
    liveChatUrl?: string | null;
    paymentMethods?: string[];
    paymentAccounts?: PaymentAccount[];
    maintenanceMode?: boolean;
    maintenanceMessage?: string | null;
    minWalletTopup?: number;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    featureFlags?: Partial<FeatureFlags>;
    g2bulkLowBalanceThreshold?: number | null;
    g2bulkPriceAlertMinPct?: number;
    g2bulkPriceAlertMinUsd?: number;
    g2bulkAutoPriceSync?: boolean;
  }): Promise<FullShopSettingsDto> {
    if (data.minWalletTopup != null && (!Number.isFinite(data.minWalletTopup) || data.minWalletTopup <= 0)) {
      throw new BadRequestException('Minimum wallet top-up must be greater than 0');
    }
    if (data.shopName != null && !data.shopName.trim()) {
      throw new BadRequestException('Shop name is required');
    }

    let paymentAccountsUpdate: PaymentAccount[] | undefined;
    if (data.paymentAccounts != null) {
      paymentAccountsUpdate = data.paymentAccounts
        .map((item, index) => ({
          id: item.id?.trim() || `method-${index}`,
          name: item.name?.trim() ?? '',
          accountNumber: item.accountNumber?.trim() ?? '',
          accountHolder: item.accountHolder?.trim() ?? '',
          enabled: item.enabled === false ? false : true,
        }))
        .filter((item) => item.name.length > 0);
      if (paymentAccountsUpdate.length === 0) {
        throw new BadRequestException('Add at least one payment method');
      }
    }

    let featureFlagsUpdate: FeatureFlags | undefined;
    if (data.featureFlags != null) {
      const current = parseFeatureFlags((await this.ensureSettings()).featureFlags);
      featureFlagsUpdate = { ...current, ...data.featureFlags };
    }

    if (
      data.g2bulkLowBalanceThreshold != null &&
      (!Number.isFinite(data.g2bulkLowBalanceThreshold) || data.g2bulkLowBalanceThreshold < 0)
    ) {
      throw new BadRequestException('G2Bulk low balance threshold must be 0 or greater');
    }
    if (
      data.g2bulkPriceAlertMinPct != null &&
      (!Number.isFinite(data.g2bulkPriceAlertMinPct) ||
        data.g2bulkPriceAlertMinPct < 0 ||
        data.g2bulkPriceAlertMinPct > 100)
    ) {
      throw new BadRequestException('G2Bulk price alert minimum percent must be 0–100');
    }
    if (
      data.g2bulkPriceAlertMinUsd != null &&
      (!Number.isFinite(data.g2bulkPriceAlertMinUsd) || data.g2bulkPriceAlertMinUsd < 0)
    ) {
      throw new BadRequestException('G2Bulk price alert minimum USD must be 0 or greater');
    }

    const row = await this.prisma.shopSettings.upsert({
      where: { id: 1 },
      update: {
        ...(data.shopName != null ? { shopName: data.shopName.trim() } : {}),
        ...(data.shopTagline !== undefined ? { shopTagline: data.shopTagline } : {}),
        ...(data.contactEmail !== undefined ? { contactEmail: data.contactEmail } : {}),
        ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone } : {}),
        ...(data.supportTelegram !== undefined ? { supportTelegram: data.supportTelegram } : {}),
        ...(data.liveChatUrl !== undefined ? { liveChatUrl: data.liveChatUrl } : {}),
        ...(data.paymentMethods != null ? { paymentMethods: data.paymentMethods } : {}),
        ...(paymentAccountsUpdate != null
          ? {
              paymentAccounts: paymentAccountsUpdate as unknown as Prisma.InputJsonValue,
              paymentMethods: paymentAccountsUpdate.filter((a) => a.enabled !== false).map((a) => a.name),
            }
          : {}),
        ...(data.maintenanceMode !== undefined ? { maintenanceMode: data.maintenanceMode } : {}),
        ...(data.maintenanceMessage !== undefined ? { maintenanceMessage: data.maintenanceMessage } : {}),
        ...(data.minWalletTopup != null ? { minWalletTopup: data.minWalletTopup } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        ...(data.faviconUrl !== undefined ? { faviconUrl: data.faviconUrl } : {}),
        ...(featureFlagsUpdate != null
          ? { featureFlags: featureFlagsUpdate as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.g2bulkLowBalanceThreshold !== undefined
          ? { g2bulkLowBalanceThreshold: data.g2bulkLowBalanceThreshold }
          : {}),
        ...(data.g2bulkPriceAlertMinPct !== undefined
          ? { g2bulkPriceAlertMinPct: data.g2bulkPriceAlertMinPct }
          : {}),
        ...(data.g2bulkPriceAlertMinUsd !== undefined
          ? { g2bulkPriceAlertMinUsd: data.g2bulkPriceAlertMinUsd }
          : {}),
        ...(data.g2bulkAutoPriceSync !== undefined
          ? { g2bulkAutoPriceSync: data.g2bulkAutoPriceSync }
          : {}),
      },
      create: {
        id: 1,
        shopName: data.shopName?.trim() ?? 'RanKageShop',
        shopTagline: data.shopTagline ?? null,
        contactEmail: data.contactEmail ?? null,
        contactPhone: data.contactPhone ?? null,
        supportTelegram: data.supportTelegram ?? null,
        paymentMethods: data.paymentMethods ?? DEFAULT_PAYMENT_ACCOUNTS.map((a) => a.name),
        paymentAccounts: (data.paymentAccounts ?? DEFAULT_PAYMENT_ACCOUNTS) as unknown as Prisma.InputJsonValue,
        maintenanceMode: data.maintenanceMode ?? false,
        maintenanceMessage: data.maintenanceMessage ?? null,
        minWalletTopup: data.minWalletTopup ?? 1000,
        usdToMmkRate: 4500,
        priceMarkupPercent: 0,
      },
    });

    return this.mapShopRow(row);
  }

  async getExchangeSettings(): Promise<ExchangeSettingsDto> {
    const row = await this.ensureSettings();
    return {
      usdToMmkRate: Number(row.usdToMmkRate),
      priceMarkupPercent: Number(row.priceMarkupPercent),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateExchangeSettings(data: {
    usdToMmkRate: number;
    priceMarkupPercent?: number;
  }): Promise<ExchangeSettingsDto> {
    if (!Number.isFinite(data.usdToMmkRate) || data.usdToMmkRate <= 0) {
      throw new BadRequestException('USD to MMK rate must be greater than 0');
    }
    const markup = data.priceMarkupPercent ?? 0;
    if (!Number.isFinite(markup) || markup < 0 || markup > 100) {
      throw new BadRequestException('Markup must be between 0 and 100');
    }

    const row = await this.prisma.shopSettings.upsert({
      where: { id: 1 },
      update: {
        usdToMmkRate: data.usdToMmkRate,
        priceMarkupPercent: markup,
      },
      create: {
        id: 1,
        usdToMmkRate: data.usdToMmkRate,
        priceMarkupPercent: markup,
      },
    });

    return {
      usdToMmkRate: Number(row.usdToMmkRate),
      priceMarkupPercent: Number(row.priceMarkupPercent),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  convertUsdToMmk(usd: number, settings: ExchangeSettingsDto): number {
    const raw = usd * settings.usdToMmkRate * (1 + settings.priceMarkupPercent / 100);
    return Math.round(raw);
  }

  isMmkPriceOverride(dbPrice: number, sourceUsd: number, convertedMmk: number): boolean {
    return dbPrice >= 1000 || dbPrice >= convertedMmk * 0.5;
  }

  resolveUsdProductPrice(
    sourceUsd: number,
    settings: ExchangeSettingsDto,
    dbUnitPrice?: number | null,
    autoSync = true,
  ): { unitPrice: number; sourcePrice: number; sourceCurrency: 'USD' } {
    const converted = this.convertUsdToMmk(sourceUsd, settings);
    if (!autoSync) {
      const dbPrice = dbUnitPrice != null ? Number(dbUnitPrice) : 0;
      if (dbPrice > 0 && this.isMmkPriceOverride(dbPrice, sourceUsd, converted)) {
        return {
          unitPrice: Math.round(dbPrice),
          sourcePrice: sourceUsd,
          sourceCurrency: 'USD',
        };
      }
    }

    return {
      unitPrice: converted,
      sourcePrice: sourceUsd,
      sourceCurrency: 'USD',
    };
  }

  private resolveG2bulkApiKey(dbKey: string | null | undefined): {
    key: string;
    source: 'database' | 'environment' | 'none';
  } {
    if (dbKey?.trim()) return { key: dbKey.trim(), source: 'database' };
    const envKey = process.env.G2BULK_API_KEY?.trim() ?? '';
    if (envKey) return { key: envKey, source: 'environment' };
    return { key: '', source: 'none' };
  }

  private resolveSmtp(row: Awaited<ReturnType<typeof this.ensureSettings>>): {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    source: 'database' | 'environment' | 'none';
  } {
    const dbHost = row.smtpHost?.trim() ?? '';
    const dbUser = row.smtpUser?.trim() ?? '';
    const dbPass = row.smtpPass?.trim() ?? '';
    const dbFrom = row.smtpFrom?.trim() ?? '';
    const dbPort = row.smtpPort ?? 587;

    if (dbHost && dbUser && dbPass) {
      return {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        pass: dbPass,
        from: dbFrom || process.env.SMTP_FROM?.trim() || 'noreply@rankage.shop',
        source: 'database',
      };
    }

    const envHost = process.env.SMTP_HOST?.trim() ?? '';
    const envUser = process.env.SMTP_USER?.trim() ?? '';
    const envPass = process.env.SMTP_PASS?.trim() ?? '';
    if (envHost && envUser && envPass) {
      return {
        host: envHost,
        port: Number(process.env.SMTP_PORT) || 587,
        user: envUser,
        pass: envPass,
        from: process.env.SMTP_FROM?.trim() || 'noreply@rankage.shop',
        source: 'environment',
      };
    }

    return {
      host: '',
      port: dbPort,
      user: '',
      pass: '',
      from: dbFrom || process.env.SMTP_FROM?.trim() || 'noreply@rankage.shop',
      source: 'none',
    };
  }

  async getIntegrationSecrets(): Promise<IntegrationSecrets> {
    const row = await this.ensureSettings();
    const g2bulk = this.resolveG2bulkApiKey(row.g2bulkApiKey);
    const smtp = this.resolveSmtp(row);
    return {
      g2bulkApiKey: g2bulk.key,
      smtpHost: smtp.host,
      smtpPort: smtp.port,
      smtpUser: smtp.user,
      smtpPass: smtp.pass,
      smtpFrom: smtp.from,
    };
  }

  async getIntegrationSettings(): Promise<IntegrationSettingsDto> {
    const row = await this.ensureSettings();
    const g2bulk = this.resolveG2bulkApiKey(row.g2bulkApiKey);
    const smtp = this.resolveSmtp(row);
    const smtpConfigured = Boolean(smtp.host && smtp.user && smtp.pass);

    return {
      g2bulkApiKeyConfigured: Boolean(g2bulk.key),
      g2bulkApiKeyMasked: g2bulk.key ? maskSecret(g2bulk.key) : null,
      g2bulkApiKeySource: g2bulk.source,
      smtpHost: row.smtpHost?.trim() || process.env.SMTP_HOST?.trim() || null,
      smtpPort: row.smtpPort ?? (Number(process.env.SMTP_PORT) || 587),
      smtpUser: row.smtpUser?.trim() || process.env.SMTP_USER?.trim() || null,
      smtpPassConfigured: smtpConfigured,
      smtpPassMasked: smtp.pass ? maskSecret(smtp.pass) : null,
      smtpFrom:
        row.smtpFrom?.trim() ||
        process.env.SMTP_FROM?.trim() ||
        'noreply@rankage.shop',
      smtpConfigured,
      smtpSource: smtp.source,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateIntegrationSettings(data: {
    g2bulkApiKey?: string | null;
    smtpHost?: string | null;
    smtpPort?: number;
    smtpUser?: string | null;
    smtpPass?: string | null;
    smtpFrom?: string | null;
  }): Promise<IntegrationSettingsDto> {
    const row = await this.ensureSettings();
    const update: Prisma.ShopSettingsUpdateInput = {};

    if (data.g2bulkApiKey !== undefined) {
      const trimmed = data.g2bulkApiKey?.trim() ?? '';
      update.g2bulkApiKey = trimmed.length > 0 ? trimmed : null;
    }

    if (data.smtpHost !== undefined) {
      update.smtpHost = data.smtpHost?.trim() || null;
    }
    if (data.smtpPort != null) {
      if (!Number.isFinite(data.smtpPort) || data.smtpPort <= 0 || data.smtpPort > 65535) {
        throw new BadRequestException('SMTP port must be between 1 and 65535');
      }
      update.smtpPort = data.smtpPort;
    }
    if (data.smtpUser !== undefined) {
      update.smtpUser = data.smtpUser?.trim() || null;
    }
    if (data.smtpPass !== undefined) {
      const trimmed = data.smtpPass?.trim() ?? '';
      if (trimmed.length > 0) {
        update.smtpPass = trimmed;
      }
    }
    if (data.smtpFrom !== undefined) {
      update.smtpFrom = data.smtpFrom?.trim() || null;
    }

    if (Object.keys(update).length > 0) {
      await this.prisma.shopSettings.update({
        where: { id: row.id },
        data: update,
      });
    }

    return this.getIntegrationSettings();
  }
}
