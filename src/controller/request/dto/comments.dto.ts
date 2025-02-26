/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CommentDto {
  @ApiProperty()
  parent_id: string;

  @ApiProperty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  comment: string;

  @ApiProperty()
  type: string;
}
