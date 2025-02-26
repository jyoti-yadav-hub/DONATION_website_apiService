import { Module } from '@nestjs/common';
import { DriveTypeService } from './drive-type.service';
import { DriveTypeController } from './drive-type.controller';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DriveType, DriveTypeSchema } from './entities/drive-type.entity';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [{ name: DriveType.name, schema: DriveTypeSchema }],
      'main_db',
    ),
  ],
  controllers: [DriveTypeController],
  providers: [DriveTypeService],
})
export class DriveTypeModule {}
