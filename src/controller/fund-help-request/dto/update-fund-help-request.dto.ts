import { PartialType } from '@nestjs/swagger';
import { CreateFundHelpRequestDto } from './create-fund-help-request.dto';

export class UpdateFundHelpRequestDto extends PartialType(
  CreateFundHelpRequestDto,
) {}
