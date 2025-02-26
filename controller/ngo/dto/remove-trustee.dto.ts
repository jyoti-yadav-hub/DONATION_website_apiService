/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString , IsArray, IsOptional} from 'class-validator';

export class RemoveTrusteeDto {

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    _id: string;

    @IsArray()
    @IsOptional()
    @ApiProperty()
    documents: [];

}
