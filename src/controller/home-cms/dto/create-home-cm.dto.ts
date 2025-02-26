import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';

export enum Status {
  Active = 'Active',
  Deactive = 'Deactive',
}
export enum Type {
  text = 'text',
  file = 'file',
}
export class CreateHomeCmDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum(Type)
  type: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  image: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum(Status)
  status: string;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value))
  @IsOptional()
  index: number;
}
