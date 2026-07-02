import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class TopUpWalletDto {
  @Transform(({ value }) => Math.round(Number(value)))
  @IsNumber()
  @IsInt()
  @Min(1000)
  amount: number;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  proofImageUrl?: string;
}
