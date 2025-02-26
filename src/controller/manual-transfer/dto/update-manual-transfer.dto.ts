import { PartialType } from '@nestjs/mapped-types';
import { CreateManualTransferDto } from './create-manual-transfer.dto';

export class UpdateManualTransferDto extends PartialType(
  CreateManualTransferDto,
) {}
