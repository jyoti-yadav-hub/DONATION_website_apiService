/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  label_of_count: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_template: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  category_slug: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
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
  @IsNotEmpty()
  form_settings: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  is_category_active: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_urgent_help: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  for_fund: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  for_fundraiser: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  for_corporate: boolean;

  @ApiProperty()
  @IsBoolean()
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
  @IsBoolean()
  @IsOptional()
  is_stepper: boolean;
}
