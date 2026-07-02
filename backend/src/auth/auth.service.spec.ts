import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import { TwoFactorService } from './two-factor.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    emailVerificationToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };

  const jwtService = { sign: jest.fn().mockReturnValue('test-token') };
  const notifications = {
    notifyEmailVerification: jest.fn(),
    notifyPasswordReset: jest.fn(),
  };
  const settings = {
    assertFeatureEnabled: jest.fn().mockResolvedValue(undefined),
    getFeatureFlags: jest.fn().mockResolvedValue({ emailNotificationsEnabled: true }),
  };
  const twoFactor = {
    createPendingToken: jest.fn().mockReturnValue('2fa-token'),
    verifyLogin: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: NotificationsService, useValue: notifications },
        { provide: SettingsService, useValue: settings },
        { provide: TwoFactorService, useValue: twoFactor },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException when username exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 1 });
      await expect(
        service.register({ username: 'test', email: 'a@b.com', password: 'secret1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and returns token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        username: 'test',
        email: 'a@b.com',
        role: 'USER',
        referralCode: 'MVPMM-TEST',
        walletBalance: 0,
      });

      const result = await service.register({
        username: 'test',
        email: 'a@b.com',
        password: 'secret1',
      });

      expect(result.access_token).toBe('test-token');
      expect(result.user.username).toBe('test');
      expect(notifications.notifyEmailVerification).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('throws on invalid token', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword('bad', 'newpass1')).rejects.toThrow(BadRequestException);
    });

    it('updates password on valid token', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue({ userId: 1 });
      prisma.user.update.mockResolvedValue({});
      prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.resetPassword('valid-token', 'newpass1');
      expect(result.message).toContain('successfully');
    });
  });

  describe('login', () => {
    it('validates password with bcrypt', async () => {
      const hash = await bcrypt.hash('secret1', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: 'test',
        email: 'a@b.com',
        password: hash,
        role: 'USER',
        referralCode: 'X',
        walletBalance: 0,
      });

      const result = await service.login({ username: 'test', password: 'secret1' });
      expect(result.access_token).toBe('test-token');
    });
  });
});
