import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
} from 'class-validator';
export enum Type {
  Hospital = 'Hospital',
  School = 'School',
}
export class CreateHospitalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Type)
  type: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  courses_or_diseases: [];

  @ApiProperty()
  @IsString()
  @IsOptional()
  unverified_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  longitude: number;

  @ApiProperty()
  location: object;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  finance_contact_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  finance_contact_number: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  finance_contact_country_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  finance_contact_email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  escalation_contact_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  escalation_contact_number: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  escalation_contact_country_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  escalation_contact_email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  website: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number.parseInt(value))
  establishment_year: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hospital_area: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  types_of_hospital: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  departments: [];

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  areas_served: [];

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number.parseInt(value))
  no_of_beds: number;

  @ApiProperty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsNotEmpty()
  emergency_department: boolean;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  draft_id: string;
}
