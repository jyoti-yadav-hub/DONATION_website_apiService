import { PartialType } from '@nestjs/mapped-types';
import { CreateNgoDonationDto } from './create-ngo-donation.dto';

export class UpdateNgoDonationDto extends PartialType(CreateNgoDonationDto) {}
