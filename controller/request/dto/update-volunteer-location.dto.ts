import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';

export class UpdateVolunteerLocation {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  lng: number;
}
