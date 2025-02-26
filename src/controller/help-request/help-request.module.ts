import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HelpRequestService } from './help-request.service';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { HelpRequestController } from './help-request.controller';
import { HelpRequest, HelpRequestSchema } from './entities/help-request.entity';
import { Queue, QueueSchema } from '../request/entities/queue-data.entity';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../request/entities/cause-request.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: HelpRequest.name, schema: HelpRequestSchema },
        { name: Queue.name, schema: QueueSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
      ],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [HelpRequestController],
  providers: [HelpRequestService],
})
export class HelpRequestModule {}
