import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SavePermissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  corporate_id: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  permissions: [];
}
