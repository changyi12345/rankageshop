import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { GamesModule } from '../games/games.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdminModule } from '../admin/admin.module';
import { PromosModule } from '../promos/promos.module';
import { ReferralModule } from '../referral/referral.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { SettingsModule } from '../settings/settings.module';
import { CommonModule } from '../common/common.module';
import { ContentModule } from '../content/content.module';
import { PushModule } from '../push/push.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ChatModule } from '../chat/chat.module';
import { RequestLoggerMiddleware } from '../common/middleware/request-logger.middleware';
import { MaintenanceMiddleware } from '../common/middleware/maintenance.middleware';
import { RateLimitMiddleware } from '../common/middleware/rate-limit.middleware';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
    PushModule,
    NotificationsModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    GamesModule,
    WalletModule,
    AdminModule,
    PromosModule,
    ReferralModule,
    VouchersModule,
    SettingsModule,
    ContentModule,
    UploadsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, RateLimitMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    consumer.apply(RateLimitMiddleware).forRoutes(
      { path: 'auth/login', method: RequestMethod.POST },
      { path: 'auth/register', method: RequestMethod.POST },
      { path: 'auth/google', method: RequestMethod.POST },
      { path: 'auth/forgot-password', method: RequestMethod.POST },
      { path: 'auth/reset-password', method: RequestMethod.POST },
      { path: 'admin/upload', method: RequestMethod.POST },
      { path: 'uploads/payment-proof', method: RequestMethod.POST },
      { path: 'uploads/payment-proof-base64', method: RequestMethod.POST },
    );

    consumer
      .apply(MaintenanceMiddleware)
      .exclude(
        { path: 'admin/(.*)', method: RequestMethod.ALL },
        { path: 'auth/(.*)', method: RequestMethod.ALL },
        { path: 'settings/(.*)', method: RequestMethod.ALL },
        { path: 'content/(.*)', method: RequestMethod.GET },
        { path: 'uploads/(.*)', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
