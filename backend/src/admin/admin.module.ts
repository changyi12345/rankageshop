import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { G2bulkModule } from '../g2bulk/g2bulk.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { UploadsModule } from '../uploads/uploads.module';
import { OrdersModule } from '../orders/orders.module';
import { PromosModule } from '../promos/promos.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, G2bulkModule, SettingsModule, AuthModule, ContentModule, UploadsModule, OrdersModule, PromosModule, ChatModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
