import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingService } from './setting.service';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { SettingController } from './setting.controller';
import { Setting, SettingSchema } from './entities/setting.entity';
import {
  CurrencyModel,
  CurrencySchema,
} from '../currency/entities/currency.entity';
import {
  CommonSetting,
  CommonSettingSchema,
} from './entities/common-setting.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Setting.name, schema: SettingSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
        { name: CommonSetting.name, schema: CommonSettingSchema },
      ],
      'main_db',
    ),
    AdminModule,
    UsersModule,
  ],
  providers: [SettingService],
  controllers: [SettingController],
})
export class SettingModule {}
