/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsArray,
  IsEnum,
} from 'class-validator';

export enum Status {
  Active = 'Active',
  Deactive = 'Deactive',
}

export class CreateCurrencyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Transform(({ value }) => value.trim())
  country: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  region: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(Status)
  status: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Transform(({ value }) => value.trim())
  country_code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  emoji: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  currency: [];

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;
}
