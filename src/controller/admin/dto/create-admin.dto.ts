import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CreateAdminDto {
  @ApiProperty()
  image: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  createdBy: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  updatedBy: string;

  @ApiProperty()
  @IsNotEmpty()
  role: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
