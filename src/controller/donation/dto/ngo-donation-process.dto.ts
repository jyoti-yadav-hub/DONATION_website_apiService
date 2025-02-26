import {
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NgoDonationProcessDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  ngo_id: string;

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

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  active_type: string;
}
