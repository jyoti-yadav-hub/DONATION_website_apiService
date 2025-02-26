/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsString,
    IsOptional,
    IsBoolean
} from 'class-validator';

export enum ReceiptType {
    'download' = 'download',
    'view' = 'view',
  }
export class ViewReceiptDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    transaction_id: string;
 
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    @IsEnum(ReceiptType)
    receipt_type: string;
}
