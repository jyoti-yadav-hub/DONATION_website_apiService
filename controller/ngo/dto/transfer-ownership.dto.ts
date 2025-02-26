/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsArray,
} from 'class-validator';
export class TransferOwnershipDto {

    @ApiProperty()
    @IsArray()
    @IsOptional()
    transfer_documents: [];

    @IsString()
    @IsOptional()
    @ApiProperty()
    transfer_reason: string;
}