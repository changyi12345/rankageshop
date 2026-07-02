import { IsEmail, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from './register.dto';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
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
