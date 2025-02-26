/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum status {
  approve = 'approve',
  reject = 'reject',
  reverify = 'reverify',
}

export class VerifyRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(status)
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reason: string;
}
