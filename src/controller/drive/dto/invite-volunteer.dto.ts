/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsArray,
    IsString,
} from 'class-validator';

export class InviteVolunteerDto {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    volunteers: [];
}
