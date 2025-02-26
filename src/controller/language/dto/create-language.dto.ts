/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export enum Status {
  Active = 'Active',
  Deactive = 'Deactive',
}
export class CreateLanguageDto {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  language: string;

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  language_specific_name: string;

  @IsArray()
  @ApiProperty()
  @IsOptional()
  country_code: [];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Status)
  status: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;
}
