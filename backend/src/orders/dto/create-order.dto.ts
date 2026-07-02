import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsOptional()
  @IsNumber()
  productId?: number;

  @IsOptional()
  @IsNumber()
  g2bulkProductId?: number;

  @IsOptional()
  @IsString()
  g2bulkGameCode?: string;

  @IsOptional()
  @IsString()
  gameCode?: string;

  @IsOptional()
  @IsString()
  catalogueName?: string;

  @IsOptional()
  @IsString()
  packageName?: string;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  playerId?: string;

  @IsOptional()
  @IsString()
  serverId?: string;

  @IsOptional()
  @IsString()
  playerName?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;
}
