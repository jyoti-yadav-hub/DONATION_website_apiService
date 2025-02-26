import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportController } from './report.controller';
import { Report, ReportSchema } from './entities/report.entity';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Report.name, schema: ReportSchema }],
      'main_db',
    ),
    AdminModule,
    UsersModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
