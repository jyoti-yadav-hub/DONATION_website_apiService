/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GetUserByMailDto {
    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    phone: string;
}
