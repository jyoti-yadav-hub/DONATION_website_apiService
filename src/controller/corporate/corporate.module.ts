import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { MongooseModule } from '@nestjs/mongoose';
import { CorporateService } from './corporate.service';
import { CorporateController } from './corporate.controller';
import { User, UserSchema } from '../users/entities/user.entity';
import { Corporate, CorporateSchema } from './entities/corporate.entity';
import {
  CorporateUsers,
  CorporateUsersSchema,
} from './entities/corporate-users.entity';
import {
  CorporateInvite,
  CorporateInviteSchema,
} from './entities/corporate-invite.entity';
import {
  CorporateRoles,
  CorporateRolesSchema,
} from './entities/corporate-roles.entity';
import { OtpVerify, OtpVerifySchema } from './entities/otp-verify';
import { Ngo, NgoSchema } from '../ngo/entities/ngo.entity';
import {
  CsvUploadModel,
  CsvUploadSchema,
} from '../csv-upload/entities/csv-upload.entity';
import {
  CorporateNotification,
  CorporateNotificationSchema,
} from '../notification/entities/corporate-notification.entity';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../request/entities/cause-request.entity';
import {
  FundraiserVerify,
  FundraiserVerifySchema,
} from '../request/entities/fundraiser-request-verify.entity';
import {
  TransactionModel,
  TransactionSchema,
} from '../donation/entities/transaction.entity';
import {
  CorporateActivityLog,
  CorporateActivityLogSchema,
} from './entities/corporate-activity-log.entity';
import {
  NgoUpdated,
  NgoUpdatedSchema,
} from '../ngo/entities/ngo_updated_data.entity';
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Ngo.name, schema: NgoSchema },
        { name: NgoUpdated.name, schema: NgoUpdatedSchema },
        { name: CsvUploadModel.name, schema: CsvUploadSchema },
        { name: Corporate.name, schema: CorporateSchema },
        { name: CorporateUsers.name, schema: CorporateUsersSchema },
        { name: CorporateInvite.name, schema: CorporateInviteSchema },
        { name: OtpVerify.name, schema: OtpVerifySchema },
        { name: CorporateRoles.name, schema: CorporateRolesSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
        {
          name: CorporateNotification.name,
          schema: CorporateNotificationSchema,
        },
        {
          name: FundraiserVerify.name,
          schema: FundraiserVerifySchema,
        },
        {
          name: TransactionModel.name,
          schema: TransactionSchema,
        },
        { name: CorporateActivityLog.name, schema: CorporateActivityLogSchema },
      ],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [CorporateController],
  providers: [CorporateService],
})
export class CorporateModule {}
