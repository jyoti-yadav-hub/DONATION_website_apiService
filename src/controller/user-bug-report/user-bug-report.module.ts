import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserBugReportService } from './user-bug-report.service';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { UserBugReportController } from './user-bug-report.controller';
import {
  UserBugReport,
  UserBugReportSchema,
} from './entities/user-bug-report.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: UserBugReport.name, schema: UserBugReportSchema }],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [UserBugReportController],
  providers: [UserBugReportService],
})
export class UserBugReportModule {}
