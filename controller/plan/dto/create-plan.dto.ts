/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  duration_type: string;

  @ApiProperty()
  @IsNumber({},{ message: 'Please enter only numeric value' })
  @IsNotEmpty()
  @Transform(({ value }) => Number.parseInt(value))
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;
}