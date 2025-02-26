import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class NgoRequestsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  ngo_id: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  home_screen: number;

  @IsString()
  @IsOptional()
  @ApiProperty()
  page: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
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
