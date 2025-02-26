import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { ShareMessageService } from './share-message.service';
import { ShareMessageController } from './share-message.controller';
import {
  ShareMessage,
  ShareMessageSchema,
} from './entities/share-message.entity';
import { Category, CategorySchema } from '../category/entities/category.entity';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [
        { name: ShareMessage.name, schema: ShareMessageSchema },
        { name: Category.name, schema: CategorySchema },
      ],
      'main_db',
    ),
  ],
  controllers: [ShareMessageController],
  providers: [ShareMessageService],
})
export class ShareMessageModule {}
