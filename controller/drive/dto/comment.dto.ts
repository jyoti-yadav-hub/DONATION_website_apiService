/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CommentDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  parent_id: string;

  @ApiProperty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  post_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  comment: string;

  @ApiProperty()
  type: string;
}
