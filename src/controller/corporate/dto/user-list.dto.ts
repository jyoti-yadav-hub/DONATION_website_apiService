import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserListDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  role: [];

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  page: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  per_page: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sort_by: string;
}
