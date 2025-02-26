import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { WebSignupDto } from './web-signup.dto';

export class UpdateUserDto extends PartialType(
  OmitType(WebSignupDto, ['uuid', 'platform', 'otp_platform', 'otp'] as const),
) {
  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isNew: boolean;

  @ApiProperty()
  @IsOptional()
  is_restaurant: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  restaurant_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  restaurant_latitude: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  restaurant_longitude: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  restaurant_address: string;

  @ApiProperty()
  @IsOptional()
  is_veg: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  removeFile: boolean;

  @ApiProperty()
  country_data: object;

  @ApiProperty()
  time_zone: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  location: object;

  @ApiProperty()
  restaurant_location: object;
}
