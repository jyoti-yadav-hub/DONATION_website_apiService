/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNotEmpty, IsString } from 'class-validator';

export class SelectCausesDto {
    @ApiProperty()
    @IsNotEmpty()
    id: [];

    @ApiProperty()
    @IsOptional()
    @IsString()
    type: string;
}