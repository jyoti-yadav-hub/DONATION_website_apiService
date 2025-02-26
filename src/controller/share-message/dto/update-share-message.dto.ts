import { PartialType } from '@nestjs/mapped-types';
import { CreateShareMessageDto } from './create-share-message.dto';

export class UpdateShareMessageDto extends PartialType(CreateShareMessageDto) {}
