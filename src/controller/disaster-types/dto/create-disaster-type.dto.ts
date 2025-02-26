import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum Status {
  Active = 'Active',
  Deactive = 'Deactive',
}

export class CreateDisasterTypeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  disaster_type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Status)
  status: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;
}
