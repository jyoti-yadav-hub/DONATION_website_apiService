import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum Type {
  like = 'like',
  dislike = 'dislike',
}
export class LikeDislikeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  post_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Type)
  type: string;
}
