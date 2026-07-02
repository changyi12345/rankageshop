import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderFulfillmentService } from './order-fulfillment.service';
import { OrderProductResolver } from './order-product.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { PromosModule } from '../promos/promos.module';
import { G2bulkModule } from '../g2bulk/g2bulk.module';
import { SettingsModule } from '../settings/settings.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, PromosModule, G2bulkModule, SettingsModule, WalletModule],
  providers: [OrdersService, OrderFulfillmentService, OrderProductResolver],
  controllers: [OrdersController],
  exports: [OrdersService, OrderFulfillmentService],
})
export class OrdersModule {}
