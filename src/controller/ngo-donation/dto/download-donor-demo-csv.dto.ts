/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
export class DownloadDonorDemoCsv {
  @IsString()
  @IsOptional()
  @ApiProperty()
  first_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  last_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phone: string;
}
