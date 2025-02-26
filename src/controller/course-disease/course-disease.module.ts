import { Module } from '@nestjs/common';
import { CourseDiseaseService } from './course-disease.service';
import { CourseDiseaseController } from './course-disease.controller';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HospitalSchool,
  HospitalSchoolSchema,
} from '../hospital-school/entities/hospital-school.entity';
import {
  CourseDisease,
  CourseDiseaseSchema,
} from './entities/course-disease.entity';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../request/entities/cause-request.entity';
@Module({
  imports: [
    AdminModule,
    UsersModule,
    MongooseModule.forFeature(
      [
        { name: CourseDisease.name, schema: CourseDiseaseSchema },
        { name: HospitalSchool.name, schema: HospitalSchoolSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
      ],
      'main_db',
    ),
  ],
  controllers: [CourseDiseaseController],
  providers: [CourseDiseaseService],
})
export class CourseDiseasesModule {}
