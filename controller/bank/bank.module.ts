import { forwardRef, Module } from '@nestjs/common';
import {
  RequestModel,
  RequestSchema,
} from '../request/entities/request.entity';
import { BankService } from './bank.service';
import {
  CurrencyModel,
  CurrencySchema,
} from '../currency/entities/currency.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { BankController } from './bank.controller';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { Bank, BankSchema } from './entities/bank.entity';
import { ManageBank, ManageBankSchema } from './entities/manage-bank.entity';
import { Ngo, NgoSchema } from '../ngo/entities/ngo.entity';
import {
  Notification,
  NotificationSchema,
} from '../notification/entities/notification.entity';
import { AppModule } from 'src/app.module';
@Module({
  imports: [
    forwardRef(() => AppModule),
    forwardRef(() => UsersModule),
    AdminModule,
    MongooseModule.forFeature(
      [
        { name: Ngo.name, schema: NgoSchema },
        { name: Bank.name, schema: BankSchema },
        { name: RequestModel.name, schema: RequestSchema },
        { name: ManageBank.name, schema: ManageBankSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
        { name: Notification.name, schema: NotificationSchema },
      ],
      'main_db',
    ),
  ],
  exports: [BankService],
  controllers: [BankController],
  providers: [BankService],
})
export class BankModule {}
