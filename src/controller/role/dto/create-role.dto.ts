/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsEnum,
} from 'class-validator';


export enum Status {
    Active = 'Active',
    Deactive = 'Deactive',
}
  
export class CreateRoleDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    slug: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    icon: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    web_icon: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    description: string;

    @ApiProperty()
    @IsNumber()
    @Transform(({ value }) => Number.parseInt(value))
    @IsNotEmpty()
    index: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEnum(Status)
    status: string;

    @ApiProperty()
    createdBy: string;
  
    @ApiProperty()
    updatedBy: string;
}
