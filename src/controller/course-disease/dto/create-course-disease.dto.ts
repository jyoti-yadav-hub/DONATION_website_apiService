/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
} from 'class-validator';
export enum Type {
    Course = 'Course',
    Disease = 'Disease',
  }
export class CreateCourseDiseaseDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    type: string;

    @ApiProperty()
    createdBy: string;

    @ApiProperty()
    updatedBy: string;

}
