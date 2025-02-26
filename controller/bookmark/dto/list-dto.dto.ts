import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ListDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  collection_id: string;

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
