import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsObject,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Prisma } from '@prisma/client';
import { AssigneeModeDto, RecurrenceTypeDto } from './create-chore.dto';

export class UpdateChoreDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  points?: number;

  @IsOptional()
  @IsEnum(RecurrenceTypeDto)
  recurrenceType?: RecurrenceTypeDto;

  @IsOptional()
  @IsObject()
  recurrenceConfig?: Prisma.InputJsonValue;

  @IsOptional()
  @IsEnum(AssigneeModeDto)
  assigneeMode?: AssigneeModeDto;

  @ValidateIf((o) => o.assigneeMode === AssigneeModeDto.SINGLE)
  @IsNotEmpty({ message: 'assignedChildId is required when assigneeMode is single' })
  @IsUUID()
  assignedChildId?: string;

  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;
}
