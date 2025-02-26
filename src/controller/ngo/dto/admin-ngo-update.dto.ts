import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AdminNgoUpdateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  data: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_name: string;

  @IsArray()
  @IsOptional()
  @ApiProperty()
  removed_files: [];
}
