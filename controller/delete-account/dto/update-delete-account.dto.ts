/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { CreateDeleteAccountDto } from './create-delete-account.dto';

export class UpdateDeleteAccountDto extends PartialType(CreateDeleteAccountDto) {}
