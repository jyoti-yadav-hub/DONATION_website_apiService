/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  Matches,
} from 'class-validator';

export class AdminCreateNgoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ngo_name: string;

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
  @IsOptional()
  @ApiProperty()
  secondary_country_full_name: string;

  @IsString()
  @IsOptional()
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
  ngo_certificate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ngo_registration_number: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expiry_date: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  latitude: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  longitude: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  ngo_email: string;

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
  @IsOptional()
  secondary_phone_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  secondary_phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  website_link: string;

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


  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  about_us: string;

}
