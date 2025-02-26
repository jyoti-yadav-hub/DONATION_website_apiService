import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';
import { User, UserSchema } from '../users/entities/user.entity';
import { CurrencyModel, CurrencySchema } from './entities/currency.entity';
import {
  ExchangeRates,
  ExchangeRatesSchema,
} from '../fund/entities/exchange-rates.entity';
@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
        { name: ExchangeRates.name, schema: ExchangeRatesSchema },
      ],
      'main_db',
    ),
  ],
  controllers: [CurrencyController],
  providers: [CurrencyService],
})
export class CurrencyModule {}
