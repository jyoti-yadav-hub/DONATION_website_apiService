import { Module } from '@nestjs/common';
import { ReligionService } from './religion.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ReligionController } from './religion.controller';
import { Religion, ReligionSchema } from './entities/religion.entity';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    AdminModule,
    MongooseModule.forFeature(
      [{ name: Religion.name, schema: ReligionSchema }],
      'main_db',
    ),
  ],
  controllers: [ReligionController],
  providers: [ReligionService],
})
export class ReligionModule {}
