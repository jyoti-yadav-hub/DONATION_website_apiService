/* eslint-disable prettier/prettier */
import {
  FoodRequestModel,
  FoodRequestSchema,
} from './entities/food-request.entity';
import { RequestModel, RequestSchema } from './entities/request.entity';
import { PlanModel, PlanSchema } from '../plan/entities/plan.entity';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from './entities/cause-request.entity';
import { Global, Module } from '@nestjs/common';
import {
  TransactionModel,
  TransactionSchema,
} from '../donation/entities/transaction.entity';
import {
  FeatureTransactionModel,
  FeatureTransactionSchema,
} from '../donation/entities/feature-transaction.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestService } from './request.service';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { VolunteerService } from './volunteer.service';
import { RequestController } from './request.controller';
import { Ngo, NgoSchema } from '../ngo/entities/ngo.entity';
import { Reels, ReelsSchema } from './entities/reels.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import {
  UserToken,
  UserTokenSchema,
} from '../users/entities/user-token.entity';
import { Queue, QueueSchema } from './entities/queue-data.entity';
import { Comment, CommentSchema } from './entities/comments.entity';
import { Category, CategorySchema } from '../category/entities/category.entity';
import { Fund, FundSchema } from '../fund/entities/fund.entity';
import {
  CurrencyModel,
  CurrencySchema,
} from '../currency/entities/currency.entity';
import {
  Notification,
  NotificationSchema,
} from '../notification/entities/notification.entity';
import {
  HospitalSchool,
  HospitalSchoolSchema,
} from '../hospital-school/entities/hospital-school.entity';
import {
  PaymentProcessModel,
  PaymentProcessSchema,
} from '../donation/entities/payment-process.entity';
import {
  AdminNotification,
  AdminNotificationSchema,
} from '../notification/entities/admin-notification.entity';
import {
  HospitalSchoolData,
  HospitalSchoolDataSchema,
} from '../hospital-school-data/entities/hospital-school-data.entity';
import {
  RequestReels,
  RequestReelsSchema,
} from './entities/request-reels.entity';
import {
  RequestHistoryModel,
  RequestHistorySchema,
} from './entities/request-history.entity';
import {
  AdminTransactionModel,
  AdminTransactionSchema,
} from '../donation/entities/admin-transaction.entity';
import { Post, PostSchema } from '../drive/entities/drive-post.entity';
import {
  FundraiserVerify,
  FundraiserVerifySchema,
} from './entities/fundraiser-request-verify.entity';
import { Drive, DriveSchema } from '../drive/entities/drive.entity';
import {
  CorporateNotification,
  CorporateNotificationSchema,
} from '../notification/entities/corporate-notification.entity';
import { Bank, BankSchema } from '../bank/entities/bank.entity';
@Global()
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Post.name, schema: PostSchema },
        { name: Ngo.name, schema: NgoSchema },
        { name: Fund.name, schema: FundSchema },
        { name: Drive.name, schema: DriveSchema },
        { name: Queue.name, schema: QueueSchema },
        { name: Reels.name, schema: ReelsSchema },
        { name: PlanModel.name, schema: PlanSchema },
        { name: Comment.name, schema: CommentSchema },
        { name: Category.name, schema: CategorySchema },
        { name: UserToken.name, schema: UserTokenSchema },
        { name: RequestModel.name, schema: RequestSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
        { name: Notification.name, schema: NotificationSchema },
        { name: RequestReels.name, schema: RequestReelsSchema },
        { name: FoodRequestModel.name, schema: FoodRequestSchema },
        { name: HospitalSchool.name, schema: HospitalSchoolSchema },
        { name: TransactionModel.name, schema: TransactionSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
        { name: RequestHistoryModel.name, schema: RequestHistorySchema },
        { name: PaymentProcessModel.name, schema: PaymentProcessSchema },
        { name: AdminNotification.name, schema: AdminNotificationSchema },
        { name: HospitalSchoolData.name, schema: HospitalSchoolDataSchema },
        { name: AdminTransactionModel.name, schema: AdminTransactionSchema },
        { name: FundraiserVerify.name, schema: FundraiserVerifySchema },
        { name: Bank.name, schema: BankSchema },
        {
          name: CorporateNotification.name,
          schema: CorporateNotificationSchema,
        },
        {
          name: FeatureTransactionModel.name,
          schema: FeatureTransactionSchema,
        },
      ],
      'main_db',
    ),
    UsersModule,
    AdminModule,
  ],
  controllers: [RequestController],
  exports: [RequestService, VolunteerService],
  providers: [RequestService, VolunteerService],
})
export class RequestModule {}
