import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PostModel, PostSchema } from './entities/post.entity';
import {
  RequestModel,
  RequestSchema,
} from '../request/entities/request.entity';
import { Ngo, NgoSchema } from '../ngo/entities/ngo.entity';
import { Drive, DriveSchema } from '../drive/entities/drive.entity';
import { CommentModel, CommentSchema } from './entities/comment.entity';
import {
  ManageVolunteer,
  ManageVolunteerSchema,
} from '../manage-volunteer/entities/manage-volunteer.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Ngo.name, schema: NgoSchema },
        { name: Drive.name, schema: DriveSchema },
        { name: PostModel.name, schema: PostSchema },
        { name: CommentModel.name, schema: CommentSchema },
        { name: RequestModel.name, schema: RequestSchema },
        { name: ManageVolunteer.name, schema: ManageVolunteerSchema },
      ],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
