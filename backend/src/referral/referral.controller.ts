import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReferralService } from './referral.service';

@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Get()
  getStats(@Req() req: { user: { id: number } }) {
    return this.referralService.getReferralStats(req.user.id);
  }
}
