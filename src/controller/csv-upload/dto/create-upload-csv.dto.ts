/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum Status {
  Pending = 'Pending',
  Success = 'Success',
}

export class CreateUploadCsvDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Status)
  status: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  uploadedBy: string;
}