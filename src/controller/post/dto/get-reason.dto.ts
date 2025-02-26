import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class GetReasonDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  post_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;
}
