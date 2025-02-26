import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Gender, Platform } from '../entities/user.entity';

export class CreateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  display_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/[1-9]\d{1,14}$/, { message: 'Please enter valid phone number' })
  phone: string;

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
  country_name: string;

  @IsNotEmpty()
  @ApiProperty()
  is_user: boolean;

  @IsNotEmpty()
  @ApiProperty()
  is_donor: boolean;

  @IsNotEmpty()
  @ApiProperty()
  is_volunteer: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

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
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  uId: string;

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
  @IsOptional()
  race: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  religion: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  blood_group: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  dob: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEnum(Gender)
  gender: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  my_causes: [];
}
