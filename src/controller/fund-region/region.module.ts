import { Module } from '@nestjs/common';
import { RegionService } from './region.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RegionController } from './region.controller';
import { Region, RegionSchema } from './entities/region.entity';
import {
  CurrencyModel,
  CurrencySchema,
} from './../currency/entities/currency.entity';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    AdminModule,
    MongooseModule.forFeature(
      [
        { name: Region.name, schema: RegionSchema },
        { name: CurrencyModel.name, schema: CurrencySchema },
      ],
      'main_db',
    ),
  ],
  controllers: [RegionController],
  providers: [RegionService],
})
export class RegionModule {}
