import { IsEmail, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class VerifyEmailDto {
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}
