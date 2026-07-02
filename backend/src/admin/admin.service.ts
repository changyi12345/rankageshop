import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RejectPaymentDto } from '../orders/dto/payment-proof.dto';
import { G2bulkService } from '../g2bulk/g2bulk.service';
import { G2bulkPriceMonitorService } from '../g2bulk/g2bulk-price-monitor.service';
import { SettingsService, ExchangeSettingsDto } from '../settings/settings.service';
import { OrderFulfillmentService } from '../orders/order-fulfillment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserInboxService } from '../notifications/user-inbox.service';
import { ChatService } from '../chat/chat.service';

export interface AdminProductDto {
  id: number | null;
  g2bulkId: number;
  name: string;
  type: string;
  typeLabel: string;
  sourcePrice: number | null;
  sourceCurrency: 'USD' | null;
  unitPrice: number;
  currency: 'MMK';
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  g2bulkGameCode: string | null;
  g2bulkProductId: number | null;
  categoryTitle: string | null;
  description: string | null;
  fromApi: boolean;
}

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private g2bulk: G2bulkService,
    private g2bulkPriceMonitor: G2bulkPriceMonitorService,
    private settings: SettingsService,
    private fulfillment: OrderFulfillmentService,
    private notifications: NotificationsService,
    private userInbox: UserInboxService,
    private chat: ChatService,
  ) {}

  private async logActivity(
    action: string,
    entity?: string,
    entityId?: string | number,
    detail?: string,
  ) {
    await this.prisma.adminActivityLog.create({
      data: {
        action,
        entity,
        entityId: entityId != null ? String(entityId) : null,
        detail,
      },
    });
  }

  async getDashboardStats() {
    const totalSales = await this.prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'COMPLETED' },
    });
    const totalOrders = await this.prisma.order.count();
    const totalUsers = await this.prisma.user.count();
    const pendingOrders = await this.prisma.order.count({
      where: { status: { in: ['PENDING', 'PAYMENT_PENDING'] } },
    });

    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weekOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: 'COMPLETED',
      },
      select: { totalPrice: true, createdAt: true },
    });

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesChart = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const amount = weekOrders
        .filter((o) => o.createdAt.toISOString().slice(0, 10) === key)
        .reduce((s, o) => s + Number(o.totalPrice), 0);
      return { day: dayLabels[d.getDay()], date: key, amount };
    });

    const pendingWalletTopups = await this.prisma.walletTransaction.count({
      where: { type: 'topup', status: 'PENDING' },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [todayOrders, todaySalesAgg, activePromos, shopSettings] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { createdAt: { gte: todayStart }, status: 'COMPLETED' },
      }),
      this.prisma.promoCode.count({ where: { isActive: true } }),
      this.settings.getShopSettings(),
    ]);

    let g2bulkBalanceAlert: { balance: number; threshold: number } | null = null;
    const threshold = shopSettings.g2bulkLowBalanceThreshold ?? 0;
    if (threshold > 0) {
      try {
        const g2 = await this.g2bulk.getDashboardData();
        if (g2.connected && g2.profile && g2.profile.balance < threshold) {
          g2bulkBalanceAlert = { balance: g2.profile.balance, threshold };
        }
      } catch {
        /* G2Bulk unavailable */
      }
    }

    const [g2bulkPriceAlertCount, g2bulkPriceAlerts] = await Promise.all([
      this.g2bulkPriceMonitor.undismissedCount(),
      this.g2bulkPriceMonitor.listAlerts({ limit: 8, undismissedOnly: true }),
    ]);

    const totalProducts = await this.prisma.product.count({ where: { isActive: true } });
    const pendingChatMessages = await this.chat.countUnreadForAdmin();

    return {
      totalSales: Number(totalSales._sum.totalPrice ?? 0),
      totalOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      pendingWalletTopups,
      pendingChatMessages,
      todayOrders,
      todaySales: Number(todaySalesAgg._sum.totalPrice ?? 0),
      activePromos,
      salesChart,
      g2bulkBalanceAlert,
      g2bulkPriceAlertCount,
      g2bulkPriceAlerts,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        customer: o.user.username,
        total: Number(o.totalPrice),
        status: o.status,
      })),
    };
  }

  async getNotifications() {
    const [pendingOrders, pendingWalletTopups, orders, topups, priceAlerts, shopSettings] =
      await Promise.all([
      this.prisma.order.count({
        where: { status: { in: ['PENDING', 'PAYMENT_PENDING'] } },
      }),
      this.prisma.walletTransaction.count({
        where: { type: 'topup', status: 'PENDING' },
      }),
      this.prisma.order.findMany({
        where: { status: { in: ['PENDING', 'PAYMENT_PENDING'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { username: true } },
          product: { select: { name: true } },
        },
      }),
      this.prisma.walletTransaction.findMany({
        where: { type: 'topup', status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { username: true } } },
      }),
      this.g2bulkPriceMonitor.listAlerts({ limit: 15, undismissedOnly: true }),
      this.settings.getShopSettings(),
    ]);

    let g2bulkBalanceAlert: { balance: number; threshold: number } | null = null;
    const balanceThreshold = Number(shopSettings.g2bulkLowBalanceThreshold ?? 0);
    if (balanceThreshold > 0) {
      try {
        const g2 = await this.g2bulk.getDashboardData();
        if (g2.connected && g2.profile && g2.profile.balance < balanceThreshold) {
          g2bulkBalanceAlert = { balance: g2.profile.balance, threshold: balanceThreshold };
        }
      } catch {
        /* G2Bulk unavailable */
      }
    }

    const items = [
      ...(g2bulkBalanceAlert
        ? [
            {
              key: 'g2bulk-balance-alert',
              type: 'g2bulk_balance' as const,
              id: 0,
              title: 'G2Bulk balance low',
              message: `Supplier balance $${g2bulkBalanceAlert.balance.toFixed(2)} is below your $${g2bulkBalanceAlert.threshold.toFixed(2)} threshold.`,
              createdAt: new Date().toISOString(),
              href: '/admin/g2bulk',
            },
          ]
        : []),
      ...(priceAlerts.length > 0
        ? [
            {
              key: 'g2bulk-price-summary',
              type: 'g2bulk_price' as const,
              id: priceAlerts[0].id,
              title: `G2Bulk price increases (${priceAlerts.length})`,
              message: (() => {
                const top = [...priceAlerts].sort((a, b) => b.increasePct - a.increasePct)[0];
                return top
                  ? `Largest: ${top.label} (+${top.increasePct.toFixed(1)}%). Open G2Bulk page for full list.`
                  : 'Review updated source prices on the G2Bulk page.';
              })(),
              createdAt: priceAlerts[0].createdAt,
              href: '/admin/g2bulk',
            },
          ]
        : []),
      ...orders.map((o) => ({
        key: `order-${o.id}`,
        type: 'order' as const,
        id: o.id,
        title: 'Pending Order',
        message: `${o.user.username} — ${o.product.name} (${Number(o.totalPrice).toLocaleString()} MMK)`,
        createdAt: o.createdAt.toISOString(),
        href: '/admin/orders',
      })),
      ...topups.map((t) => ({
        key: `wallet-${t.id}`,
        type: 'wallet_topup' as const,
        id: t.id,
        title: 'Wallet Top-Up',
        message: `${t.user.username} — Ks ${Number(t.amount).toLocaleString()}`,
        createdAt: t.createdAt.toISOString(),
        href: '/admin/wallet',
      })),
    ].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      pendingOrders,
      pendingWalletTopups,
      pendingG2bulkPriceAlerts: priceAlerts.length,
      g2bulkBalanceAlert,
      totalPending:
        pendingOrders +
        pendingWalletTopups +
        (priceAlerts.length > 0 ? 1 : 0) +
        (g2bulkBalanceAlert ? 1 : 0),
      items,
    };
  }

  async sendUserNotifications(body: {
    title: string;
    body: string;
    url?: string;
    userId?: number;
    username?: string;
    allUsers?: boolean;
  }) {
    const title = body.title?.trim();
    const message = body.body?.trim();
    if (!title || !message) {
      throw new BadRequestException('Title and message are required');
    }

    let userIds: number[] = [];

    if (body.allUsers) {
      const users = await this.prisma.user.findMany({
        where: { role: 'USER' },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (body.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: body.userId } });
      if (!user || user.role !== 'USER') {
        throw new NotFoundException('User not found');
      }
      userIds = [user.id];
    } else if (body.username?.trim()) {
      const user = await this.prisma.user.findUnique({
        where: { username: body.username.trim() },
      });
      if (!user || user.role !== 'USER') {
        throw new NotFoundException('User not found');
      }
      userIds = [user.id];
    } else {
      throw new BadRequestException('Select a user or broadcast to all users');
    }

    if (userIds.length === 0) {
      throw new BadRequestException('No users to notify');
    }

    const result = await this.userInbox.notifyMany(userIds, {
      type: 'admin',
      title,
      body: message,
      url: body.url?.trim() || undefined,
    });

    await this.logActivity(
      'user_notification_sent',
      'notification',
      undefined,
      `${result.sent} user(s) — ${title}`,
    );

    return result;
  }

  async getSalesReport(from?: string, to?: string) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const completed = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalSales = completed.reduce((s, o) => s + Number(o.totalPrice), 0);
    const totalOrders = completed.length;

    const byProduct = new Map<string, { sales: number; count: number }>();
    for (const o of completed) {
      const name = o.product.name;
      const cur = byProduct.get(name) ?? { sales: 0, count: 0 };
      cur.sales += Number(o.totalPrice);
      cur.count += 1;
      byProduct.set(name, cur);
    }

    const topProducts = [...byProduct.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    return { totalSales, totalOrders, topProducts, monthlyReport: this.buildMonthlyReport(completed) };
  }

  private buildMonthlyReport(orders: { totalPrice: unknown; createdAt: Date }[]) {
    const byMonth = new Map<string, { sales: number; orders: number }>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 7);
      const cur = byMonth.get(key) ?? { sales: 0, orders: 0 };
      cur.sales += Number(o.totalPrice);
      cur.orders += 1;
      byMonth.set(key, cur);
    }
    return [...byMonth.entries()]
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        walletBalance: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        referralCode: true,
        avatarUrl: true,
        isBanned: true,
        banReason: true,
        bannedAt: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.mapAdminUser(u));
  }

  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      include: {
        user: { select: { id: true, username: true, email: true } },
        product: true,
        paymentProof: true,
        topUpInput: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => ({
      ...o,
      totalPrice: Number(o.totalPrice),
      product: {
        ...o.product,
        unitPrice: Number(o.product.unitPrice),
      },
    }));
  }

  async getExchangeSettings() {
    return this.settings.getExchangeSettings();
  }

  async updateExchangeSettings(data: { usdToMmkRate: number; priceMarkupPercent?: number }) {
    const result = await this.settings.updateExchangeSettings(data);
    await this.logActivity(
      'UPDATE_EXCHANGE_RATE',
      'settings',
      1,
      `1 USD = ${result.usdToMmkRate} MMK, markup ${result.priceMarkupPercent}%`,
    );
    return result;
  }

  async getShopSettings() {
    return this.settings.getShopSettings();
  }

  async updateShopSettings(data: {
    shopName?: string;
    shopTagline?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    supportTelegram?: string | null;
    liveChatUrl?: string | null;
    paymentMethods?: string[];
    paymentAccounts?: {
      id: string;
      name: string;
      accountNumber: string;
      accountHolder: string;
      enabled?: boolean;
    }[];
    maintenanceMode?: boolean;
    maintenanceMessage?: string | null;
    minWalletTopup?: number;
    featureFlags?: Partial<import('../settings/feature-flags.types').FeatureFlags>;
      g2bulkLowBalanceThreshold?: number | null;
      g2bulkPriceAlertMinPct?: number;
      g2bulkPriceAlertMinUsd?: number;
      g2bulkAutoPriceSync?: boolean;
  }) {
    const result = await this.settings.updateShopSettings(data);
    await this.logActivity('UPDATE_SHOP_SETTINGS', 'settings', 1, result.shopName);
    return result;
  }

  getIntegrationSettings() {
    return this.settings.getIntegrationSettings();
  }

  async updateIntegrationSettings(data: {
    g2bulkApiKey?: string | null;
    smtpHost?: string | null;
    smtpPort?: number;
    smtpUser?: string | null;
    smtpPass?: string | null;
    smtpFrom?: string | null;
  }) {
    const result = await this.settings.updateIntegrationSettings(data);
    this.g2bulk.invalidateApiKeyCache();
    await this.logActivity('UPDATE_INTEGRATIONS', 'settings', 1, 'G2Bulk/SMTP keys updated');
    return result;
  }

  async getG2bulkDashboard() {
    const [dashboard, priceAlerts, shopSettings, snapshotCount] = await Promise.all([
      this.g2bulk.getDashboardData(),
      this.g2bulkPriceMonitor.listAlerts({ limit: 50, undismissedOnly: true }),
      this.settings.getShopSettings(),
      this.prisma.g2BulkPriceSnapshot.count(),
    ]);

    const threshold = Number(shopSettings.g2bulkLowBalanceThreshold ?? 0);
    let balanceAlert: { balance: number; threshold: number } | null = null;
    if (threshold > 0 && dashboard.connected && dashboard.profile && dashboard.profile.balance < threshold) {
      balanceAlert = { balance: dashboard.profile.balance, threshold };
    }

    return {
      ...dashboard,
      priceAlerts,
      balanceAlert,
      monitoring: {
        snapshotCount,
        priceAlertMinPct: Number(shopSettings.g2bulkPriceAlertMinPct ?? 2),
        priceAlertMinUsd: Number(shopSettings.g2bulkPriceAlertMinUsd ?? 0.25),
        autoPriceSync: shopSettings.g2bulkAutoPriceSync !== false,
        lowBalanceThreshold: threshold > 0 ? threshold : null,
      },
    };
  }

  async testG2bulkConnection() {
    const apiKey = await this.g2bulk.getApiKey();
    if (!apiKey?.trim()) {
      throw new BadRequestException(
        'G2Bulk API key not configured. Paste your key below and click Test (or Save), or set G2BULK_API_KEY in backend/.env and restart the backend server.',
      );
    }
    try {
      const me = await this.g2bulk.fetchMe();
      return {
        success: true,
        username: me.username,
        firstName: me.first_name,
        balance: me.balance,
        message: `Connected as ${me.username} — balance $${Number(me.balance).toFixed(2)}`,
      };
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'G2Bulk connection failed');
    }
  }

  checkG2bulkPrices(force = false) {
    return this.g2bulkPriceMonitor.checkPrices(force);
  }

  listG2bulkPriceAlerts(limit?: number) {
    return this.g2bulkPriceMonitor.listAlerts({ limit: limit ?? 50, undismissedOnly: true });
  }

  dismissG2bulkPriceAlert(id: number) {
    return this.g2bulkPriceMonitor.dismissAlert(id);
  }

  dismissAllG2bulkPriceAlerts() {
    return this.g2bulkPriceMonitor.dismissAllAlerts();
  }

  async testSmtp(to: string) {
    if (!to?.trim()) {
      throw new BadRequestException('Recipient email is required');
    }
    const result = await this.notifications.sendEmailDetailed(
      to.trim(),
      'RanKageShop — Account notification test',
      `Hello,

This message confirms that ${(await this.settings.getShopSettings()).shopName} can send email from rankage.shop.

If you received this in your inbox, SMTP is configured correctly. For best deliverability, enable SPF and DKIM in cPanel → Email Deliverability.

— RanKageShop Admin`,
    );
    const configured = (await this.settings.getIntegrationSettings()).smtpConfigured;
    if (!configured) {
      throw new BadRequestException('SMTP is not fully configured');
    }
    if (result.ok === false) {
      throw new BadRequestException(result.error);
    }
    return { success: true, message: 'Test email sent successfully' };
  }

  async getAllProducts(): Promise<AdminProductDto[]> {
    const [games, vouchers, categories, dbProducts, shop] = await Promise.all([
      this.g2bulk.fetchGames(),
      this.g2bulk.fetchVoucherProducts(),
      this.g2bulk.fetchCategories(),
      this.prisma.product.findMany(),
      this.settings.getShopSettings(),
    ]);

    const autoSync = shop.g2bulkAutoPriceSync !== false;
    const exchange = shop;

    const categoryImages = this.g2bulk.buildCategoryImageMap(categories);

    const dbByGameCode = new Map(
      dbProducts.filter((p) => p.g2bulkGameCode).map((p) => [p.g2bulkGameCode!, p]),
    );
    const dbByVoucherId = new Map(
      dbProducts.filter((p) => p.g2bulkProductId).map((p) => [p.g2bulkProductId!, p]),
    );

    const apiGameCodes = new Set(games.map((g) => g.code));
    const apiVoucherIds = new Set(vouchers.map((v) => v.id));

    const gameProducts = games.map((g) =>
      this.mergeGameProduct(g, dbByGameCode.get(g.code), exchange),
    );
    const voucherProducts = vouchers.map((v) =>
      this.mergeVoucherProduct(
        v,
        dbByVoucherId.get(v.id),
        categoryImages,
        categories,
        exchange,
        autoSync,
      ),
    );

    const localOnly = dbProducts
      .filter(
        (p) =>
          (p.g2bulkGameCode && !apiGameCodes.has(p.g2bulkGameCode)) ||
          (p.g2bulkProductId != null && !apiVoucherIds.has(p.g2bulkProductId)) ||
          (!p.g2bulkGameCode && p.g2bulkProductId == null),
      )
      .map((p) => this.dbProductToDto(p, exchange));

    return [...gameProducts, ...voucherProducts, ...localOnly].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  private mergeGameProduct(
    game: { id: number; code: string; name: string; image_url: string | null },
    db?: {
      id: number;
      name: string;
      unitPrice: unknown;
      stock: number | null;
      isActive: boolean;
      imageUrl: string | null;
      description: string | null;
    },
    _exchange?: ExchangeSettingsDto,
  ): AdminProductDto {
    const localMmk = db != null && Number(db.unitPrice) > 0 ? Math.round(Number(db.unitPrice)) : 0;
    return {
      id: db?.id ?? null,
      g2bulkId: game.id,
      name: db?.name ?? game.name,
      type: 'direct_topup',
      typeLabel: 'Direct Top-Up',
      sourcePrice: null,
      sourceCurrency: null,
      unitPrice: localMmk,
      currency: 'MMK',
      stock: db?.stock ?? 0,
      isActive: db?.isActive ?? true,
      imageUrl: this.g2bulk.resolveImageUrl(db?.imageUrl ?? game.image_url),
      g2bulkGameCode: game.code,
      g2bulkProductId: null,
      categoryTitle: null,
      description: db?.description ?? null,
      fromApi: true,
    };
  }

  private mergeVoucherProduct(
    voucher: {
      id: number;
      title: string;
      description: string;
      category_id: number;
      category_title: string;
      unit_price: number;
      face_value: number | null;
      stock: number;
    },
    db?: {
      id: number;
      name: string;
      unitPrice: unknown;
      stock: number | null;
      isActive: boolean;
      imageUrl: string | null;
      description: string | null;
      categoryTitle: string | null;
    },
    categoryImages?: Map<number, string>,
    categories?: { id: number; title: string; image_url: string | null }[],
    exchange?: ExchangeSettingsDto,
    autoSync = true,
  ): AdminProductDto {
    const cat = categories?.find((c) => c.id === voucher.category_id);
    const categoryTitle = db?.categoryTitle ?? voucher.category_title;
    const resolvedImage =
      db?.imageUrl != null
        ? this.g2bulk.resolveImageUrl(db.imageUrl)
        : this.g2bulk.resolveCategoryImage(
            voucher.category_id,
            categoryTitle,
            cat?.image_url,
            categoryImages,
          );

    const pricing = this.settings.resolveUsdProductPrice(
      voucher.unit_price,
      exchange ?? { usdToMmkRate: 4500, priceMarkupPercent: 0, updatedAt: '' },
      db?.unitPrice != null ? Number(db.unitPrice) : null,
      autoSync,
    );

    return {
      id: db?.id ?? null,
      g2bulkId: voucher.id,
      name: db?.name ?? voucher.title,
      type: 'voucher',
      typeLabel: 'Voucher',
      sourcePrice: pricing.sourcePrice,
      sourceCurrency: pricing.sourceCurrency,
      unitPrice: pricing.unitPrice,
      currency: 'MMK',
      stock: db?.stock ?? voucher.stock,
      isActive: db?.isActive ?? true,
      imageUrl: resolvedImage,
      g2bulkGameCode: null,
      g2bulkProductId: voucher.id,
      categoryTitle,
      description: (db?.description ?? voucher.description) || null,
      fromApi: true,
    };
  }

  private dbProductToDto(p: {
    id: number;
    name: string;
    type: string;
    unitPrice: unknown;
    stock: number | null;
    isActive: boolean;
    imageUrl: string | null;
    g2bulkGameCode: string | null;
    g2bulkProductId: number | null;
    categoryTitle: string | null;
    description: string | null;
  }, exchange?: ExchangeSettingsDto): AdminProductDto {
    const localMmk = Math.round(Number(p.unitPrice));
    return {
      id: p.id,
      g2bulkId: p.g2bulkProductId ?? p.id,
      name: p.name,
      type: p.type,
      typeLabel: p.type === 'voucher' ? 'Voucher' : 'Direct Top-Up',
      sourcePrice: null,
      sourceCurrency: null,
      unitPrice: localMmk,
      currency: 'MMK',
      stock: p.stock ?? 0,
      isActive: p.isActive,
      imageUrl: p.imageUrl ? this.g2bulk.resolveImageUrl(p.imageUrl) : null,
      g2bulkGameCode: p.g2bulkGameCode,
      g2bulkProductId: p.g2bulkProductId,
      categoryTitle: p.categoryTitle,
      description: p.description,
      fromApi: false,
    };
  }

  private async voucherCatalogContext() {
    const categories = await this.g2bulk.fetchCategories();
    return {
      categories,
      categoryImages: this.g2bulk.buildCategoryImageMap(categories),
    };
  }

  async toggleProductActive(params: {
    id?: number;
    g2bulkGameCode?: string;
    g2bulkProductId?: number;
  }) {
    let product = params.id
      ? await this.prisma.product.findUnique({ where: { id: params.id } })
      : params.g2bulkGameCode
        ? await this.prisma.product.findFirst({ where: { g2bulkGameCode: params.g2bulkGameCode } })
        : params.g2bulkProductId != null
          ? await this.prisma.product.findFirst({
              where: { g2bulkProductId: params.g2bulkProductId },
            })
          : null;

    const currentlyActive = product?.isActive ?? true;
    const newActive = !currentlyActive;
    const label = params.g2bulkGameCode ?? params.g2bulkProductId ?? params.id;

    if (product) {
      const exchange = await this.settings.getExchangeSettings();
      const updated = await this.prisma.product.update({
        where: { id: product.id },
        data: { isActive: newActive },
      });
      if (updated.g2bulkGameCode) {
        const games = await this.g2bulk.fetchGames();
        const game = games.find((g) => g.code === updated.g2bulkGameCode);
        if (game) return this.mergeGameProduct(game, updated, exchange);
      }
      if (updated.g2bulkProductId != null) {
        const [{ categories, categoryImages }, vouchers] = await Promise.all([
          this.voucherCatalogContext(),
          this.g2bulk.fetchVoucherProducts(),
        ]);
        const voucher = vouchers.find((v) => v.id === updated.g2bulkProductId);
        if (voucher) {
          const result = this.mergeVoucherProduct(voucher, updated, categoryImages, categories, exchange);
          await this.logActivity('TOGGLE_PRODUCT', 'product', label, newActive ? 'shown' : 'hidden');
          return result;
        }
      }
      const dto = this.dbProductToDto(updated, exchange);
      await this.logActivity('TOGGLE_PRODUCT', 'product', label, newActive ? 'shown' : 'hidden');
      return dto;
    }

    if (params.g2bulkGameCode) {
      const games = await this.g2bulk.fetchGames();
      const game = games.find((g) => g.code === params.g2bulkGameCode);
      if (!game) throw new NotFoundException('Game not found');
      const created = await this.prisma.product.create({
        data: {
          name: game.name,
          type: 'direct_topup',
          unitPrice: 0,
          stock: 0,
          isActive: newActive,
          g2bulkGameCode: game.code,
          imageUrl: this.g2bulk.resolveImageUrl(game.image_url),
        },
      });
      return this.mergeGameProduct(game, created);
    }

    if (params.g2bulkProductId != null) {
      const [exchange, { categories, categoryImages }, vouchers] = await Promise.all([
        this.settings.getExchangeSettings(),
        this.voucherCatalogContext(),
        this.g2bulk.fetchVoucherProducts(),
      ]);
      const voucher = vouchers.find((v) => v.id === params.g2bulkProductId);
      if (!voucher) throw new NotFoundException('Voucher product not found');
      const created = await this.prisma.product.create({
        data: {
          name: voucher.title,
          type: 'voucher',
          unitPrice: 0,
          faceValue: voucher.face_value,
          stock: voucher.stock,
          isActive: newActive,
          g2bulkProductId: voucher.id,
          categoryId: voucher.category_id,
          categoryTitle: voucher.category_title,
          description: voucher.description || null,
        },
      });
      return this.mergeVoucherProduct(voucher, created, categoryImages, categories, exchange);
    }

    throw new NotFoundException('Product not found');
  }

  async createProduct(data: {
    name: string;
    type: string;
    unitPrice: number;
    stock?: number;
    isActive?: boolean;
    g2bulkGameCode?: string;
    g2bulkProductId?: number;
    description?: string;
    imageUrl?: string;
  }) {
    const created = await this.prisma.product.create({
      data: {
        name: data.name,
        type: data.type,
        unitPrice: data.unitPrice,
        stock: data.stock ?? 0,
        isActive: data.isActive ?? true,
        g2bulkGameCode: data.g2bulkGameCode,
        g2bulkProductId: data.g2bulkProductId,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });
    return this.dbProductToDto(created);
  }

  async updateProduct(id: number, data: Record<string, unknown>) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    const updated = await this.prisma.product.update({ where: { id }, data });
    return this.dbProductToDto(updated);
  }

  async deleteProduct(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    await this.logActivity('DELETE_PRODUCT', 'product', id, product.name);
    return this.prisma.product.delete({ where: { id } });
  }

  async updateOrderStatus(id: number, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: true, product: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    const wasCompleted = order.status === 'COMPLETED';
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
    if (status === 'COMPLETED' && order.paymentMethod === 'wallet') {
      await this.fulfillment.ensureWalletCharged(id);
    }
    if (status === 'COMPLETED' && !wasCompleted && order.user) {
      await this.notifications.notifyOrderCompleted(
        order.user.email,
        id,
        order.userId,
      );
    }
    await this.logActivity('UPDATE_ORDER_STATUS', 'order', id, `${order.status} → ${status}`);
    return updated;
  }

  async verifyPayment(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { paymentProof: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const batchOrders = order.batchId
      ? await this.prisma.order.findMany({
          where: {
            batchId: order.batchId,
            status: { in: ['PAYMENT_PENDING', 'PENDING'] },
          },
          include: { paymentProof: true },
        })
      : [order];

    if (order.paymentProof) {
      await this.prisma.paymentProof.update({
        where: { orderId },
        data: { status: 'VERIFIED' },
      });
    }

    await this.logActivity('VERIFY_PAYMENT', 'order', orderId);

    for (const batchOrder of batchOrders) {
      await this.prisma.order.update({
        where: { id: batchOrder.id },
        data: { status: 'PROCESSING' },
      });
      await this.fulfillment.fulfillOrder(batchOrder.id);
    }

    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, product: true, paymentProof: true, topUpInput: true, voucherCodes: true },
    });
  }

  async retryFulfillment(orderId: number) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'COMPLETED') {
      throw new BadRequestException('Order is already completed');
    }
    if (!['PROCESSING', 'PAYMENT_PENDING', 'PENDING'].includes(order.status)) {
      throw new BadRequestException(`Cannot retry fulfillment for status ${order.status}`);
    }

    await this.logActivity('RETRY_FULFILLMENT', 'order', orderId);

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    const result = await this.fulfillment.fulfillOrder(orderId);
    return {
      ...result,
      order: await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, product: true, paymentProof: true, topUpInput: true, voucherCodes: true },
      }),
    };
  }

  async rejectPayment(orderId: number, dto: RejectPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { paymentProof: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentProof) {
      await this.prisma.paymentProof.update({
        where: { orderId },
        data: { status: 'REJECTED', rejectReason: dto.reason },
      });
    }

    await this.logActivity('REJECT_PAYMENT', 'order', orderId, dto.reason);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PENDING' },
      include: { user: true, product: true, paymentProof: true },
    });
  }

  async refundOrder(orderId: number, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const refundable = ['COMPLETED', 'PROCESSING', 'PAYMENT_PENDING'];
    if (!refundable.includes(order.status)) {
      throw new BadRequestException(`Cannot refund order with status ${order.status}`);
    }

    const amount = Math.round(Number(order.totalPrice));
    const balanceBefore = Math.round(Number(order.user.walletBalance));
    const balanceAfter = balanceBefore + amount;
    const note = reason?.trim() || `Refund for order #${orderId}`;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: order.userId },
        data: { walletBalance: balanceAfter },
      }),
      this.prisma.walletTransaction.create({
        data: {
          userId: order.userId,
          type: 'refund',
          amount,
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description: note,
          reference: String(orderId),
        },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'REFUNDED',
          remark: note,
        },
      }),
    ]);

    await this.logActivity('REFUND_ORDER', 'order', orderId, `${amount} MMK → wallet`);

    const flags = await this.settings.getFeatureFlags();
    if (flags.emailNotificationsEnabled) {
      await this.notifications.notifyOrderRefunded(order.user.email, orderId, amount, order.userId);
    }

    return this.getOrderDetail(orderId);
  }

  async getOrderDetail(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        product: true,
        paymentProof: true,
        voucherCodes: true,
        topUpInput: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      id: order.id,
      status: order.status,
      type: order.type,
      paymentMethod: order.paymentMethod,
      quantity: order.quantity,
      totalPrice: Number(order.totalPrice),
      remark: order.remark,
      createdAt: order.createdAt.toISOString(),
      completedAt: order.completedAt?.toISOString() ?? null,
      user: order.user,
      product: {
        id: order.product.id,
        name: order.product.name,
        type: order.product.type,
        unitPrice: Number(order.product.unitPrice),
      },
      paymentProof: order.paymentProof
        ? {
            method: order.paymentProof.method,
            reference: order.paymentProof.reference,
            note: order.paymentProof.note,
            imageUrl: order.paymentProof.imageUrl,
            status: order.paymentProof.status,
            rejectReason: order.paymentProof.rejectReason,
          }
        : null,
      voucherCodes: order.voucherCodes.map((v) => v.voucherCode),
      topUpInput: order.topUpInput
        ? {
            gameCode: order.topUpInput.gameCode,
            playerId: order.topUpInput.playerId,
            serverId: order.topUpInput.serverId,
            playerName: order.topUpInput.playerName,
            catalogueName: order.topUpInput.catalogueName,
          }
        : null,
    };
  }

  async getUserOrders(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalPrice: Number(o.totalPrice),
      productName: o.product.name,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  private readonly adminUserSelect = {
    id: true,
    username: true,
    email: true,
    role: true,
    walletBalance: true,
    emailVerified: true,
    phone: true,
    phoneVerified: true,
    referralCode: true,
    avatarUrl: true,
    isBanned: true,
    banReason: true,
    bannedAt: true,
    createdAt: true,
    _count: { select: { orders: true } },
  } as const;

  private mapAdminUser(
    u: {
      id: number;
      username: string;
      email: string;
      role: string;
      walletBalance: unknown;
      emailVerified: boolean;
      phone: string | null;
      phoneVerified: boolean;
      referralCode: string | null;
      avatarUrl: string | null;
      isBanned: boolean;
      banReason: string | null;
      bannedAt: Date | null;
      createdAt: Date;
      _count: { orders: number };
    },
  ) {
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      walletBalance: Number(u.walletBalance),
      emailVerified: u.emailVerified,
      phone: u.phone,
      phoneVerified: u.phoneVerified,
      referralCode: u.referralCode,
      avatarUrl: u.avatarUrl,
      isBanned: u.isBanned,
      banReason: u.banReason,
      bannedAt: u.bannedAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      orderCount: u._count.orders,
    };
  }

  async updateUser(
    id: number,
    data: {
      username?: string;
      email?: string;
      phone?: string | null;
      emailVerified?: boolean;
      phoneVerified?: boolean;
      role?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const patch: {
      username?: string;
      email?: string;
      phone?: string | null;
      emailVerified?: boolean;
      phoneVerified?: boolean;
      role?: string;
    } = {};

    if (data.username !== undefined) {
      const username = data.username.trim();
      if (!username) throw new BadRequestException('Username is required');
      if (username !== user.username) {
        const taken = await this.prisma.user.findUnique({ where: { username } });
        if (taken) throw new BadRequestException('Username already taken');
      }
      patch.username = username;
    }

    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();
      if (!email) throw new BadRequestException('Email is required');
      if (email !== user.email) {
        const taken = await this.prisma.user.findUnique({ where: { email } });
        if (taken) throw new BadRequestException('Email already in use');
      }
      patch.email = email;
    }

    if (data.phone !== undefined) {
      const phone = data.phone?.trim() || null;
      if (phone && phone !== user.phone) {
        const taken = await this.prisma.user.findUnique({ where: { phone } });
        if (taken) throw new BadRequestException('Phone already in use');
      }
      patch.phone = phone;
    }

    if (data.emailVerified !== undefined) patch.emailVerified = data.emailVerified;
    if (data.phoneVerified !== undefined) patch.phoneVerified = data.phoneVerified;

    if (data.role !== undefined) {
      if (!['USER', 'ADMIN'].includes(data.role)) {
        throw new BadRequestException('Role must be USER or ADMIN');
      }
      if (user.role === 'ADMIN' && data.role === 'USER') {
        await this.assertCanDemoteAdmin(user);
      }
      patch.role = data.role;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: patch,
      select: this.adminUserSelect,
    });

    await this.logActivity('UPDATE_USER', 'user', id, Object.keys(patch).join(', '));
    return this.mapAdminUser(updated);
  }

  async updateUserRole(id: number, role: string) {
    if (!['USER', 'ADMIN'].includes(role)) {
      throw new BadRequestException('Role must be USER or ADMIN');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN' && role === 'USER') {
      await this.assertCanDemoteAdmin(user);
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: this.adminUserSelect,
    });
    await this.logActivity('UPDATE_USER_ROLE', 'user', id, `${user.role} → ${role}`);
    return this.mapAdminUser(updated);
  }

  private async assertCanDemoteAdmin(user: { id: number; username: string }) {
    if (user.username === 'admin') {
      throw new BadRequestException('The primary admin account cannot be demoted');
    }
    const adminCount = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw new BadRequestException('Cannot demote the last admin account');
    }
  }

  async banUser(id: number, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot ban admin accounts');
    }
    if (user.isBanned) {
      throw new BadRequestException('User is already banned');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        banReason: reason?.trim() || null,
        bannedAt: new Date(),
      },
      select: this.adminUserSelect,
    });

    await this.logActivity('BAN_USER', 'user', id, reason?.trim() || 'No reason');
    return this.mapAdminUser(updated);
  }

  async unbanUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isBanned) {
      throw new BadRequestException('User is not banned');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        banReason: null,
        bannedAt: null,
      },
      select: this.adminUserSelect,
    });

    await this.logActivity('UNBAN_USER', 'user', id);
    return this.mapAdminUser(updated);
  }

  async adjustUserWallet(id: number, amount: number, note?: string) {
    if (!Number.isFinite(amount) || amount === 0) {
      throw new BadRequestException('Amount must be a non-zero number');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const balanceBefore = Number(user.walletBalance);
    const balanceAfter = balanceBefore + amount;
    if (balanceAfter < 0) {
      throw new BadRequestException('Wallet balance cannot go below zero');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { walletBalance: balanceAfter },
        select: { walletBalance: true },
      }),
      this.prisma.walletTransaction.create({
        data: {
          userId: id,
          type: amount > 0 ? 'topup' : 'spend',
          amount: Math.abs(amount),
          balanceBefore,
          balanceAfter,
          status: 'COMPLETED',
          description: note ?? `Admin adjustment (${amount > 0 ? '+' : ''}${amount} MMK)`,
        },
      }),
    ]);

    await this.logActivity('ADJUST_WALLET', 'user', id, `${amount > 0 ? '+' : ''}${amount} MMK`);

    return { walletBalance: Number(updated.walletBalance) };
  }

  async getWalletTopups(status?: string) {
    const txns = await this.prisma.walletTransaction.findMany({
      where: {
        type: 'topup',
        ...(status && status !== 'all' ? { status: status.toUpperCase() } : {}),
      },
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return txns.map((t) => ({
      id: t.id,
      userId: t.userId,
      username: t.user.username,
      email: t.user.email,
      user: { id: t.user.id, username: t.user.username, email: t.user.email },
      amount: Number(t.amount),
      status: t.status,
      description: t.description,
      reference: t.reference,
      proofImageUrl: t.proofImageUrl,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async getPendingWalletTopups() {
    return this.getWalletTopups('PENDING');
  }

  async verifyWalletTopup(id: number) {
    const txn = await this.prisma.walletTransaction.findUnique({ where: { id } });
    if (!txn || txn.type !== 'topup' || txn.status !== 'PENDING') {
      throw new NotFoundException('Pending top-up not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: txn.userId } });
    if (!user) throw new NotFoundException('User not found');

    const balanceBefore = Math.round(Number(user.walletBalance));
    const amount = Math.round(Number(txn.amount));
    const balanceAfter = balanceBefore + amount;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: txn.userId },
        data: { walletBalance: balanceAfter },
      }),
      this.prisma.walletTransaction.update({
        where: { id },
        data: { status: 'COMPLETED', balanceBefore, balanceAfter },
      }),
    ]);

    await this.logActivity('VERIFY_WALLET_TOPUP', 'wallet', id, `${amount} MMK for user ${txn.userId}`);

    await this.notifications.notifyWalletTopupApproved(user.email, amount, user.id);

    return { id, status: 'COMPLETED', balanceAfter };
  }

  async rejectWalletTopup(id: number, reason?: string) {
    const txn = await this.prisma.walletTransaction.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!txn || txn.type !== 'topup' || txn.status !== 'PENDING') {
      throw new NotFoundException('Pending top-up not found');
    }

    await this.prisma.walletTransaction.update({
      where: { id },
      data: {
        status: 'REJECTED',
        description: reason
          ? `${txn.description ?? 'Top-up'} — Rejected: ${reason}`
          : txn.description,
      },
    });

    await this.notifications.notifyWalletTopupRejected(
      txn.userId,
      Math.round(Number(txn.amount)),
      reason,
    );

    await this.logActivity('REJECT_WALLET_TOPUP', 'wallet', id, reason);

    return { id, status: 'REJECTED' };
  }

  async getActivityLogs(limit = 100) {
    const logs = await this.prisma.adminActivityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      detail: l.detail,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async getWalletTransactions(limit = 100) {
    const txns = await this.prisma.walletTransaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, email: true } } },
    });
    return txns.map((t) => ({
      id: t.id,
      userId: t.userId,
      username: t.user.username,
      email: t.user.email,
      type: t.type,
      amount: Number(t.amount),
      status: t.status,
      description: t.description,
      reference: t.reference,
      proofImageUrl: t.proofImageUrl,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async getReferralStats() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        referralCode: true,
        createdAt: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users
      .filter((u) => u.referralCode)
      .map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        referralCode: u.referralCode,
        referralCount: u._count.referrals,
        joinedAt: u.createdAt.toISOString(),
      }))
      .sort((a, b) => b.referralCount - a.referralCount);
  }
}
