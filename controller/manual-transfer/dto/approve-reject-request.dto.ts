import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, ValidateIf } from 'class-validator';

export enum Status {
  rejected = 'rejected',
  approved = 'approved',
}

export class ApproveRejectRequest {
  @ValidateIf((object) => object.status === Status.rejected)
  @IsString()
  @ApiProperty()
  reason: string;

  @IsEnum(Status)
  status: Status;
}
