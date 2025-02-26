import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { DefaultOtpService } from './default-otp.service';
import { DefaultOtpController } from './default-otp.controller';
import { OtpVerifyModel, OtpVerifySchema } from '../users/entities/otp-verify';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: OtpVerifyModel.name, schema: OtpVerifySchema }],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [DefaultOtpController],
  providers: [DefaultOtpService],
})
export class DefaultOtpModule {}
