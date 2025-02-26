import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OtpPlatform } from '../entities/user.entity';

export class VerifyPhoneOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(OtpPlatform)
  otp_platform: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  otp: string;
}
