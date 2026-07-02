import { IsObject } from 'class-validator';

export class ValidatePlayerDto {
  @IsObject()
  fields: Record<string, string>;
}
