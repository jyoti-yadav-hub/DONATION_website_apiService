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

export enum helpRequestStatus {
  completed = 'completed',
  rejected = 'rejected',
}

export class VerifyHelpRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(helpRequestStatus)
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reject_reason: string;
}
