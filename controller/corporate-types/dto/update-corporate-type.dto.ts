import { PartialType } from '@nestjs/mapped-types';
import { CreateCorporateTypeDto } from './create-corporate-type.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateCorporateTypeDto extends PartialType(
  CreateCorporateTypeDto,
) {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  store_form: boolean;
}
