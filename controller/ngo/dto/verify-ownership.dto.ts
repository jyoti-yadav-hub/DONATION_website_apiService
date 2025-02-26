/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
} from 'class-validator';

export enum transferStatus {
    approve = 'approve',
    reject = 'reject',
}

export class VerifyOwnershipDto {
    
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEnum(transferStatus)
    transfer_status: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    reject_reason: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    noti_id: string;


}