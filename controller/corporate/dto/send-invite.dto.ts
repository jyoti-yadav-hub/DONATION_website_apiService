/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  Matches,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class SendInviteDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  contacts: [];
}
