/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsArray,
    IsOptional,
    IsBoolean,
    IsNumber,
} from 'class-validator';

export class InviteAdminDto {
    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    admins: [];

}
