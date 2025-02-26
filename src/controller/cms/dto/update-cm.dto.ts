import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCmDto } from './create-cm.dto';

export class UpdateCmDto extends PartialType(
  OmitType(CreateCmDto, ['slug'] as const),
) {}
