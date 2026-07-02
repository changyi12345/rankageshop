import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;

export class RegisterDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  password: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
