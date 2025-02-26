import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
export enum Status {
    Active = 'Active',
    Deactive = 'Deactive',
}
export class CreateWomenEmpowermentAreaDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    area: string;

    @ApiProperty()
    @IsArray()
    @IsOptional()
    sub_area: [];

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEnum(Status)
    status: string;
}
