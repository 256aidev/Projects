import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  defaultApprovalRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  pointsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;
}
