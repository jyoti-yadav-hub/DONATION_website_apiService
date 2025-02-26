/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
} from 'class-validator';

export enum ngoStatus {
    approve = 'approve',
    reject = 'reject',
    reverify = 'reverify',
}

export class VerifyNgoDto {
    
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEnum(ngoStatus)
    ngo_status: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    reject_reason: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    noti_id: string;


}
