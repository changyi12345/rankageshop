import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { UserInboxService } from './user-inbox.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private settingsService: SettingsService,
    private userInbox: UserInboxService,
  ) {}

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const result = await this.sendEmailDetailed(to, subject, body);
    return result.ok;
  }

  async sendEmailDetailed(
    to: string,
    subject: string,
    body: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const flags = await this.settingsService.getFeatureFlags();
    if (!flags.emailNotificationsEnabled) {
      this.logger.warn(`Email skipped (disabled) → ${to}: ${subject}`);
      return { ok: false, error: 'Email notifications are disabled in Admin → Settings → Features' };
    }

    const secrets = await this.settingsService.getIntegrationSecrets();
    const { smtpHost: host, smtpPort: port, smtpUser: user, smtpPass: pass, smtpFrom: from } = secrets;
    const shop = await this.settingsService.getShopSettings();
    const replyTo = shop.contactEmail?.trim() || user;
    const shopName = shop.shopName?.trim() || 'RanKageShop';

    if (!host || !user || !pass) {
      this.logger.warn(`Email not sent (SMTP not configured) → ${to}: ${subject}`);
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${body}`);
      }
      return { ok: false, error: 'SMTP host, username, and password are required' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass },
        tls: { minVersion: 'TLSv1.2' },
      });

      // Surface auth errors before send (clearer than recipient rejection)
      await transporter.verify();

      await transporter.sendMail({
        from,
        to,
        replyTo,
        subject,
        text: body,
        html: this.toHtmlEmail(body, shopName),
        headers: {
          'Auto-Submitted': 'auto-generated',
          'X-Auto-Response-Suppress': 'All',
        },
      });

      this.logger.log(`Email sent → ${to}: ${subject}`);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMTP send failed';
      this.logger.error(`Email failed → ${to}`, err);
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV EMAIL FALLBACK] To: ${to}\nSubject: ${subject}\n${body}`);
      }
      return { ok: false, error: message };
    }
  }

  async notifyOrderCompleted(
    email: string,
    orderId: number,
    userId?: number,
  ) {
    await this.sendEmail(
      email,
      `Order #${orderId} Completed`,
      `Your order #${orderId} has been completed. Thank you for shopping at RanKageShop!`,
    );
    if (userId) {
      await this.userInbox.notify(userId, {
        type: 'order',
        title: 'Order Completed',
        body: `Your order #${orderId} is ready. Thank you for shopping!`,
        url: '/orders/history',
      });
    }
  }

  async notifyOrderProcessing(userId: number, orderId: number, productName: string) {
    await this.userInbox.notify(userId, {
      type: 'order',
      title: 'Order Processing',
      body: `Order #${orderId} — ${productName} is being processed.`,
      url: '/orders/history',
    });
  }

  async notifyOrderPending(userId: number, orderId: number, productName: string) {
    await this.userInbox.notify(userId, {
      type: 'order',
      title: 'Order Received',
      body: `Order #${orderId} — ${productName}. Complete payment to continue.`,
      url: '/orders/history',
    });
  }

  async notifyWalletTopupApproved(email: string, amount: number, userId?: number) {
    await this.sendEmail(
      email,
      'Wallet Top-Up Approved',
      `Your wallet top-up of Ks ${amount.toLocaleString()} has been approved.`,
    );
    if (userId) {
      await this.userInbox.notify(userId, {
        type: 'wallet',
        title: 'Top-Up Approved',
        body: `Ks ${amount.toLocaleString()} added to your wallet.`,
        url: '/wallet/history',
      });
    }
  }

  async notifyWalletTopupRejected(userId: number, amount: number, reason?: string) {
    const detail = reason?.trim() ? ` Reason: ${reason.trim()}` : '';
    await this.userInbox.notify(userId, {
      type: 'wallet',
      title: 'Top-Up Rejected',
      body: `Your Ks ${amount.toLocaleString()} wallet top-up was not approved.${detail}`,
      url: '/wallet/history',
    });
  }

  async notifyOrderRefunded(email: string, orderId: number, amount: number, userId?: number) {
    await this.sendEmail(
      email,
      `Order #${orderId} Refunded`,
      `Your order #${orderId} has been refunded. Ks ${amount.toLocaleString()} was credited to your wallet.`,
    );
    if (userId) {
      await this.userInbox.notify(userId, {
        type: 'refund',
        title: 'Order Refunded',
        body: `Ks ${amount.toLocaleString()} credited to your wallet for order #${orderId}.`,
        url: '/orders/history',
      });
    }
  }

  notifyPasswordReset(email: string, resetUrl: string) {
    return this.sendEmail(
      email,
      'Reset Your Password — RanKageShop',
      `Click to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
    );
  }

  notifyEmailVerification(email: string, verifyUrl: string) {
    return this.sendEmail(
      email,
      'Verify Your Email — RanKageShop',
      `Please verify your email:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    );
  }

  private toHtmlEmail(text: string, shopName: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    return `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5;color:#111">
<p>${escaped}</p>
<p style="color:#666;font-size:13px;margin-top:24px">— ${shopName}<br>
<a href="https://rankage.shop">rankage.shop</a></p>
</body></html>`;
  }
}
