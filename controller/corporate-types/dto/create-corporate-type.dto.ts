/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export enum Status {
  Active = 'Active',
  Deactive = 'Deactive',
}
export class CreateCorporateTypeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  form_settings: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Status)
  status: string;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value))
  @IsNotEmpty()
  index: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  coming_soon: boolean;
}
