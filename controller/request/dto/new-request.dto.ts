/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class NewRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  category_slug: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  data: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  active_type: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  country: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  currency: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  comment_enabled: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bank_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  form_type: string;

  @IsArray()
  @IsOptional()
  @ApiProperty()
  removed_files: [];

  @ApiProperty()
  @IsString()
  @IsOptional()
  draft_id: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_drive_fundraiser: boolean;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  add_location_for_food_donation: [];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  disaster_links: [];
}
