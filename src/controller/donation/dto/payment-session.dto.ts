/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PaymentSessionDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    payment_id: string;
}
