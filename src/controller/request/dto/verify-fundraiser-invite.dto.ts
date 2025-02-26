import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum Status {
  approve = 'approve',
  reject = 'reject',
}
export class VerifyFundraiserInvite {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  noti_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  request_id: string;

  @ApiProperty()
  @IsString()
  @IsEnum(Status)
  @IsNotEmpty()
  status: string;
}
