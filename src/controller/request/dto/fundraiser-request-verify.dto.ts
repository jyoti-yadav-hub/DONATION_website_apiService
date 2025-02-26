/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
} from 'class-validator';
export enum Status {
  approve = 'approve',
  reject = 'reject',
}
export class FundraiserRequestVerifyDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(Status)
  @ApiProperty()
  status: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  request_id: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  form_settings: [];

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  allow_for_reverify: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  block_request: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty()
  other_reason: string;
}
