import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('exchange')
  getExchangeSettings() {
    return this.settingsService.getExchangeSettings();
  }

  @Get('shop')
  getShopSettings() {
    return this.settingsService.getPublicShopInfo();
  }
}
