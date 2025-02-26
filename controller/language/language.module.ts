import { Module } from '@nestjs/common';
import { LanguageService } from './language.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LanguageController } from './language.controller';
import { Language, LanguageSchema } from './entities/language.entity';
import {
  CurrencyModel,
  CurrencySchema,
} from '../currency/entities/currency.entity';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    AdminModule,
    MongooseModule.forFeature(
      [
        { name: Language.name, schema: LanguageSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
      ],
      'main_db',
    ),
  ],
  controllers: [LanguageController],
  providers: [LanguageService],
})
export class LanguageModule {}
