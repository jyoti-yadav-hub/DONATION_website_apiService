import {
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum TransactionType {
  'donation' = 'donation',
  'ngo-donation' = 'ngo-donation',
  'fund-received' = 'fund-received',
}
export enum Platform {
  Android = 'Android',
  Ios = 'Ios',
  web = 'web',
}

export class GuestPaymentProcessDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  id: string;

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

  @IsString()
  @IsOptional()
  @ApiProperty()
  tax_number: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  is_tax_benefit: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  is_contribute_anonymously: boolean;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  service_charge: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  @Transform(({ value }) => Number.parseInt(value))
  transaction_charge: number;

  @IsString()
  @IsOptional()
  @ApiProperty()
  @MaxLength(255)
  note: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(TransactionType)
  transaction_type: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  amount_usd: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  exchange_rate: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  converted_amt: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  converted_total_amt: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/[1-9]\d{1,14}$/, { message: 'Please enter valid phone number' })
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_country_full_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone_country_short_name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country_name: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  longitude: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city: string;
}
