import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

type FirebaseMessaging = {
  send: (message: {
    token: string;
    notification: { title: string; body: string };
    data?: Record<string, string>;
  }) => Promise<string>;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private configured = false;
  private fcmConfigured = false;
  private fcmMessaging: FirebaseMessaging | null = null;

  constructor(private prisma: PrismaService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@rankage.shop';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.configured = true;
    } else {
      this.logger.warn('Web push not configured (set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY)');
    }

    this.initFcm();
  }

  private initFcm() {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    if (!json) {
      this.logger.warn('FCM not configured (set FIREBASE_SERVICE_ACCOUNT_JSON)');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const admin = require('firebase-admin') as {
        apps: unknown[];
        initializeApp: (opts: { credential: unknown }) => void;
        credential: { cert: (parsed: unknown) => unknown };
        messaging: () => FirebaseMessaging;
      };
      if (admin.apps.length === 0) {
        const parsed = JSON.parse(json) as unknown;
        admin.initializeApp({ credential: admin.credential.cert(parsed) });
      }
      this.fcmMessaging = admin.messaging();
      this.fcmConfigured = true;
    } catch (err) {
      this.logger.warn(`FCM init failed: ${err instanceof Error ? err.message : 'error'}`);
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  isFcmConfigured(): boolean {
    return this.fcmConfigured;
  }

  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY?.trim() || null;
  }

  async subscribe(
    userId: number,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ) {
    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return { ok: false, message: 'Invalid subscription' };
    }

    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      },
    });

    return { ok: true };
  }

  async unsubscribe(userId: number, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { ok: true };
  }

  async registerFcmToken(userId: number, token: string, platform?: string) {
    if (!token?.trim()) {
      return { ok: false, message: 'Invalid token' };
    }
    await this.prisma.fcmToken.upsert({
      where: { token: token.trim() },
      update: { userId, platform: platform ?? null },
      create: { userId, token: token.trim(), platform: platform ?? null },
    });
    return { ok: true, configured: this.fcmConfigured };
  }

  async unregisterFcmToken(userId: number, token: string) {
    await this.prisma.fcmToken.deleteMany({
      where: { userId, token: token.trim() },
    });
    return { ok: true };
  }

  async notifyUser(userId: number, payload: PushPayload) {
    await Promise.all([
      this.notifyUserWeb(userId, payload),
      this.notifyUserFcm(userId, payload),
    ]);
  }

  private async notifyUserWeb(userId: number, payload: PushPayload) {
    if (!this.configured) return;

    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) return;

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? '/',
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
          this.logger.warn(`Web push failed for user ${userId}: ${status ?? 'error'}`);
        }
      }),
    );
  }

  private async notifyUserFcm(userId: number, payload: PushPayload) {
    if (!this.fcmConfigured || !this.fcmMessaging) return;

    const tokens = await this.prisma.fcmToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    await Promise.all(
      tokens.map(async (row) => {
        try {
          await this.fcmMessaging!.send({
            token: row.token,
            notification: { title: payload.title, body: payload.body },
            data: payload.url ? { url: payload.url } : undefined,
          });
        } catch (err: unknown) {
          const code = (err as { code?: string }).code;
          if (code === 'messaging/registration-token-not-registered') {
            await this.prisma.fcmToken.delete({ where: { id: row.id } }).catch(() => {});
          }
          this.logger.warn(`FCM failed for user ${userId}: ${code ?? 'error'}`);
        }
      }),
    );
  }
}
