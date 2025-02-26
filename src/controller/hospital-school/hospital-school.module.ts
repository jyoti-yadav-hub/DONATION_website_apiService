import { Module } from '@nestjs/common';
import {
  HospitalSchool,
  HospitalSchoolSchema,
} from './entities/hospital-school.entity';
import {
  HospitalSchoolData,
  HospitalSchoolDataSchema,
} from '../hospital-school-data/entities/hospital-school-data.entity';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../request/entities/cause-request.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { HospitalSchoolService } from './hospital-school.service';
import { HospitalSchoolController } from './hospital-school.controller';

@Module({
  imports: [
    AdminModule,
    UsersModule,
    MongooseModule.forFeature(
      [
        { name: HospitalSchool.name, schema: HospitalSchoolSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
        { name: HospitalSchoolData.name, schema: HospitalSchoolDataSchema },
      ],
      'main_db',
    ),
  ],
  controllers: [HospitalSchoolController],
  providers: [HospitalSchoolService],
})
export class HospitalSchoolModule {}
