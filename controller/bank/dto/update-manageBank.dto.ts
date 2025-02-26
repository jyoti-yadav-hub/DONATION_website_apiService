import { PartialType } from '@nestjs/mapped-types';
import { CreateManageBankDto } from './create-manageBank.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateManageBankDto extends PartialType(CreateManageBankDto) {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  store_form: boolean;
}
