import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to RanKageShop API!';
  }

  getHealth() {
    return {
      ok: true,
      service: 'rankageshop-api',
      env: process.env.NODE_ENV ?? 'development',
      time: new Date().toISOString(),
    };
  }
}
