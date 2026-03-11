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

export enum RecurrenceTypeDto {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  WEEKDAYS = 'weekdays',
  CUSTOM = 'custom',
}

export enum AssigneeModeDto {
  SINGLE = 'single',
  ROTATION = 'rotation',
}

export class CreateChoreDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @Min(0)
  @Max(9999)
  points!: number;

  @IsEnum(RecurrenceTypeDto)
  recurrenceType!: RecurrenceTypeDto;

  @IsOptional()
  @IsObject()
  recurrenceConfig?: Prisma.InputJsonValue;

  @IsEnum(AssigneeModeDto)
  assigneeMode!: AssigneeModeDto;

  @ValidateIf((o) => o.assigneeMode === AssigneeModeDto.SINGLE)
  @IsNotEmpty({ message: 'assignedChildId is required when assigneeMode is single' })
  @IsUUID()
  assignedChildId?: string;

  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;
}
