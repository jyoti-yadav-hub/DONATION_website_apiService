import { PartialType } from '@nestjs/mapped-types';
import { CreateWomenEmpowermentAreaDto } from './create-women-empowerment-area.dto';

export class UpdateWomenEmpowermentAreaDto extends PartialType(CreateWomenEmpowermentAreaDto) {}
