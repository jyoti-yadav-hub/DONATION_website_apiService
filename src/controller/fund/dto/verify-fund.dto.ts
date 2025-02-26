/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum fundStatus {
  approve = 'approve',
  reject = 'reject',
  reverify = 'reverify',
}

export class VerifyFundDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(fundStatus)
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reject_reason: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  allow_edit_fund: boolean;
}
