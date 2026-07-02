import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TopUpWalletDto } from './dto/topup-wallet.dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('payment-methods')
  getPaymentMethods() {
    return this.walletService.getPaymentMethods();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getWallet(@Req() req: { user: { id: number } }) {
    return this.walletService.getWallet(req.user.id);
  }

  @Get('topups')
  @UseGuards(JwtAuthGuard)
  listTopUps(@Req() req: { user: { id: number } }) {
    return this.walletService.listTopUps(req.user.id);
  }

  @Post('topup')
  @UseGuards(JwtAuthGuard)
  requestTopUp(@Req() req: { user: { id: number } }, @Body() dto: TopUpWalletDto) {
    return this.walletService.requestTopUp(req.user.id, dto);
  }

  @Post('topups')
  @UseGuards(JwtAuthGuard)
  requestTopUpAlias(
    @Req() req: { user: { id: number } },
    @Body()
    body: {
      amount: number;
      payment_method_id?: string;
      paymentMethod?: string;
      proofImageUrl?: string;
    },
  ) {
    return this.walletService.requestTopUpFromBody(req.user.id, body);
  }
}
