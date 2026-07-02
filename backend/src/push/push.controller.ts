import { Body, Controller, Delete, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushService } from './push.service';

@Controller('push')
export class PushController {
  constructor(private pushService: PushService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return {
      configured: this.pushService.isConfigured(),
      publicKey: this.pushService.getPublicKey(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(
    @Request() req: { user: { id: number } },
    @Body()
    body: {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      userAgent?: string;
    },
  ) {
    return this.pushService.subscribe(req.user.id, body.subscription, body.userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('subscribe')
  unsubscribe(
    @Request() req: { user: { id: number } },
    @Body('endpoint') endpoint: string,
  ) {
    return this.pushService.unsubscribe(req.user.id, endpoint);
  }

  @Get('fcm/status')
  getFcmStatus() {
    return { configured: this.pushService.isFcmConfigured() };
  }

  @UseGuards(JwtAuthGuard)
  @Post('fcm/register')
  registerFcm(
    @Request() req: { user: { id: number } },
    @Body() body: { token: string; platform?: string },
  ) {
    return this.pushService.registerFcmToken(req.user.id, body.token, body.platform);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('fcm/unregister')
  unregisterFcm(
    @Request() req: { user: { id: number } },
    @Body('token') token: string,
  ) {
    return this.pushService.unregisterFcmToken(req.user.id, token);
  }
}
