import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateHomeCmDto } from './create-home-cm.dto';

export class UpdateHomeCmDto extends PartialType(CreateHomeCmDto) {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  removeFile: boolean;
}
