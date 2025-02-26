import { OmitType, PartialType } from '@nestjs/mapped-types';

import { CreateFundDto } from './create-fund.dto';

// export class UpdateFundDto extends CreateFundDto {}
export class UpdateFundDto extends PartialType(
  OmitType(CreateFundDto, ['draft_id'] as const),
) {}