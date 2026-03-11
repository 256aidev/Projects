import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  overdueAlertsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  approvalAlertsEnabled?: boolean;
}
