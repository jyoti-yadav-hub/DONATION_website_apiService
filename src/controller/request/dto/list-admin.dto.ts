import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum Status {
  approve = 'approve',
  reject = 'reject',
  pending = 'pending',
  remove = 'remove',
}
export class ListAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum(Status)
  status: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name: string;
}
