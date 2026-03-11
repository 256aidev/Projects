import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class CreateRotationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  childIds!: string[];
}
