import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateCorporateDto {
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
  email: string;

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
  organization_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  job_title: string;

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

  @ApiProperty()
  @IsString()
  @IsOptional()
  uuid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  website: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_authorise: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  agree_to_partner: boolean;

  @ApiProperty()
  location: object;

  @ApiProperty()
  time_zone: string;

  @ApiProperty()
  country_data: object;

  @ApiProperty()
  expired_at: number;

  @ApiProperty()
  profile_set: boolean;
}
