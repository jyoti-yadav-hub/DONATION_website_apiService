import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../auth/match.decorator';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  @IsString()
  oldPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  @IsString()
  newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(12)
  @IsString()
  @Match('newPassword')
  retypeNewPassword: string;
}
