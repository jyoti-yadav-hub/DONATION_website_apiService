import { PartialType } from '@nestjs/swagger';
import { CreateDriveTypeDto } from './create-drive-type.dto';

export class UpdateDriveTypeDto extends PartialType(CreateDriveTypeDto) {}
