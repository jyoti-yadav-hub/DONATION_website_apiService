/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty
} from 'class-validator';

export class CreateFundHelpRequestDto {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fund_id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    request_id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiProperty()
    user_id: string;

}

