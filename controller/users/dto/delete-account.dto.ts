/* eslint-disable prettier/prettier */
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
export class DeleteAccountDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    reason: string;
}
