import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteUserDriveEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  drive_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unique_id: string;
}
