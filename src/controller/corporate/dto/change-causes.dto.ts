/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNotEmpty, IsString, IsArray } from 'class-validator';

export class ChangeCausesDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  id: [];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  corporate_id: string;
}
