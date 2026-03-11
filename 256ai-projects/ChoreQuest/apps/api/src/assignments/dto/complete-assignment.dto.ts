import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteAssignmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
