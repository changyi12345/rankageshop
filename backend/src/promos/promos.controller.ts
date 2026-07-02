import { Body, Controller, Post } from '@nestjs/common';
import { PromosService } from './promos.service';
import { ValidatePromoDto } from './dto/promo.dto';

/** Public promo endpoints — CRUD is on `/admin/promos` (JWT + ADMIN). */
@Controller('promos')
export class PromosController {
  constructor(private promosService: PromosService) {}

  @Post('validate')
  validate(@Body() dto: ValidatePromoDto) {
    return this.promosService.validate(dto);
  }
}
