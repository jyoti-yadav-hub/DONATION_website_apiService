import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { bankStatus } from 'src/controller/bank/dto/verify-bank.dto';

export enum Status {
  approve = 'approve',
  reject = 'reject',
}
export class VerifyCorporateInvite {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  noti_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  corporate_id: string;

  @ApiProperty()
  @IsString()
  @IsEnum(Status)
  @IsNotEmpty()
  status: string;
}
