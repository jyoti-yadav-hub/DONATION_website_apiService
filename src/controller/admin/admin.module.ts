import { forwardRef, Module } from '@nestjs/common';
import {
  RequestModel,
  RequestSchema,
} from '../request/entities/request.entity';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { Ngo, NgoSchema } from '../ngo/entities/ngo.entity';
import { Admin, AdminSchema } from './entities/admin.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { adminToken, adminTokenSchema } from './entities/adminToken.entity';
import { Fund, FundSchema } from '../fund/entities/fund.entity';
import { NGOModule } from '../ngo/ngo.module';
import {
  Notification,
  NotificationSchema,
} from '../notification/entities/notification.entity';
import {
  TransactionModel,
  TransactionSchema,
} from '../donation/entities/transaction.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Ngo.name, schema: NgoSchema },
        { name: Fund.name, schema: FundSchema },
        { name: User.name, schema: UserSchema },
        { name: Admin.name, schema: AdminSchema },
        { name: adminToken.name, schema: adminTokenSchema },
        { name: RequestModel.name, schema: RequestSchema },
        { name: Notification.name, schema: NotificationSchema },
        { name: TransactionModel.name, schema: TransactionSchema },
      ],
      'main_db',
    ),
    forwardRef(() => NGOModule),
  ],
  exports: [AdminService],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
