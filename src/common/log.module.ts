import { forwardRef, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../controller/users/users.module';
import { LogService } from './log.service';
import {
  CorporateActivityLog,
  CorporateActivityLogSchema,
} from 'src/controller/corporate/entities/corporate-activity-log.entity';
import {
  AdminLog,
  AdminLogSchema,
} from 'src/controller/admin/entities/admin-log.entity';
import { Ngo, NgoSchema } from '../controller/ngo/entities/ngo.entity';
import { User, UserSchema } from '../controller/users/entities/user.entity';
import { Admin, AdminSchema } from '../controller/admin/entities/admin.entity';
import {
  FundraiserActivityLog,
  FundraiserActivityLogSchema,
} from '../controller/request/entities/fundraiser-activity-log.entity';
import { ApiLog, ApiLogSchema } from './entities/api-log.entity';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Ngo.name, schema: NgoSchema },
        { name: User.name, schema: UserSchema },
        { name: Admin.name, schema: AdminSchema },
        { name: CorporateActivityLog.name, schema: CorporateActivityLogSchema },
        {
          name: FundraiserActivityLog.name,
          schema: FundraiserActivityLogSchema,
        },
      ],
      'main_db',
    ),
    MongooseModule.forFeature(
      [
        { name: AdminLog.name, schema: AdminLogSchema },
        { name: ApiLog.name, schema: ApiLogSchema },
      ],
      'log_db',
    ),
    forwardRef(() => UsersModule),
  ],
  exports: [LogService],
  providers: [LogService],
})
export class LogModule {}
