import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum Status {
  pending = 'pending',
  cancelled = 'cancelled',
  donor_accept = 'donor_accept',
  volunteer_accept = 'volunteer_accept',
  pickup = 'pickup',
  delivered = 'delivered',
  waiting_for_volunteer = 'waiting_for_volunteer',
}

export class UpdateOrderStatus {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Status)
  status: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  active_type: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  lat: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  lng: number;
}
