/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FeedListDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  request_type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  page: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  per_page: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  sort_type: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  sort: string;
}
