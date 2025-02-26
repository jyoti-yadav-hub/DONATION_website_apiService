/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateFooterStripDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  inner_title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  inner_description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  outer_title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  outer_description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  url: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;
}
