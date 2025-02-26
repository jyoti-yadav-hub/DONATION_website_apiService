/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
} from 'class-validator';

export class ManagePermissionDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    user_id: string;

    @ApiProperty()
    @IsBoolean()
    @IsNotEmpty()
    invite_fund_admin: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsNotEmpty()
    donate_to_fundraiser: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsNotEmpty()
    fund_organizer: boolean;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    max_donate_amount: number;

}
