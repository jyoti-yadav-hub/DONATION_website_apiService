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

export class CreateFundDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    data: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    active_type: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    form_type: string;
  
    @IsArray()
    @IsOptional()
    @ApiProperty()
    removed_files: [];
  
    @ApiProperty()
    @IsString()
    @IsOptional()
    draft_id: string;

    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    fund_causes: [];

    @ApiProperty()
    @IsArray()
    @IsOptional()
    regions: [];

    @ApiProperty()
    @IsArray()
    @IsOptional()
    countries: [];

    @ApiProperty()
    @IsArray()
    @IsOptional()
    admins: [];
}
