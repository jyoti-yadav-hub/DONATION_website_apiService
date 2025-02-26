import { Module } from '@nestjs/common';
import {
  TransactionModel,
  TransactionSchema,
} from '../donation/entities/transaction.entity';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../request/entities/cause-request.entity';
import { Category, CategorySchema } from '../category/entities/category.entity';
import { Ngo, NgoSchema } from '../ngo/entities/ngo.entity';
import { Fund, FundSchema } from '../fund/entities/fund.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { ManualTransferService } from './manual-transfer.service';
import { ManualTransferController } from './manual-transfer.controller';
import { User, UserSchema } from '../users/entities/user.entity';
import {
  ManualTransfer,
  ManualTransferSchema,
} from './entities/manual-transfer.entity';

@Module({
  imports: [
    AdminModule,
    UsersModule,
    MongooseModule.forFeature(
      [
        { name: ManualTransfer.name, schema: ManualTransferSchema },
        { name: Ngo.name, schema: NgoSchema },
        { name: User.name, schema: UserSchema },
        { name: Fund.name, schema: FundSchema },
        { name: Category.name, schema: CategorySchema },
        { name: TransactionModel.name, schema: TransactionSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
      ],
      'main_db',
    ),
  ],
  controllers: [ManualTransferController],
  providers: [ManualTransferService],
})
export class ManualTransferModule {}
