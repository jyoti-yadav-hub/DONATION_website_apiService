import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
export class CreatePaymentGatewayDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  form_data: string;
}
