import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { BankType, BankTypeSchema } from './entities/bank-type.entity';
import { BankTypeService } from './bank-type.service';
import { BankTypeController } from './bank-type.controller';
import {
  CurrencyModel,
  CurrencySchema,
} from '../currency/entities/currency.entity';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [
        { name: CurrencyModel.name, schema: CurrencySchema },
        { name: BankType.name, schema: BankTypeSchema },
      ],
      'main_db',
    ),
  ],
  controllers: [BankTypeController],
  providers: [BankTypeService],
})
export class BankTypeModule {}
