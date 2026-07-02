import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { RejectPaymentDto } from '../orders/dto/payment-proof.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ContentService } from '../content/content.service';
import { UploadsService } from '../uploads/uploads.service';
import { TwoFactorService } from '../auth/two-factor.service';
import { SettingsService } from '../settings/settings.service';
import { PromosService } from '../promos/promos.service';
import { CreatePromoDto, UpdatePromoDto } from '../promos/dto/promo.dto';
import { ChatService } from '../chat/chat.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private contentService: ContentService,
    private uploadsService: UploadsService,
    private twoFactor: TwoFactorService,
    private settings: SettingsService,
    private promosService: PromosService,
    private chatService: ChatService,
  ) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('notifications')
  getNotifications() {
    return this.adminService.getNotifications();
  }

  @Post('notifications/send')
  sendUserNotifications(
    @Body()
    body: {
      title: string;
      body: string;
      url?: string;
      userId?: number;
      username?: string;
      allUsers?: boolean;
    },
  ) {
    return this.adminService.sendUserNotifications(body);
  }

  @Get('reports/sales')
  getSalesReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getSalesReport(from, to);
  }

  @Get('activity')
  getActivityLogs(@Query('limit') limit?: string) {
    return this.adminService.getActivityLogs(limit ? +limit : 100);
  }

  @Get('referrals')
  getReferralStats() {
    return this.adminService.getReferralStats();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('orders')
  getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Get('settings/exchange')
  getExchangeSettings() {
    return this.adminService.getExchangeSettings();
  }

  @Put('settings/exchange')
  updateExchangeSettings(
    @Body() body: { usdToMmkRate: number; priceMarkupPercent?: number },
  ) {
    return this.adminService.updateExchangeSettings(body);
  }

  @Get('settings/shop')
  getShopSettings() {
    return this.adminService.getShopSettings();
  }

  @Get('2fa/status')
  get2faStatus(@Request() req: { user: { id: number } }) {
    return this.twoFactor.getStatus(req.user.id);
  }

  @Post('2fa/setup')
  async setup2fa(@Request() req: { user: { id: number } }) {
    const shop = await this.settings.getShopSettings();
    return this.twoFactor.setup(req.user.id, shop.shopName);
  }

  @Post('2fa/enable')
  enable2fa(@Request() req: { user: { id: number } }, @Body('code') code: string) {
    return this.twoFactor.enable(req.user.id, code);
  }

  @Post('2fa/disable')
  disable2fa(
    @Request() req: { user: { id: number } },
    @Body() body: { password: string; code: string },
  ) {
    return this.twoFactor.disable(req.user.id, body.password, body.code);
  }

  @Put('settings/shop')
  updateShopSettings(
    @Body()
    body: {
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
      featureFlags?: Record<string, boolean>;
      g2bulkLowBalanceThreshold?: number | null;
      g2bulkPriceAlertMinPct?: number;
      g2bulkPriceAlertMinUsd?: number;
      g2bulkAutoPriceSync?: boolean;
    },
  ) {
    return this.adminService.updateShopSettings(body);
  }

  @Get('settings/integrations')
  getIntegrationSettings() {
    return this.adminService.getIntegrationSettings();
  }

  @Put('settings/integrations')
  updateIntegrationSettings(
    @Body()
    body: {
      g2bulkApiKey?: string | null;
      smtpHost?: string | null;
      smtpPort?: number;
      smtpUser?: string | null;
      smtpPass?: string | null;
      smtpFrom?: string | null;
    },
  ) {
    return this.adminService.updateIntegrationSettings(body);
  }

  @Post('settings/integrations/test-smtp')
  testSmtp(@Body('to') to: string) {
    return this.adminService.testSmtp(to);
  }

  @Get('g2bulk/dashboard')
  getG2bulkDashboard() {
    return this.adminService.getG2bulkDashboard();
  }

  @Get('g2bulk/price-alerts')
  listG2bulkPriceAlerts(@Query('limit') limit?: string) {
    return this.adminService.listG2bulkPriceAlerts(limit ? +limit : undefined);
  }

  @Post('g2bulk/check-prices')
  checkG2bulkPrices(@Query('force') force?: string) {
    return this.adminService.checkG2bulkPrices(force === 'true' || force === '1');
  }

  @Post('g2bulk/test-connection')
  testG2bulkConnection() {
    return this.adminService.testG2bulkConnection();
  }

  @Post('g2bulk/price-alerts/dismiss-all')
  dismissAllG2bulkPriceAlerts() {
    return this.adminService.dismissAllG2bulkPriceAlerts();
  }

  @Post('g2bulk/price-alerts/:id/dismiss')
  dismissG2bulkPriceAlert(@Param('id') id: string) {
    return this.adminService.dismissG2bulkPriceAlert(+id);
  }

  @Get('promos')
  findAllPromos() {
    return this.promosService.findAll();
  }

  @Post('promos')
  createPromo(@Body() dto: CreatePromoDto) {
    return this.promosService.create(dto);
  }

  @Put('promos/:id')
  updatePromo(@Param('id') id: string, @Body() dto: UpdatePromoDto) {
    return this.promosService.update(+id, dto);
  }

  @Delete('promos/:id')
  removePromo(@Param('id') id: string) {
    return this.promosService.remove(+id);
  }

  @Get('products')
  getAllProducts() {
    return this.adminService.getAllProducts();
  }

  @Post('products')
  createProduct(@Body() data: Record<string, unknown>) {
    return this.adminService.createProduct(data as Parameters<AdminService['createProduct']>[0]);
  }

  @Put('products/toggle-active')
  toggleProductActive(
    @Body() body: { id?: number; g2bulkGameCode?: string; g2bulkProductId?: number },
  ) {
    return this.adminService.toggleProductActive(body);
  }

  @Put('products/:id/toggle-active')
  toggleProductActiveById(@Param('id') id: string) {
    return this.adminService.toggleProductActive({ id: +id });
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.adminService.updateProduct(+id, data);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(+id);
  }

  @Get('wallet/transactions')
  getWalletTransactions(@Query('limit') limit?: string) {
    return this.adminService.getWalletTransactions(limit ? +limit : 100);
  }

  @Get('wallet/topups')
  getWalletTopups(@Query('status') status?: string) {
    return this.adminService.getWalletTopups(status);
  }

  @Post('wallet/topups/:id/verify')
  verifyWalletTopup(@Param('id') id: string) {
    return this.adminService.verifyWalletTopup(+id);
  }

  @Post('wallet/topups/:id/reject')
  rejectWalletTopup(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.rejectWalletTopup(+id, reason);
  }

  @Get('users/:id/orders')
  getUserOrders(@Param('id') id: string) {
    return this.adminService.getUserOrders(+id);
  }

  @Put('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      username?: string;
      email?: string;
      phone?: string | null;
      emailVerified?: boolean;
      phoneVerified?: boolean;
      role?: string;
    },
  ) {
    return this.adminService.updateUser(+id, body);
  }

  @Post('users/:id/ban')
  banUser(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.banUser(+id, reason);
  }

  @Post('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(+id);
  }

  @Put('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(+id, role);
  }

  @Put('users/:id/wallet')
  adjustUserWallet(
    @Param('id') id: string,
    @Body() body: { amount: number; note?: string },
  ) {
    return this.adminService.adjustUserWallet(+id, body.amount, body.note);
  }

  @Get('orders/:id')
  getOrderDetail(@Param('id') id: string) {
    return this.adminService.getOrderDetail(+id);
  }

  @Put('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateOrderStatus(+id, status);
  }

  @Post('orders/:id/verify-payment')
  verifyPayment(@Param('id') id: string) {
    return this.adminService.verifyPayment(+id);
  }

  @Post('orders/:id/retry-fulfillment')
  retryFulfillment(@Param('id') id: string) {
    return this.adminService.retryFulfillment(+id);
  }

  @Post('orders/:id/reject-payment')
  rejectPayment(@Param('id') id: string, @Body() dto: RejectPaymentDto) {
    return this.adminService.rejectPayment(+id, dto);
  }

  @Post('orders/:id/refund')
  refundOrder(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.refundOrder(+id, reason);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 3 * 1024 * 1024 } }))
  uploadFile(@UploadedFile() file?: { buffer: Buffer; originalname: string }) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = this.uploadsService.saveBuffer(file.buffer, file.originalname);
    return { url };
  }

  @Post('upload/base64')
  uploadBase64(@Body('data') data: string) {
    if (!data) throw new BadRequestException('No image data');
    const url = this.uploadsService.saveBase64(data);
    return { url };
  }

  @Put('settings/branding')
  updateBranding(@Body() body: { logoUrl?: string | null; faviconUrl?: string | null }) {
    return this.contentService.updateBranding(body);
  }

  @Get('banners')
  getBanners() {
    return this.contentService.getAllBanners();
  }

  @Post('banners')
  createBanner(@Body() body: Record<string, unknown>) {
    return this.contentService.createBanner(body as Parameters<ContentService['createBanner']>[0]);
  }

  @Put('banners/:id')
  updateBanner(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.contentService.updateBanner(+id, body as Parameters<ContentService['updateBanner']>[1]);
  }

  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string) {
    return this.contentService.deleteBanner(+id);
  }

  @Get('events')
  getEvents() {
    return this.contentService.getAllEvents();
  }

  @Post('events')
  createEvent(@Body() body: Record<string, unknown>) {
    return this.contentService.createEvent(body as Parameters<ContentService['createEvent']>[0]);
  }

  @Put('events/:id')
  updateEvent(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.contentService.updateEvent(+id, body as Parameters<ContentService['updateEvent']>[1]);
  }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) {
    return this.contentService.deleteEvent(+id);
  }

  @Get('legal/:slug')
  getLegalPage(@Param('slug') slug: string) {
    return this.contentService.getLegalPage(slug);
  }

  @Put('legal/:slug')
  updateLegalPage(
    @Param('slug') slug: string,
    @Body()
    body: {
      sections?: { title: string; body: string }[];
      sectionsEn?: { title: string; body: string }[];
      sectionsMm?: { title: string; body: string }[];
      locale?: 'en' | 'mm';
    },
  ) {
    return this.contentService.updateLegalPage(slug, body);
  }

  @Get('chat/conversations')
  listChatConversations(@Query('status') status?: string) {
    return this.chatService.listConversations(status ?? 'OPEN');
  }

  @Get('chat/conversations/:id/messages')
  getChatMessages(@Param('id') id: string, @Query('since') since?: string) {
    return this.chatService.getAdminMessages(+id, since ? +since : undefined);
  }

  @Post('chat/conversations/:id/messages')
  replyToChat(
    @Request() req: { user: { id: number } },
    @Param('id') id: string,
    @Body('body') body: string,
  ) {
    return this.chatService.sendAdminMessage(req.user.id, +id, body);
  }

  @Post('chat/conversations/:id/close')
  closeChatConversation(@Param('id') id: string) {
    return this.chatService.closeConversation(+id);
  }
}
