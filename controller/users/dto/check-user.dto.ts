/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
export enum Type {
    login = 'login',
    facebook_login = 'facebook_login',
    ngo_facebook_phone_login = 'ngo_facebook_phone_login',
    social_login = 'social_login',
    signup = 'signup',
    update = 'update',
    ngo_signup = 'ngo_signup',
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
    @IsOptional()
    display_name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEnum(Type)
    type: string;


    @ApiProperty()
    @IsString()
    @IsOptional()
    ngo_registration_number: string;
}
