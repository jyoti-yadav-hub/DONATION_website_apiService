import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDriveDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  data: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  active_type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  form_type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  draft_id: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  contacts: [];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  volunteers: [];

  @IsArray()
  @IsOptional()
  @ApiProperty()
  removed_files: [];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  fundraiser_ids: [];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  fund_ids: [];
}
