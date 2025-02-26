import {
  Notification,
  NotificationSchema,
} from './entities/notification.entity';
import {
  AdminNotification,
  AdminNotificationSchema,
} from './entities/admin-notification.entity';
import {
  CorporateNotification,
  CorporateNotificationSchema,
} from './entities/corporate-notification.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, forwardRef } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../../common/common.module';
import { NotificationService } from './notification.service';
import { ErrorlogModule } from '../error-log/error-log.module';
import { NotificationController } from './notification.controller';
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Notification.name, schema: NotificationSchema },
        { name: AdminNotification.name, schema: AdminNotificationSchema },
        {
          name: CorporateNotification.name,
          schema: CorporateNotificationSchema,
        },
      ],
      'main_db',
    ),
    forwardRef(() => AdminModule),
    forwardRef(() => CommonModule),
    ErrorlogModule,
    forwardRef(() => UsersModule),
  ],
  exports: [NotificationService],
  providers: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
