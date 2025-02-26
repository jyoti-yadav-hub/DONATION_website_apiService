import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
export enum Type {
  Hospital = 'Hospital',
  School = 'School',
}
export class HospitalSchoolListDto {

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  courses_or_diseases: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  lat: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  long: string;
}
