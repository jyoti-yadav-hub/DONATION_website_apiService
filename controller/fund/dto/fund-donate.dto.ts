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

export enum ActiveType {
  ngo = 'ngo',
  user = 'user',
  donor = 'donor',
  volunteer = 'volunteer',
}
export class FundDonateDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fund_id: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  request_id: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  ngo_id: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  to_fund_id: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(ActiveType)
  active_type: string;

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
  @IsOptional()
  @ApiProperty()
  service_charge: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  transaction_charge: number;

  @IsString()
  @IsOptional()
  @ApiProperty()
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

  @IsString()
  @IsOptional()
  @ApiProperty()
  currency_code: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  fund_help_request_id: string;
}
