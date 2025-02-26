import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BlockUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  corporate_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  user_id: string;
}
