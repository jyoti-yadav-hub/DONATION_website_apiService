import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CheckEmailDto {
  @ApiProperty()
  @IsOptional()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}