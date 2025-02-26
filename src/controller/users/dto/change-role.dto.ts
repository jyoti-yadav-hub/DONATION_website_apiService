import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean } from 'class-validator';

export class ChangeUserRoleDto {
  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  is_user: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  is_donor: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  is_volunteer: boolean;
}
