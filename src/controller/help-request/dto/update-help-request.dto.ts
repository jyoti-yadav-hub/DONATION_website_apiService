import { PartialType } from '@nestjs/mapped-types';
import { CreateHelpRequestDto } from './create-help-request.dto';

export class UpdateHelpRequestDto extends PartialType(CreateHelpRequestDto) {}
