import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { JobTitle,JobTitleSchema} from './entities/job-title.entity';
import { JobTitleService } from './job-title.service';
import { JobTitleController } from './job-title.controller';

@Module({
  imports: [
    AdminModule,
    MongooseModule.forFeature(
      [{ name: JobTitle.name, schema: JobTitleSchema }],
      'main_db',
    ),
  ],
  controllers: [JobTitleController],
  providers: [JobTitleService],
})
export class JobTitleModule {}
