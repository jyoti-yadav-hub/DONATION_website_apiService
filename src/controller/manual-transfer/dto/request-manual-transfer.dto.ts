import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsMongoId,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ObjectId } from 'mongoose';

export enum TransactionType {
  'ngo' = 'ngo-donation',
  'fund' = 'fund-donation',
  'fundraiser' = 'donation',
}

export class RequestManualTransferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency_symbol: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_name: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  transaction_date: Date;

  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(TransactionType)
  transaction_type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  request_id: ObjectId;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  receipt_image: string;
}
