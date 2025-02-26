/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class GetUserByMailDto {
    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    phone: string;

    @IsArray()
    @IsOptional()
    @ApiProperty()
    admins: [];

    @IsString()
    @IsOptional()
    @ApiProperty()
    active_type: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    corporate_id: string;
}
