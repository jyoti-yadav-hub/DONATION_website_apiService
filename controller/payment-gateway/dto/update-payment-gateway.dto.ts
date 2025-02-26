import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePaymentGatewayDto {
  @ApiProperty()
  @IsString() 
  @IsNotEmpty()
  form_data: string;
}
