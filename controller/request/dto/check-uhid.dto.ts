/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString} from 'class-validator';

export class CheckUhidDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    column: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    value: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    category_slug: string;
}