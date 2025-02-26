/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
export enum Type {
  send_request = 'send_request',
  cancel_request = 'cancel_request',
  approve = 'approve',
  reject = 'reject',
}
export class DeleteOngoingRequestsDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  reason: string;

  @ApiProperty()
  @IsString()
  @IsEnum(Type)
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  request_id: string;
}
