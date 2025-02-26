/* eslint-disable prettier/prettier */
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import {
  RequestModel,
  RequestSchema,
} from '../request/entities/request.entity';
import {
  CurrencyModel,
  CurrencySchema,
} from '../currency/entities/currency.entity';
import {
  FavouriteNgo,
  FavouriteNgoSchema,
} from '../ngo/entities/favourite_ngo.entity';
import { UsersService } from './users.service';
import {
  TransactionModel,
  TransactionSchema,
} from '../donation/entities/transaction.entity';
import {
  NgoUpdated,
  NgoUpdatedSchema,
} from '../ngo/entities/ngo_updated_data.entity';
import { BankModule } from '../bank/bank.module';
import { MongooseModule } from '@nestjs/mongoose';
import { forwardRef, Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { UsersController } from './users.controller';
import {
  PaymentProcessModel,
  PaymentProcessSchema,
} from '../donation/entities/payment-process.entity';
import { authConfig } from '../../config/auth.config';
import {
  Notification,
  NotificationSchema,
} from '../notification/entities/notification.entity';
import { SocketModule } from '../socket/socket.module';
import {
  FeatureTransactionModel,
  FeatureTransactionSchema,
} from '../donation/entities/feature-transaction.entity';
import { User, UserSchema } from './entities/user.entity';
import { UserToken, UserTokenSchema } from './entities/user-token.entity';
import {
  AdminNotification,
  AdminNotificationSchema,
} from '../notification/entities/admin-notification.entity';
import { Ngo, NgoSchema } from '../ngo/entities/ngo.entity';
import { Bank, BankSchema } from '../bank/entities/bank.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { SocialData, SocialDataSchema } from './entities/socialData.entity';
import { Category, CategorySchema } from '../category/entities/category.entity';
import { Comment, CommentSchema } from '../request/entities/comments.entity';
import { OtpVerifyModel, OtpVerifySchema } from './entities/otp-verify';
import {
  Corporate,
  CorporateSchema,
} from '../corporate/entities/corporate.entity';
const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Ngo.name, schema: NgoSchema },
        { name: Bank.name, schema: BankSchema },
        { name: User.name, schema: UserSchema },
        { name: OtpVerifyModel.name, schema: OtpVerifySchema },
        { name: UserToken.name, schema: UserTokenSchema },
        { name: Admin.name, schema: AdminSchema },
        { name: Comment.name, schema: CommentSchema },
        { name: Category.name, schema: CategorySchema },
        { name: RequestModel.name, schema: RequestSchema },
        { name: SocialData.name, schema: SocialDataSchema },
        { name: NgoUpdated.name, schema: NgoUpdatedSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
        { name: FavouriteNgo.name, schema: FavouriteNgoSchema },
        { name: Notification.name, schema: NotificationSchema },
        { name: TransactionModel.name, schema: TransactionSchema },
        { name: PaymentProcessModel.name, schema: PaymentProcessSchema },
        { name: AdminNotification.name, schema: AdminNotificationSchema },
        { name: Corporate.name, schema: CorporateSchema },
        {
          name: FeatureTransactionModel.name,
          schema: FeatureTransactionSchema,
        },
      ],
      'main_db',
    ),
    JwtModule.register({
      secret: process.env.secret,
      signOptions: { expiresIn: '86400' },
    }),
    authConfig,
    HttpModule,
    AdminModule,
    forwardRef(() => BankModule),
    forwardRef(() => SocketModule),
  ],
  exports: [UsersService],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
