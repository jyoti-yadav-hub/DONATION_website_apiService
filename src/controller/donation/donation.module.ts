import { Module } from '@nestjs/common';
import {
  TransactionModel,
  TransactionSchema,
} from './entities/transaction.entity';
import {
  PaymentProcessModel,
  PaymentProcessSchema,
} from './entities/payment-process.entity';
import {
  AdminTransactionModel,
  AdminTransactionSchema,
} from './entities/admin-transaction.entity';
import {
  Notification,
  NotificationSchema,
} from '../notification/entities/notification.entity';
import {
  AdminNotification,
  AdminNotificationSchema,
} from '../notification/entities/admin-notification.entity';
import {
  FeatureTransactionModel,
  FeatureTransactionSchema,
} from './entities/feature-transaction.entity';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../request/entities/cause-request.entity';
import {
  CommonSetting,
  CommonSettingSchema,
} from '../setting/entities/common-setting.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { DonationService } from './donation.service';
import { DonationController } from './donation.controller';
import { Ngo, NgoSchema } from '../ngo/entities/ngo.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { PlanModel, PlanSchema } from '../plan/entities/plan.entity';
import { Category, CategorySchema } from '../category/entities/category.entity';
import { Bank, BankSchema } from '../bank/entities/bank.entity';
import {
  LastDonorNotificationModel,
  LastDonorNotificationSchema,
} from './entities/notify-last-donor.entity';
import { Fund, FundSchema } from '../fund/entities/fund.entity';
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Ngo.name, schema: NgoSchema },
        { name: Fund.name, schema: FundSchema },
        { name: Bank.name, schema: BankSchema },
        { name: User.name, schema: UserSchema },
        { name: PlanModel.name, schema: PlanSchema },
        { name: Category.name, schema: CategorySchema },
        { name: Notification.name, schema: NotificationSchema },
        { name: CommonSetting.name, schema: CommonSettingSchema },
        { name: TransactionModel.name, schema: TransactionSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
        { name: PaymentProcessModel.name, schema: PaymentProcessSchema },
        { name: AdminNotification.name, schema: AdminNotificationSchema },
        { name: AdminTransactionModel.name, schema: AdminTransactionSchema },
        {
          name: FeatureTransactionModel.name,
          schema: FeatureTransactionSchema,
        },
        {
          name: LastDonorNotificationModel.name,
          schema: LastDonorNotificationSchema,
        },
      ],
      'main_db',
    ),
    UsersModule,
    AdminModule,
  ],
  providers: [DonationService],
  controllers: [DonationController],
})
export class DonationModule {}
