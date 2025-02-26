/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddTeamMemberDto {

    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    ngo_id: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    phone_code: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @ApiProperty()
    @IsOptional()
    image: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    name: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    position: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    email: string;
}