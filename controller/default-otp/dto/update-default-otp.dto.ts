import { PartialType } from '@nestjs/mapped-types';
import { CreateDefaultOtpDto } from './create-default-otp.dto';

export class UpdateDefaultOtpDto extends PartialType(CreateDefaultOtpDto) {}
