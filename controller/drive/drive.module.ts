import { Module } from '@nestjs/common';
import { DriveService } from './drive.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../request/entities/cause-request.entity';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { DriveController } from './drive.controller';
import {
  Notification,
  NotificationSchema,
} from '../notification/entities/notification.entity';
import {
  AdminNotification,
  AdminNotificationSchema,
} from '../notification/entities/admin-notification.entity';
import { Fund, FundSchema } from '../fund/entities/fund.entity';
import { Drive, DriveSchema } from './entities/drive.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Comment, CommentSchema } from '../request/entities/comments.entity';
import { Post, PostSchema } from './entities/drive-post.entity';
import {
  UserDriveEvent,
  UserDriveEventSchema,
} from './entities/user-drive-event.entity';
import { RequestModule } from '../request/request.module';
import { Category, CategorySchema } from '../category/entities/category.entity';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    RequestModule,
    MongooseModule.forFeature(
      [
        {
          name: Drive.name,
          schema: DriveSchema,
        },
        {
          name: Post.name,
          schema: PostSchema,
        },
        { name: User.name, schema: UserSchema },
        { name: Category.name, schema: CategorySchema },
        { name: Fund.name, schema: FundSchema },
        { name: Comment.name, schema: CommentSchema },
        { name: Notification.name, schema: NotificationSchema },
        { name: UserDriveEvent.name, schema: UserDriveEventSchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
        { name: AdminNotification.name, schema: AdminNotificationSchema },
      ],
      'main_db',
    ),
  ],
  controllers: [DriveController],
  providers: [DriveService],
})
export class DriveModule {}
