import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private settings: SettingsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const method = req.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next();
    }

    const path = req.originalUrl.split('?')[0];
    if (
      path.startsWith('/api/admin') ||
      path.startsWith('/api/auth') ||
      path.startsWith('/api/settings')
    ) {
      return next();
    }

    const shop = await this.settings.getPublicShopInfo();
    if (shop.maintenanceMode) {
      return res.status(503).json({
        statusCode: 503,
        message: shop.maintenanceMessage ?? 'Shop is under maintenance. Please try again later.',
        maintenanceMode: true,
      });
    }

    next();
  }
}
