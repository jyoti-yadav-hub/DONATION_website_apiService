import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  Max,
  Length,
} from 'class-validator';

export enum Status {
  Active = 'Active',
  Deactive = 'Deactive',
}
export enum Type {
  text = 'text',
  image = 'image',
}
export class CreateEmotionalMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  category_slug: string;

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
  @Length(20)
  message: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum(Status)
  status: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;
}
