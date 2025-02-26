/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class CreateReligionDto {

    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    religion: string
}
