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
import { OtpPlatform, Platform } from '../entities/ngo.entity';

export class CreateNgo {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  data: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  ngo_causes: [];

  @ApiProperty()
  @IsString()
  @IsOptional()
  uuid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Platform)
  platform: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  form_country: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  type: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  is_donor: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  is_user: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  is_volunteer: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty()
  data_id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEnum(OtpPlatform)
  otp_platform: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  otp: string;
}
