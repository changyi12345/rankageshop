import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JWT_SECRET } from '../jwt.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: { sub: number }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) return null;
      if (user.isBanned) return null;
      const { password: _pw, ...safe } = user;
      return safe;
    } catch {
      return null;
    }
  }
}
