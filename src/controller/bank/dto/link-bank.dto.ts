import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LinkBankDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  request_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_id: string;
}
