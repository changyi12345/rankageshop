import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';
import { G2bulkModule } from '../g2bulk/g2bulk.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [G2bulkModule, PrismaModule, SettingsModule],
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}
