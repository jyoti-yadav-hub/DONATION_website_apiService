import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ActivePastDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  type: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  userType: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  userId: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  home_screen: string;

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
