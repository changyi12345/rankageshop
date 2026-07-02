import { Controller, Get, Param, Query } from '@nestjs/common';
import { VouchersService } from './vouchers.service';

@Controller('vouchers')
export class VouchersController {
  constructor(private vouchersService: VouchersService) {}

  @Get('categories')
  findCategories() {
    return this.vouchersService.findCategories();
  }

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    const id = categoryId ? +categoryId : undefined;
    return this.vouchersService.findAll(Number.isFinite(id) ? id : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(+id);
  }
}
