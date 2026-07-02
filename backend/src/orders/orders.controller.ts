import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SubmitPaymentProofDto } from './dto/payment-proof.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, createOrderDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.ordersService.findAllByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(+id, req.user.id);
  }

  @Post(':id/payment-proof')
  submitPaymentProof(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: SubmitPaymentProofDto,
  ) {
    return this.ordersService.submitPaymentProof(+id, req.user.id, dto);
  }

  @Post(':id/cancel')
  cancel(@Request() req, @Param('id') id: string) {
    return this.ordersService.cancelByUser(+id, req.user.id);
  }
}
