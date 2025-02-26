/* eslint-disable prettier/prettier */
import { MongooseModule } from '@nestjs/mongoose';
import { authConfig } from '../config/auth.config';
import { Admin, AdminSchema } from '../controller/admin/entities/admin.entity';
import {
  Setting,
  SettingSchema,
} from '../controller/setting/entities/setting.entity';
import { QueueService } from './queue.service';
import {
  SocialData,
  SocialDataSchema,
} from '../controller/users/entities/socialData.entity';
import { CommonService } from '../common/common.service';
import {
  TransactionModel,
  TransactionSchema,
} from '../controller/donation/entities/transaction.entity';
import { forwardRef, Global, Module } from '@nestjs/common';
import { UsersModule } from '../controller/users/users.module';
import {
  Notification,
  NotificationSchema,
} from '../controller/notification/entities/notification.entity';
import {
  AdminNotification,
  AdminNotificationSchema,
} from '../controller/notification/entities/admin-notification.entity';
import { Ngo, NgoSchema } from '../controller/ngo/entities/ngo.entity';
import { Bank, BankSchema } from '../controller/bank/entities/bank.entity';
import { User, UserSchema } from '../controller/users/entities/user.entity';
import {
  Queue,
  QueueSchema,
} from '../controller/request/entities/queue-data.entity';
import {
  Category,
  CategorySchema,
} from '../controller/category/entities/category.entity';
import {
  RequestModel,
  RequestSchema,
} from '../controller/request/entities/request.entity';
import {
  adminToken,
  adminTokenSchema,
} from '../controller/admin/entities/adminToken.entity';
import {
  CurrencyModel,
  CurrencySchema,
} from '../controller/currency/entities/currency.entity';
import {
  NgoUpdated,
  NgoUpdatedSchema,
} from '../controller/ngo/entities/ngo_updated_data.entity';
import {
  FoodRequestModel,
  FoodRequestSchema,
} from '../controller/request/entities/food-request.entity';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../controller/request/entities/cause-request.entity';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from '../controller/email-template/entities/email-template.entity';
import {
  CommonSetting,
  CommonSettingSchema,
} from 'src/controller/setting/entities/common-setting.entity';
import {
  LastDonorNotificationModel,
  LastDonorNotificationSchema,
} from 'src/controller/donation/entities/notify-last-donor.entity';
import {
  CsvUploadModel,
  CsvUploadSchema,
} from '../controller/csv-upload/entities/csv-upload.entity';
import {
  HospitalImport,
  HospitalImportSchema,
} from '../controller/hospital-school/entities/hospital-import.entity';
import {
  SchoolImport,
  SchoolImportSchema,
} from '../controller/hospital-school/entities/school-import.entity';
import { Fund, FundSchema } from '../controller/fund/entities/fund.entity';
import {
  ExchangeRates,
  ExchangeRatesSchema,
} from '../controller/fund/entities/exchange-rates.entity';
import {
  CurrencyRates,
  CurrencyRatesSchema,
} from '../controller/fund/entities/currency_rates.entity';
import {
  AdminTransactionModel,
  AdminTransactionSchema,
} from '../controller/donation/entities/admin-transaction.entity';
import {
  Comment,
  CommentSchema,
} from '../controller/request/entities/comments.entity';
import {
  PaymentProcessModel,
  PaymentProcessSchema,
} from '../controller/donation/entities/payment-process.entity';
import {
  Reels,
  ReelsSchema,
} from '../controller/request/entities/reels.entity';
import {
  RequestReels,
  RequestReelsSchema,
} from '../controller/request/entities/request-reels.entity';
import {
  UserToken,
  UserTokenSchema,
} from 'src/controller/users/entities/user-token.entity';
import {
  HelpRequest,
  HelpRequestSchema,
} from 'src/controller/help-request/entities/help-request.entity';
import {
  RequestLog,
  RequestLogSchema,
} from 'src/controller/request/entities/request-log.entity';
import {
  Corporate,
  CorporateSchema,
} from 'src/controller/corporate/entities/corporate.entity';
import {
  CorporateNotification,
  CorporateNotificationSchema,
} from '../controller/notification/entities/corporate-notification.entity';
import { Drive, DriveSchema } from 'src/controller/drive/entities/drive.entity';
import {
  CorporateInvite,
  CorporateInviteSchema,
} from 'src/controller/corporate/entities/corporate-invite.entity';
import {
  OtpVerifyModel,
  OtpVerifySchema,
} from 'src/controller/users/entities/otp-verify';
import { OtpLog, OtpLogSchema } from './entities/otp-log.entity';
import { SmtpLog, SmtpLogSchema } from './entities/smtp-log.entity';
import { Log, LogSchema } from '../controller/error-log/entities/log.entity';
import {
  NotificationLog,
  NotificationLogSchema,
} from './entities/notification-log.entity';
import {
  ErrorLog,
  ErrorLogSchema,
} from 'src/controller/error-log/entities/error-log.entity';
import { ApiLog, ApiLogSchema } from './entities/api-log.entity';
@Global()
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Ngo.name, schema: NgoSchema },
        { name: User.name, schema: UserSchema },
        { name: Bank.name, schema: BankSchema },
        { name: Fund.name, schema: FundSchema },
        { name: Reels.name, schema: ReelsSchema },
        { name: Admin.name, schema: AdminSchema },
        { name: Queue.name, schema: QueueSchema },
        { name: Drive.name, schema: DriveSchema },
        { name: Comment.name, schema: CommentSchema },
        { name: Setting.name, schema: SettingSchema },
        { name: Category.name, schema: CategorySchema },
        { name: Corporate.name, schema: CorporateSchema },
        { name: UserToken.name, schema: UserTokenSchema },
        { name: RequestModel.name, schema: RequestSchema },
        { name: RequestLog.name, schema: RequestLogSchema },
        { name: adminToken.name, schema: adminTokenSchema },
        { name: NgoUpdated.name, schema: NgoUpdatedSchema },
        { name: SocialData.name, schema: SocialDataSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
        { name: HelpRequest.name, schema: HelpRequestSchema },
        { name: CsvUploadModel.name, schema: CsvUploadSchema },
        { name: RequestReels.name, schema: RequestReelsSchema },
        { name: SchoolImport.name, schema: SchoolImportSchema },
        { name: Notification.name, schema: NotificationSchema },
        { name: ExchangeRates.name, schema: ExchangeRatesSchema },
        { name: CurrencyRates.name, schema: CurrencyRatesSchema },
        { name: EmailTemplate.name, schema: EmailTemplateSchema },
        { name: CommonSetting.name, schema: CommonSettingSchema },
        { name: FoodRequestModel.name, schema: FoodRequestSchema },
        { name: TransactionModel.name, schema: TransactionSchema },
        { name: HospitalImport.name, schema: HospitalImportSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
        { name: CorporateInvite.name, schema: CorporateInviteSchema },
        { name: PaymentProcessModel.name, schema: PaymentProcessSchema },
        { name: AdminNotification.name, schema: AdminNotificationSchema },
        { name: AdminTransactionModel.name, schema: AdminTransactionSchema },
        { name: OtpVerifyModel.name, schema: OtpVerifySchema },
        {
          name: CorporateNotification.name,
          schema: CorporateNotificationSchema,
        },
        {
          name: LastDonorNotificationModel.name,
          schema: LastDonorNotificationSchema,
        },
      ],
      'main_db',
    ),
    MongooseModule.forFeature(
      [
        { name: Log.name, schema: LogSchema },
        { name: ApiLog.name, schema: ApiLogSchema },
        { name: OtpLog.name, schema: OtpLogSchema },
        { name: SmtpLog.name, schema: SmtpLogSchema },
        { name: NotificationLog.name, schema: NotificationLogSchema },
        { name: ErrorLog.name, schema: ErrorLogSchema },
      ],
      'log_db',
    ),
    forwardRef(() => UsersModule),
    authConfig,
  ],
  exports: [CommonService, QueueService],
  providers: [CommonService, QueueService],
})
export class CommonModule {}
