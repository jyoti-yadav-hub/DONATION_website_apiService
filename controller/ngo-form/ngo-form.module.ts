import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { NgoFormService } from './ngo-form.service';
import { NgoFormController } from './ngo-form.controller';
import { NgoForm,NgoFormSchema} from './entities/ngo-form.entity';
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
        { name: NgoForm.name, schema: NgoFormSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
      ],
      'main_db',
    ),
  ],
  controllers: [NgoFormController],
  providers: [NgoFormService],
})
export class NgoFormModule {}
