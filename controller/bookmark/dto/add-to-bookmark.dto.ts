
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddToBookmarkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  request_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  collection_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category_slug: string;
}
