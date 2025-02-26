import { PartialType } from '@nestjs/mapped-types';
import { CreateManageVolunteerDto } from './create-manage-volunteer.dto';

export class UpdateManageVolunteerDto extends PartialType(CreateManageVolunteerDto) {}
