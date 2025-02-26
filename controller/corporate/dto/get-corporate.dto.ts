/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, Matches } from 'class-validator';

export class GetCorporateDto {
    @IsString()
    @ApiProperty()
    search: string;
    
}