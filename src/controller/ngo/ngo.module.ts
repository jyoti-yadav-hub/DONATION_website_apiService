/* eslint-disable prettier/prettier */
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  FavouriteNgo,
  FavouriteNgoSchema,
} from './entities/favourite_ngo.entity';
import {
  NgoCertificate,
  NgoCertificateSchema,
} from './entities/ngo_certificates.entity';
import { HttpModule } from '@nestjs/axios';
import { NGOService } from './ngo.service';
import {
  NgoUpdated,
  NgoUpdatedSchema,
} from './entities/ngo_updated_data.entity';
import {
  SocialData,
  SocialDataSchema,
} from '../users/entities/socialData.entity';
import {
  CurrencyModel,
  CurrencySchema,
} from '../currency/entities/currency.entity';
import { Fund, FundSchema } from '../fund/entities/fund.entity';
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
import { NGOController } from './ngo.controller';
import {
  RequestModel,
  RequestSchema,
} from '../request/entities/request.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import {
  Notification,
  NotificationSchema,
} from '../notification/entities/notification.entity';
import { authConfig } from '../../config/auth.config';
import { Ngo, NgoSchema } from './entities/ngo.entity';
import { Bank, BankSchema } from '../bank/entities/bank.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';
import { NotificationModule } from '../notification/notification.module';
import {
  NgoTeamMember,
  NgoTeamMemberSchema,
} from './entities/ngo_team_member.entity';
import { NgoPost, NgoPostSchema } from './entities/ngo_post.entity';
import {
  TransactionModel,
  TransactionSchema,
} from '../donation/entities/transaction.entity';
import { Comment, CommentSchema } from '../request/entities/comments.entity';
import { NgoModel, NgoModelSchema } from './entities/ngo_model.entity';
import { NgoForm, NgoFormSchema } from '../ngo-form/entities/ngo-form.entity';

const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Ngo.name, schema: NgoSchema },
        { name: NgoForm.name, schema: NgoFormSchema },
        { name: NgoModel.name, schema: NgoModelSchema },
        { name: Fund.name, schema: FundSchema },
        { name: Bank.name, schema: BankSchema },
        { name: User.name, schema: UserSchema },
        { name: Admin.name, schema: AdminSchema },
        { name: Comment.name, schema: CommentSchema },
        { name: NgoPost.name, schema: NgoPostSchema },
        { name: SocialData.name, schema: SocialDataSchema },
        { name: NgoUpdated.name, schema: NgoUpdatedSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
        { name: Notification.name, schema: NotificationSchema },
        { name: FavouriteNgo.name, schema: FavouriteNgoSchema },
        { name: NgoTeamMember.name, schema: NgoTeamMemberSchema },
        { name: TransactionModel.name, schema: TransactionSchema },
        { name: RequestModel.name, schema: RequestSchema },
        { name: PaymentProcessModel.name, schema: PaymentProcessSchema },
        { name: AdminNotification.name, schema: AdminNotificationSchema },
        { name: AdminTransactionModel.name, schema: AdminTransactionSchema },
        { name: NgoCertificate.name, schema: NgoCertificateSchema },
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
  ],
  exports: [NGOService],
  providers: [NGOService],
  controllers: [NGOController],
})
export class NGOModule {}
