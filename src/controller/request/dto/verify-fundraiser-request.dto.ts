/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export enum fundraiserStatus {
  approve = 'approve',
  reject = 'reject',
  reverify = 'reverify',
}

export class VerifyFundraiserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(fundraiserStatus)
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reject_reason: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  allow_edit_request: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_urgent: boolean;
}
