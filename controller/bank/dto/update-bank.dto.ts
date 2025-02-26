import { PartialType } from '@nestjs/mapped-types';
import { CreateBankDto } from './create-bank.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';

export class UpdateBankDto extends PartialType(CreateBankDto) {
  @ApiProperty()
  @IsArray()
  @IsOptional()
  removed_files: [];
}
