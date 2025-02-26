/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ExpiryDateDto {

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  request_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expiry_date: Date;
}
