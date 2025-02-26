/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsString } from 'class-validator';

export class SendInviteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  request_id: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  admins: [];
}
