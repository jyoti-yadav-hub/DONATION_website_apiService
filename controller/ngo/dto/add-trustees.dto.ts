/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  Matches,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { OtpPlatform } from '../entities/ngo.entity';
export class AddTrusteesDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  last_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d{1,14}$/)
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  phone_country_full_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  phone_country_short_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country_name: string;

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
