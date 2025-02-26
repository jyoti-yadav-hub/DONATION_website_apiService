import {
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateHelpRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  help_language: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  audio: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  location: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  latitude: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  longitude: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNotEmpty()
  city: string;
}
