/* eslint-disable prettier/prettier */
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { FundService } from './fund.service';
import {
  SocialData,
  SocialDataSchema,
} from '../users/entities/socialData.entity';
import {
  CurrencyModel,
  CurrencySchema,
} from '../currency/entities/currency.entity';
import {
  AdminTransactionModel,
  AdminTransactionSchema,
} from '../donation/entities/admin-transaction.entity';
import {
  AdminNotification,
  AdminNotificationSchema,
} from '../notification/entities/admin-notification.entity';
import {
  PaymentProcessModel,
  PaymentProcessSchema,
} from '../donation/entities/payment-process.entity';
import { FundController } from './fund.controller';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../request/entities/cause-request.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import {
  Notification,
  NotificationSchema,
} from '../notification/entities/notification.entity';
import { authConfig } from '../../config/auth.config';
import { Fund, FundSchema } from './entities/fund.entity';
import { Bank, BankSchema } from '../bank/entities/bank.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { NotificationModule } from '../notification/notification.module';
import {
  CommonSetting,
  CommonSettingSchema,
} from '../setting/entities/common-setting.entity';
import {
  TransactionModel,
  TransactionSchema,
} from '../donation/entities/transaction.entity';
import { RequestModule } from '../request/request.module';
import { Ngo, NgoSchema } from '../ngo/entities/ngo.entity';
import { Category, CategorySchema } from '../category/entities/category.entity';

const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Fund.name, schema: FundSchema },
        { name: Ngo.name, schema: NgoSchema },
        { name: Bank.name, schema: BankSchema },
        { name: User.name, schema: UserSchema },
        { name: Admin.name, schema: AdminSchema },
        { name: Category.name, schema: CategorySchema },
        { name: SocialData.name, schema: SocialDataSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
        { name: Notification.name, schema: NotificationSchema },
        { name: TransactionModel.name, schema: TransactionSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
        { name: PaymentProcessModel.name, schema: PaymentProcessSchema },
        { name: AdminNotification.name, schema: AdminNotificationSchema },
        { name: AdminTransactionModel.name, schema: AdminTransactionSchema },
        { name: CommonSetting.name, schema: CommonSettingSchema },
        { name: TransactionModel.name, schema: TransactionSchema },
      ],
      'main_db',
    ),
    JwtModule.register({
      secret: process.env.secret,
      signOptions: { expiresIn: '86400' },
    }),
    authConfig,
    HttpModule,
    forwardRef(() => AdminModule),
    forwardRef(() => UsersModule),
    NotificationModule,
    RequestModule,
  ],
  exports: [FundService],
  providers: [FundService],
  controllers: [FundController],
})
export class FundModule {}
