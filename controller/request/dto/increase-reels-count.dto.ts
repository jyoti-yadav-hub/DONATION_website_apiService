import { ApiProperty } from '@nestjs/swagger';
import {IsString, IsNotEmpty } from 'class-validator';

export class IncreaseReelsCount {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  type: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  user_id: string;
}
