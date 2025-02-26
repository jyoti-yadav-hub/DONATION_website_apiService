import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateNgoFormDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country_code: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_template: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  template_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  form_data: string;
}
