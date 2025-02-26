import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';

export enum TransactionType {
  'ngo' = 'ngo-donation',
  'fund' = 'fund-donation',
  'fundraiser' = 'donation',
}
export class CreateManualTransferDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(TransactionType)
  transaction_type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  currency_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  transaction_id: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  receipt_image: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  transaction_date: Date;
}
