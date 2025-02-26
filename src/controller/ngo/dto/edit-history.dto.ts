/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
} from 'class-validator';


export class EditHistoryDto {

    @ApiProperty()
    @IsString()
    @IsOptional()
    history: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    values_and_principles: string;

}
