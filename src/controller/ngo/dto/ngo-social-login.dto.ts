/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsBoolean,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  Matches,
} from 'class-validator';
import { OtpPlatform, Platform } from '../entities/ngo.entity';

export enum SocialType {
  google = 'google',
  facebook = 'facebook',
  facebook_phone_login = 'facebook_phone_login',
  apple = 'apple',
}
export class NgoSocialLoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ngo_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  ngo_email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_country_full_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_country_short_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  secondary_country_full_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  secondary_country_short_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ngo_cover_image: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ngo_deed: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  website_link: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expiry_date: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ngo_certificate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ngo_registration_number: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  latitude: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  longitude: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ngo_phone_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d{1,14}$/)
  ngo_phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  secondary_phone_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  secondary_phone: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  ngo_causes: [];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  upload_12A_80G_certificate: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  upload_FCRA_certificate: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ngo_12A_certificate: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ngo_80G_certificate: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ngo_FCRA_certificate: string;

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
  @IsEnum(SocialType)
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  data_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  about_us: string;

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
