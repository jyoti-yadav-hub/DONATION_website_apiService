/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum Status {
  approve = 'approve',
  reject = 'reject',
  deactive='deactive'
}

export class VerifyTestimonialDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Status)
  status: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  allow_testimonial: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reason: string;
}
