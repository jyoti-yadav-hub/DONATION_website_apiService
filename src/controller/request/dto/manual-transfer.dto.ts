/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class ManualTransferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  receipt_number: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  currency: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  date: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  mark_closed: string;
}
