import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class ChangeFCMDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;
}
