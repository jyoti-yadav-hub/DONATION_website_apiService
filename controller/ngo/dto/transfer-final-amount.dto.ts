/* eslint-disable prettier/prettier */
import {
  IsNumber,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferFinalAmountDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  ngo_id: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  amount: number;
}
