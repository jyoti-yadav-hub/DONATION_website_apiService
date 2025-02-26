/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class FundraiserRequestDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    category_id: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    fundraiser_name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    beniﬁcary_name: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    fundraiser_type: string;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty()
    amount_goal: number;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    story: number;

    @IsString()
    @IsOptional()
    @ApiProperty()
    cover_photo: string;

    @IsBoolean()
    @IsNotEmpty()
    @ApiProperty()
    is_urgent: boolean;
    
    @IsString()
    @IsOptional()
    @ApiProperty()
    images: string;
    
    @IsArray()
    @IsOptional()
    @ApiProperty()
    video: string;
    
    @IsString()
    @IsOptional()
    @ApiProperty()
    income_proof: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    fundraiser_document: string

    @IsString()
    @IsOptional()
    @ApiProperty()
    front: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    back: string;
}
