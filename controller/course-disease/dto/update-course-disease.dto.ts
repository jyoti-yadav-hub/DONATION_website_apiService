import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCourseDiseaseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  type: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;
}
