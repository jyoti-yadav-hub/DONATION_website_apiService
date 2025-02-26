import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateFooterStripDto } from './create-footer-strip.dto';

export class UpdateFooterStripDto extends PartialType(
  OmitType(CreateFooterStripDto, ['slug'] as const),
) {}
