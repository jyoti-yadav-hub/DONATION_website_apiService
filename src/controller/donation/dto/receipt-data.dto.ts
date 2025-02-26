/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsString,
    IsOptional,
    IsBoolean
} from 'class-validator';

export enum TransactionType {
    'donation' = 'donation',
    'ngo-donation' = 'ngo-donation',
    'featured-transaction' = 'featured-transaction',
    'fund-received' = 'fund-received',
    'fund-donated' = 'fund-donated',
  }
export class ReceiptDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    transaction_id: string;

    @IsString()
    @IsOptional()
    @IsEnum(TransactionType)
    @ApiProperty()
    transaction_type: string;

    @IsBoolean()
    @IsOptional()
    @ApiProperty()
    is_download: boolean;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    user_id: string;
}
