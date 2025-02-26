import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  id: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  removeFile: boolean;
}
