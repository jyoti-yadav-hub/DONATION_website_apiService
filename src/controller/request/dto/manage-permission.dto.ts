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
  allow_to_update_status: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  allow_to_edit_details: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  allow_to_change_bank_details: boolean;
}
