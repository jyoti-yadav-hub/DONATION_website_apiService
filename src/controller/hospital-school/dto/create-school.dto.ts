import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
} from 'class-validator';
export enum Type {
  Hospital = 'Hospital',
  School = 'School',
}
export class CreateSchoolDto {
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

  @ApiProperty()
  @IsString()
  @IsOptional()
  unverified_id: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  longitude: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  admission_contact_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  admission_contact_number: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  admission_contact_country_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  admission_contact_email: string;

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
  location: object;

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
  management: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  academic: [];

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  instruction_medium: [];

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number.parseInt(value))
  no_of_teachers: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number.parseInt(value))
  no_of_students: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  board: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  school_college_type: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  draft_id: string;
}
