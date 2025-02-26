import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  value: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  slug: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  category_slug: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  group_name: string;
}
