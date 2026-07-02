import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { JWT_SECRET, ACCESS_TOKEN_SECONDS } from './jwt.constants';

import { TwoFactorService } from './two-factor.service';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: ACCESS_TOKEN_SECONDS },
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, TwoFactorService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule, RolesGuard, TwoFactorService],
})
export class AuthModule {}
