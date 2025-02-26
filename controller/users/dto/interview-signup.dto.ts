import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  Matches,
  IsArray,
  Length,
} from 'class-validator';
import { Match } from 'src/auth/match.decorator';

export class InterviewSignupDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 12, {
    message: 'Password must be between 6 and 12 characters long.',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,12}$/, {
    message:
      'Password must contain at lease 1 uppercase, 1 lowercase, and 1 numeric character. Minimum 6 and Maximum 12 characters',
  })
  password: string;
}
