/* eslint-disable prettier/prettier */
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
export class CreateDeleteAccountDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    form_data: string;

    @ApiProperty()
    createdBy: string;

    @ApiProperty()
    updatedBy: string;
}
