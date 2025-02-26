import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  corporate_id: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  permissions: [];
}
