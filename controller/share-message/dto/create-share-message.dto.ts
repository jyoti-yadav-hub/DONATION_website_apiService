/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsArray,
    IsNumber,
    IsBoolean,
} from 'class-validator';

export class CreateShareMessageDto {

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    message: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    causes: string;

    @ApiProperty()
    createdBy: string;
  
    @ApiProperty()
    updatedBy: string;
}
