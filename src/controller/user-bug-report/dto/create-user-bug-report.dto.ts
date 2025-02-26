/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
} from 'class-validator';
export class CreateUserBugReportDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    screen_name: string;

    @ApiProperty()
    image: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    description: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    user_name: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    user_id: string;

}
