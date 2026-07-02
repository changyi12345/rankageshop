import { IsOptional, IsString } from 'class-validator';

export class SubmitPaymentProofDto {
  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class RejectPaymentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
