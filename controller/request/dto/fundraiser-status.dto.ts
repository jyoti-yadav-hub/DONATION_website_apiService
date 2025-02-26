import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FundraiserStatus {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  request_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fundraiser_status: string;
}
