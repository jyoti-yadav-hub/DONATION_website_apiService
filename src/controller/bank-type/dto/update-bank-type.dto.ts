import { PartialType } from '@nestjs/mapped-types';
import { CreateBankTypeDto } from './create-bank-type.dto';

export class UpdateBankTypeDto extends PartialType(CreateBankTypeDto) {}
