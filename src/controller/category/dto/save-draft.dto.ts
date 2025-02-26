/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
export class SaveDraftDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  label_of_count: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  category_slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  who_can_access: [];

  @IsString()
  @IsOptional()
  @ApiProperty()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  header_form: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  form_settings: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  is_category_active: string;

  @ApiProperty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  is_urgent_help: boolean;

  @ApiProperty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  comment_enabled: boolean;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value))
  @IsOptional()
  index: number;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  countries: [];

  @ApiProperty()
  is_draft: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  draft_id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  unverified_id: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_stepper: boolean;
}
