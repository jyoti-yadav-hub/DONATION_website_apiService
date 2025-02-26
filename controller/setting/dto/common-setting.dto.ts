import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
export class CommonSettingDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  currency: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  form_data: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  store_form: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  create_type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  unit: string;
}
