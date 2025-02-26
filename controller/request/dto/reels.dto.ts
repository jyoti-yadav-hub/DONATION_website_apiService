/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ReelsDto {
  @ApiProperty()
  @IsOptional()
  @ApiProperty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  active_type: string;

  @ApiProperty()
  @IsNumberString()
  @IsOptional()
  page: string;

  @ApiProperty()
  @IsNumberString()
  @IsOptional()
  per_page: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sort_type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sort: string;
}
