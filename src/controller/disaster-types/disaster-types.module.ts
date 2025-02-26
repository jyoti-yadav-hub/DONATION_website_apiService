import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DisasterTypesService } from './disaster-types.service';
import { DisasterTypesController } from './disaster-types.controller';
import {
  DisasterType,
  DisasterTypeSchema,
} from './entities/disaster-type.entity';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [{ name: DisasterType.name, schema: DisasterTypeSchema }],
      'main_db',
    ),
  ],
  controllers: [DisasterTypesController],
  providers: [DisasterTypesService],
})
export class DisasterTypesModule {}
