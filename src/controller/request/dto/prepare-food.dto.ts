import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class PrepareFood {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  prepare_time: number;
}
