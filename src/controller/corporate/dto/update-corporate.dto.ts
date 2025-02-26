import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
export class UpdateCorporateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  corporate_id: string;

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
  job_title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_country_full_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_country_short_name: string;
}
