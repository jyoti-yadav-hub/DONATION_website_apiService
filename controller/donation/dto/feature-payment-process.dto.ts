/* eslint-disable prettier/prettier */
import {
    IsNotEmpty,
    IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FeaturePaymentProcessDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    request_id: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    plan_id: string;
}
