/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
export class CreateImageDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  view_type: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  image: string;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value))
  @IsNotEmpty()
  index: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  createdBy: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  updatedBy: string;
}
