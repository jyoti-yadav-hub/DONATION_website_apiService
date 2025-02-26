/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class FundraiserActivityLogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  request_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty()
  @IsNumberString()
  @IsOptional()
  page: string;

  @ApiProperty()
  @IsNumberString()
  @IsOptional()
  per_page: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sort_type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sort: string;
}
