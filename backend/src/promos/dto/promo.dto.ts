import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePromoDto {
  @IsString()
  code: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @IsInt()
  @Min(1)
  maxUsage: number;

  @IsString()
  validFrom: string;

  @IsString()
  validUntil: string;

  @IsOptional()
  isActive?: boolean;
}

export class UpdatePromoDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsage?: number;

  @IsOptional()
  @IsString()
  validFrom?: string;

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  isActive?: boolean;
}

export class ValidatePromoDto {
  @IsString()
  code: string;

  @IsInt()
  @Min(0)
  subtotal: number;
}
