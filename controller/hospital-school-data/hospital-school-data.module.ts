import { Module } from '@nestjs/common';
import {
  HospitalSchoolData,
  HospitalSchoolDataSchema,
} from './entities/hospital-school-data.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { HospitalSchoolDataService } from './hospital-school-data.service';
import { HospitalSchoolDataController } from './hospital-school-data.controller';

@Module({
  imports: [
    AdminModule,
    UsersModule,
    MongooseModule.forFeature(
      [{ name: HospitalSchoolData.name, schema: HospitalSchoolDataSchema }],
      'main_db',
    ),
  ],
  controllers: [HospitalSchoolDataController],
  providers: [HospitalSchoolDataService],
})
export class HospitalSchoolDataModule {}
