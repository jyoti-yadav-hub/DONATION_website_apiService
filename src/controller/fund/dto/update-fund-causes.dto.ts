/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNotEmpty, IsString } from 'class-validator';

export class UpdateFundCausesDto {
    @ApiProperty()
    @IsNotEmpty()
    causes: [];

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    fund_id: string;
}