/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
} from 'class-validator';


export class EditVissionDto {

    @ApiProperty()
    @IsString()
    @IsOptional()
    vission: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    mission: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    programs: string;

}
