import { PartialType } from '@nestjs/mapped-types';
import { RequestManualTransferDto } from './request-manual-transfer.dto';

export class UpdateRequestManualTransferDto extends PartialType(
  RequestManualTransferDto,
) {}
