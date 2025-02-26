import { Module } from '@nestjs/common';
import { RaceService } from './race.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RaceController } from './race.controller';
import { Race, RaceSchema } from './entities/race.entity';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    AdminModule,
    MongooseModule.forFeature(
      [{ name: Race.name, schema: RaceSchema }],
      'main_db',
    ),
  ],
  controllers: [RaceController],
  providers: [RaceService],
})
export class RaceModule {}
