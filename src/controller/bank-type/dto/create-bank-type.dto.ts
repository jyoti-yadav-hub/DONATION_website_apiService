import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBankTypeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;
}
