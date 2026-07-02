import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import { TwoFactorService } from './two-factor.service';
import { normalizePhone } from '../common/phone.util';

function generateReferralCode(username: string): string {
  const base = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'USER';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RANKAGE-${base}${suffix}`;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function appBaseUrl(): string {
  return process.env.APP_BASE_URL ?? 'http://localhost:3000';
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notifications: NotificationsService,
    private settings: SettingsService,
    private twoFactor: TwoFactorService,
  ) {}

  private formatUser(user: {
    id: number;
    username: string;
    email: string;
    role: string;
    referralCode: string | null;
    walletBalance: { toString(): string } | number;
    emailVerified?: boolean;
    avatarUrl?: string | null;
    phone?: string | null;
    phoneVerified?: boolean;
  }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role.toUpperCase(),
      referralCode: user.referralCode ?? '',
      walletBalance: Number(user.walletBalance),
      wallet_balance: Number(user.walletBalance),
      emailVerified: user.emailVerified ?? false,
      email_verified: user.emailVerified ?? false,
      avatarUrl: user.avatarUrl ?? null,
      avatar_url: user.avatarUrl ?? null,
      phone: user.phone ?? null,
      phoneVerified: user.phoneVerified ?? false,
    };
  }

  private issueAuthResponse(user: {
    id: number;
    username: string;
    email: string;
    role: string;
    referralCode: string | null;
    walletBalance: { toString(): string } | number;
    emailVerified?: boolean;
    avatarUrl?: string | null;
  }) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);
    return {
      access_token: token,
      refresh_token: token,
      user: this.formatUser(user),
    };
  }

  private googleClientIds(): string[] {
    const ids = [
      process.env.GOOGLE_CLIENT_ID,
      ...(process.env.GOOGLE_CLIENT_IDS?.split(',').map((s) => s.trim()) ?? []),
    ].filter((id): id is string => !!id);
    return [...new Set(ids)];
  }

  async getGoogleAuthConfig(): Promise<{ enabled: boolean; clientId: string | null }> {
    const flags = await this.settings.getFeatureFlags();
    const ids = this.googleClientIds();
    const enabled = flags.googleLoginEnabled && ids.length > 0;
    return {
      enabled,
      clientId: enabled ? ids[0] : null,
    };
  }

  private async uniqueUsername(base: string): Promise<string> {
    const sanitized = base.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
    let candidate = sanitized;
    let suffix = 0;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      suffix += 1;
      candidate = `${sanitized.slice(0, 16)}${suffix}`;
    }
    return candidate;
  }

  async googleLogin(dto: GoogleAuthDto) {
    await this.settings.assertFeatureEnabled('googleLoginEnabled');
    const audiences = this.googleClientIds();
    if (audiences.length === 0) {
      throw new BadRequestException('Google login is not configured on the server');
    }

    const client = new OAuth2Client();
    let payload: {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: audiences,
      });
      payload = ticket.getPayload() ?? {};
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google account');
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const picture = payload.picture ?? null;

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            emailVerified: user.emailVerified || payload.email_verified === true,
            ...(picture ? { avatarUrl: picture } : {}),
          },
        });
      }
    } else {
      const username = await this.uniqueUsername(payload.name ?? email.split('@')[0]);
      let code = generateReferralCode(username);
      while (await this.prisma.user.findUnique({ where: { referralCode: code } })) {
        code = generateReferralCode(username);
      }

      let referredById: number | undefined;
      if (dto.referralCode?.trim()) {
        const referrer = await this.prisma.user.findUnique({
          where: { referralCode: dto.referralCode.trim().toUpperCase() },
        });
        if (referrer) referredById = referrer.id;
      }

      user = await this.prisma.user.create({
        data: {
          username,
          email,
          googleId,
          avatarUrl: picture,
          emailVerified: payload.email_verified ?? true,
          referralCode: code,
          referredById,
        },
      });
    }

    if (user.isBanned) {
      throw new ForbiddenException(
        user.banReason?.trim() || 'Your account has been suspended. Contact support.',
      );
    }

    return this.issueAuthResponse(user);
  }

  private async createEmailVerification(userId: number, email: string) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.deleteMany({ where: { userId } });
    await this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    const verifyUrl = `${appBaseUrl()}/verify-email?token=${token}`;
    await this.notifications.notifyEmailVerification(email, verifyUrl);

    if (process.env.NODE_ENV !== 'production') {
      return { devToken: token };
    }
    return {};
  }

  async register(registerDto: RegisterDto) {
    await this.settings.assertFeatureEnabled('registrationEnabled');
    const { username, email, password, referralCode, phone } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    let normalizedPhone: string | undefined;
    if (phone?.trim()) {
      normalizedPhone = normalizePhone(phone);
    }

    if (normalizedPhone) {
      const phoneTaken = await this.prisma.user.findUnique({ where: { phone: normalizedPhone } });
      if (phoneTaken) {
        throw new ConflictException('Phone number already in use');
      }
    }

    let referredById: number | undefined;
    if (referralCode?.trim()) {
      await this.settings.assertFeatureEnabled('referralEnabled');
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: referralCode.trim().toUpperCase() },
      });
      if (referrer) referredById = referrer.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let code = generateReferralCode(username);
    while (await this.prisma.user.findUnique({ where: { referralCode: code } })) {
      code = generateReferralCode(username);
    }

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        referralCode: code,
        referredById,
        ...(normalizedPhone ? { phone: normalizedPhone, phoneVerified: false } : {}),
      },
    });

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    const verifyMeta = await this.createEmailVerification(user.id, user.email);

    return {
      access_token: token,
      user: this.formatUser(user),
      ...verifyMeta,
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Check if the input is username or email
    const user = await this.prisma.user.findFirst({ 
      where: { OR: [{ username }, { email: username }] }
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new ForbiddenException(
        user.banReason?.trim() || 'Your account has been suspended. Contact support.',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException('This account uses Google sign-in. Please continue with Google.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === 'ADMIN' && user.totpEnabled) {
      return {
        requires2FA: true,
        twoFactorToken: this.twoFactor.createPendingToken(user.id),
      };
    }

    return this.issueAuthResponse(user);
  }

  async verifyAdmin2FA(twoFactorToken: string, code: string) {
    const user = await this.twoFactor.verifyLogin(twoFactorToken, code);
    return this.issueAuthResponse(user);
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.formatUser(user);
  }

  async updateProfile(userId: number, data: { username?: string; email?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (data.username && data.username !== user.username) {
      const taken = await this.prisma.user.findUnique({ where: { username: data.username } });
      if (taken) throw new ConflictException('Username already taken');
    }
    if (data.email && data.email !== user.email) {
      const taken = await this.prisma.user.findFirst({ where: { email: data.email } });
      if (taken) throw new ConflictException('Email already taken');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username ? { username: data.username } : {}),
        ...(data.email ? { email: data.email } : {}),
      },
    });
    return this.formatUser(updated);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.password) {
      throw new BadRequestException('Google accounts cannot change password here. Set a password from profile settings is not supported yet.');
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { message: 'Password updated successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    if (!user.password) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${appBaseUrl()}/reset-password?token=${token}`;
    await this.notifications.notifyPasswordReset(user.email, resetUrl);

    return {
      message: 'If that email exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' ? { devToken: token } : {}),
    };
  }

  async validateResetToken(token: string) {
    const tokenHash = hashToken(token);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!record) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    return { valid: true };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken) as { sub: number };
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      if (user.isBanned) {
        throw new ForbiddenException(
          user.banReason?.trim() || 'Your account has been suspended. Contact support.',
        );
      }
      return this.issueAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async requestAccountDeletion(userId: number, _reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return {
      success: true,
      requested: true,
      message: 'Your account deletion request has been received. Our team will contact you.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!record) throw new BadRequestException('Invalid or expired reset token');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    return { message: 'Password reset successfully. You can now login.' };
  }

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!record) throw new BadRequestException('Invalid or expired verification link');

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    return { message: 'Email verified successfully!' };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      return { message: 'If that email exists, a verification link has been sent.' };
    }
    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    const meta = await this.createEmailVerification(user.id, user.email);
    return { message: 'Verification email sent.', ...meta };
  }
}
