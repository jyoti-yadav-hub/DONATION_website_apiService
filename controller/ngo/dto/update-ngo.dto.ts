import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CreateNgoDto } from './create-ngo.dto';

export class UpdateNgoDto extends PartialType(
  OmitType(CreateNgoDto, ['uuid', 'platform'] as const),
) {
  @ApiProperty()
  @IsOptional()
  removeFile: boolean;

  @ApiProperty()
  time_zone: string;
}
