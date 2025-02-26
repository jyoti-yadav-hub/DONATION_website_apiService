/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export class AdminNgoCreateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  data: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  ngo_causes: [];

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  form_country: string;
}
