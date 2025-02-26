import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { ManageVolunteerService } from './manage-volunteer.service';
import { ManageVolunteerController } from './manage-volunteer.controller';
import { ManageVolunteer, ManageVolunteerSchema} from './entities/manage-volunteer.entity';
import { RequestModel, RequestSchema} from '../request/entities/request.entity';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [
        { name: RequestModel.name, schema: RequestSchema },
        { name: ManageVolunteer.name, schema: ManageVolunteerSchema },
      ],
      'main_db',
    ),
  ],
  controllers: [ManageVolunteerController],
  providers: [ManageVolunteerService]
})
export class ManageVolunteerModule {}
