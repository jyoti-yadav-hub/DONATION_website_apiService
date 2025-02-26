import { PartialType } from '@nestjs/mapped-types';
import { RequestManualTransferDto } from './request-manual-transfer.dto';
import { UserRequestManualTransferDto } from './user-request-manual-transfer.dto';

export class UpdateUserRequestManualTransferDto extends PartialType(
  UserRequestManualTransferDto,
) {}
