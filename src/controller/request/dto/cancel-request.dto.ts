import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CancelRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  reason: string;
}
