import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string; // This can be username OR email

  @IsString()
  password: string;
}
