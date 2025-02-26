import {
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export enum TransactionType {
  'fund-received' = 'fund-received',
  'fund-donated' = 'fund-donated',
}
export enum ActiveType {
  ngo = 'ngo',
  user = 'user',
  donor = 'donor',
  volunteer = 'volunteer',
  corporate = 'corporate',
}
export class PaymentProcessDto {
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
  @IsEnum(ActiveType)
  active_type: string;

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

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  claim_tax: boolean;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  service_charge: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  transaction_charge: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(TransactionType)
  transaction_type: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  @MaxLength(255)
  note: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  amount_usd: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  converted_amt: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  converted_total_amt: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  exchange_rate: number;
}
