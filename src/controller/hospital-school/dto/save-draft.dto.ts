import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';
export enum Type {
  Hospital = 'Hospital',
  School = 'School',
  education = 'education',
  health = 'health',
  
}
export class SaveDraftDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(Type)
  type: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  courses_or_diseases: [];

  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  state: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  longitude: number;

  @ApiProperty()
  location: object;

  @ApiProperty()
  @IsString()
  @IsOptional()
  finance_contact_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  finance_contact_number: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  finance_contact_country_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  finance_contact_email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  escalation_contact_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  escalation_contact_number: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  escalation_contact_country_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  escalation_contact_email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  admission_contact_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  admission_contact_number: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  admission_contact_country_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  admission_contact_email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  website: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value))
  establishment_year: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  hospital_area: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  types_of_hospital: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  departments: [];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  areas_served: [];

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value))
  no_of_beds: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  emergency_department: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  management: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  academic: [];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  instruction_medium: [];

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value))
  no_of_teachers: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value))
  no_of_students: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  board: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  school_college_type: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  draft_id: string;

  @ApiProperty()
  is_draft: boolean;
}
