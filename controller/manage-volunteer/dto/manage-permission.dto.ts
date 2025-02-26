/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';

export class ManagePermissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  request_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  invite_volunteer: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  manage_volunteer: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  edit_fundraiser: boolean;
}
