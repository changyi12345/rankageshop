import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const REFERRAL_REWARD = 5000;

function generateReferralCode(username: string): string {
  const base = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'USER';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MVPMM-${base}${suffix}`;
}

@Injectable()
export class ReferralService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  async getReferralStats(userId: number) {
    await this.settings.assertFeatureEnabled('referralEnabled');
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, username: true },
    });
    if (!user) return null;

    if (!user.referralCode) {
      let code = generateReferralCode(user.username);
      while (await this.prisma.user.findUnique({ where: { referralCode: code } })) {
        code = generateReferralCode(user.username);
      }
      user = await this.prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true, username: true },
      });
    }

    const referrals = await this.prisma.user.findMany({
      where: { referredById: userId },
      select: { id: true, username: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      code: user.referralCode,
      referralCount: referrals.length,
      totalEarnings: referrals.length * REFERRAL_REWARD,
      rewardPerReferral: REFERRAL_REWARD,
      history: referrals.map((r) => ({
        username: r.username,
        date: r.createdAt.toISOString().slice(0, 10),
        reward: REFERRAL_REWARD,
      })),
    };
  }
}
