import { IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from './register.dto';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  newPassword: string;
}
