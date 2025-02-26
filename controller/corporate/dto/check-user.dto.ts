/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
export enum Type {
    signup = 'signup',
    update = 'update',
}
export class CheckUserDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    phone_code: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    phone: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEnum(Type)
    type: string;
}
