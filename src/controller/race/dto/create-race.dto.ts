/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class CreateRaceDto {

    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    race: string
}
