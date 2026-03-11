import { IsString, IsOptional, MinLength, MaxLength, IsObject } from 'class-validator';
import { Prisma } from '@prisma/client';

export class UpdateHouseholdDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  settings?: Prisma.InputJsonValue;
}
