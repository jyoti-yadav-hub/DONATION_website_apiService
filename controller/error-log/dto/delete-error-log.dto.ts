import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class DeleteErrorLogDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly id: [];
}
