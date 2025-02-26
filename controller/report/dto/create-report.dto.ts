/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum Type {
  request = 'request',
  ngo = 'ngo',
  fund = 'fund',
  drive = 'drive',
  help_request = 'help_request',
  request_accept = 'request_accept',
  request_reject = 'request_reject',
  corporate_request_accept = 'corporate_request_accept',
  corporate_request_reject = 'corporate_request_reject',
}
export class CreateReportDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  form_data: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Type)
  type: string;
}
