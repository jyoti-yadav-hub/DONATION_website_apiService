import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OtpPlatform } from '../entities/ngo.entity';

export class UpdateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  data: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
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

  @IsArray()
  @IsOptional()
  @ApiProperty()
  removed_files: [];
}
