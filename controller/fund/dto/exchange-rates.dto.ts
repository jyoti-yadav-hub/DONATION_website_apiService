/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class ExchangeRatesDto {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  from: string;

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  to: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  amount: number;
}
