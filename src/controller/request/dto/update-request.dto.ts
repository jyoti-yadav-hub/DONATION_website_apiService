/* eslint-disable prettier/prettier */
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { NewRequestDto } from './new-request.dto';

export class UpdateRequestDto extends NewRequestDto {
}
