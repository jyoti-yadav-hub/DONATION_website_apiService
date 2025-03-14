import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateAdminDto } from './create-admin.dto';

export class UpdateAdminDto extends PartialType(
  OmitType(CreateAdminDto, ['password'] as const),
) {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  removeFile: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  image: string;
}
