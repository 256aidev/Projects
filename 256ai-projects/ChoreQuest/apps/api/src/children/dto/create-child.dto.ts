import { IsString, IsOptional, IsInt, MinLength, MaxLength, Min, Max, Matches } from 'class-validator';

export class CreateChildDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'avatarColor must be a valid hex color (e.g. #FF0000)' })
  avatarColor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;
}
