/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { ObjectId } from 'mongoose';

export class CreateEmailTemplateDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    email_template_name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    email_content: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    email_subject: string;

    @ApiProperty()
    email_slug: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    email_status: string;

    @ApiProperty()
    createdBy: string;

    @ApiProperty()
    updatedBy: string;

}
