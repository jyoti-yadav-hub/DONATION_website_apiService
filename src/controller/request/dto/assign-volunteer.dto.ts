import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class AssignVolunteer {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  deliver_by_self: boolean;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  lat: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  lng: number;
}
