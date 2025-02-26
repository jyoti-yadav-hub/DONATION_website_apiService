import { IsNotEmpty, IsOptional, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDetail {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  reference_id: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  redirectResult: string;

  @IsObject()
  @IsOptional()
  @ApiProperty()
  payload: object;

  @IsObject()
  @IsNotEmpty()
  @ApiProperty()
  response: object;
}
