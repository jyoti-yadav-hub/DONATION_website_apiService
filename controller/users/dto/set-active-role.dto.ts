import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean, IsString } from 'class-validator';

export class SetActiveRoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  active_role: string;
}
