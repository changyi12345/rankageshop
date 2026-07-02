import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { generateSecret, generateURI, verify } from 'otplib';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

function normalizeCode(code: string): string {
  return code.replace(/\s|-/g, '').trim();
}

function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(4).toString('hex').toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  });
}

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getStatus(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true, role: true },
    });
    if (!user || user.role !== 'ADMIN') {
      throw new BadRequestException('Admin account required');
    }
    return { enabled: user.totpEnabled };
  }

  async setup(userId: number, shopName = 'RanKageShop') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      throw new BadRequestException('Admin account required');
    }
    if (user.totpEnabled) {
      throw new BadRequestException('2FA is already enabled. Disable it first to reconfigure.');
    }

    const secret = user.totpSecret ?? generateSecret();
    if (!user.totpSecret) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { totpSecret: secret, totpEnabled: false, totpBackupHashes: [] },
      });
    }

    const otpauthUrl = generateURI({
      issuer: shopName,
      label: user.email,
      secret,
    });

    return { secret, otpauthUrl };
  }

  async enable(userId: number, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      throw new BadRequestException('Admin account required');
    }
    if (!user.totpSecret) {
      throw new BadRequestException('Run 2FA setup first');
    }
    if (user.totpEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const valid = await this.verifyTotp(user.totpSecret, code);
    if (!valid) {
      throw new BadRequestException('Invalid verification code');
    }

    const backupCodes = generateBackupCodes();
    const backupHashes = await Promise.all(backupCodes.map((c) => bcrypt.hash(normalizeCode(c), 10)));

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true, totpBackupHashes: backupHashes },
    });

    return { enabled: true, backupCodes };
  }

  async disable(userId: number, password: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      throw new BadRequestException('Admin account required');
    }
    if (!user.totpEnabled || !user.password) {
      throw new BadRequestException('2FA is not enabled');
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Incorrect password');
    }

    const verified = await this.verifyUserCode(user, code);
    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null, totpBackupHashes: [] },
    });

    return { enabled: false };
  }

  createPendingToken(userId: number): string {
    return this.jwtService.sign(
      { sub: userId, purpose: 'admin_2fa' },
      { expiresIn: '5m' },
    );
  }

  async verifyLogin(twoFactorToken: string, code: string) {
    let payload: { sub?: number; purpose?: string };
    try {
      payload = this.jwtService.verify(twoFactorToken);
    } catch {
      throw new UnauthorizedException('2FA session expired. Please login again.');
    }

    if (payload.purpose !== 'admin_2fa' || !payload.sub) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.role !== 'ADMIN' || !user.totpEnabled) {
      throw new UnauthorizedException('2FA verification failed');
    }

    const verified = await this.verifyUserCode(user, code);
    if (!verified) {
      throw new UnauthorizedException('Invalid verification code');
    }

    return user;
  }

  private async verifyUserCode(
    user: { id: number; totpSecret: string | null; totpBackupHashes: string[] },
    code: string,
  ): Promise<boolean> {
    const normalized = normalizeCode(code);

    if (user.totpSecret && (await this.verifyTotp(user.totpSecret, normalized))) {
      return true;
    }

    if (user.totpBackupHashes.length > 0 && normalized.length >= 8) {
      for (let i = 0; i < user.totpBackupHashes.length; i++) {
        const match = await bcrypt.compare(normalized, user.totpBackupHashes[i]);
        if (match) {
          const remaining = [...user.totpBackupHashes];
          remaining.splice(i, 1);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { totpBackupHashes: remaining },
          });
          return true;
        }
      }
    }

    return false;
  }

  private async verifyTotp(secret: string, token: string): Promise<boolean> {
    if (!/^\d{6}$/.test(token)) return false;
    const result = await verify({ secret, token, epochTolerance: 1 });
    return result.valid;
  }
}
