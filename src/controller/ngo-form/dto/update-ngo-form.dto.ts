import { PartialType } from '@nestjs/mapped-types';
import { CreateNgoFormDto } from './create-ngo-form.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNotEmpty, IsString } from 'class-validator';

export class UpdateNgoFormDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  form_data: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  store_form: boolean;
}
