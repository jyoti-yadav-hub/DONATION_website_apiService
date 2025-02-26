import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  corporate_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role_id: string;
}
