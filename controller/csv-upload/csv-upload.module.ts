import { Module } from '@nestjs/common';
import { CsvUploadService } from './csv-upload.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvUploadController } from './csv-upload.controller';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { CsvUploadModel, CsvUploadSchema } from './entities/csv-upload.entity';
import {
  HospitalSchool,
  HospitalSchoolSchema,
} from '../hospital-school/entities/hospital-school.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: CsvUploadModel.name, schema: CsvUploadSchema },
        { name: HospitalSchool.name, schema: HospitalSchoolSchema },
      ],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  providers: [CsvUploadService],
  controllers: [CsvUploadController],
})
export class CsvUploadModule {}
