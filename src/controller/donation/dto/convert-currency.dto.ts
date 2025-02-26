/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsNumber
} from 'class-validator';

export class ConvertCurrencyDto {
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
}
