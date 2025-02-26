import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveVolunteerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  request_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  user_id: string;
}
