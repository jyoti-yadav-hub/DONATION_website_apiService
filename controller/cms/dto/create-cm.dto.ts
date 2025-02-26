import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export enum Status {
  Active = 'Active',
  Deactive = 'Deactive',
}
export class CreateCmDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Status)
  status: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  screen_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  usage: string;
}
