/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum bankStatus {
    approve = 'approve',
    reject = 'reject',
    reverify = 'reverify',
}

export class VerifyBankDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEnum(bankStatus)
    status: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    reject_reason: string;
}
