/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  IsBoolean,
} from 'class-validator';
import { OtpPlatform, Platform } from '../entities/user.entity';

export enum SocialType {
  google = 'google',
  facebook = 'facebook',
  facebook_phone_login = 'facebook_phone_login',
  apple = 'apple',
}

export class SocialSignupDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  first_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  last_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(SocialType)
  type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  uuid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Platform)
  platform: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_country_full_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_country_short_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d{1,14}$/)
  phone: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  longitude: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  data_id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  uId: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  is_donor: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  is_user: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  is_volunteer: boolean;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  my_causes: [];

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  race: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  religion: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  display_name: string;

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
