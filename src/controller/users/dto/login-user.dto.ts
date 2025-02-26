import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Platform } from '../entities/user.entity';

export class LoginUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d{1,14}$/)
  phone: string;

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

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_name: string;
}
