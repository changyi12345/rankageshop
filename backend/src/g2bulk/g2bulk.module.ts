import { Module } from '@nestjs/common';
import { G2bulkService } from './g2bulk.service';
import { G2bulkPriceMonitorService } from './g2bulk-price-monitor.service';
import { G2bulkPriceSchedulerService } from './g2bulk-price-scheduler.service';
import { SettingsModule } from '../settings/settings.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SettingsModule, PrismaModule],
  providers: [G2bulkService, G2bulkPriceMonitorService, G2bulkPriceSchedulerService],
  exports: [G2bulkService, G2bulkPriceMonitorService],
})
export class G2bulkModule {}
