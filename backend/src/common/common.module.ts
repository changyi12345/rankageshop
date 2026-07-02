import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { MaintenanceMiddleware } from './middleware/maintenance.middleware';

@Module({
  imports: [SettingsModule],
  providers: [RequestLoggerMiddleware, MaintenanceMiddleware],
  exports: [RequestLoggerMiddleware, MaintenanceMiddleware],
})
export class CommonModule {}
