import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetTransactionProcessDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  reference_id: string;

  // @IsString()
  // @IsNotEmpty()
  // @ApiProperty()
  // psp_reference: string;
}
