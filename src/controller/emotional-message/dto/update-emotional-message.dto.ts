import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEmotionalMessageDto } from './create-emotional-message.dto';

export class UpdateEmotionalMessageDto extends PartialType(
  CreateEmotionalMessageDto,
) {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  removeFile: boolean;
}
