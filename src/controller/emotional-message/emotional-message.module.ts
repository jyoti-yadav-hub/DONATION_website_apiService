import { Module } from '@nestjs/common';
import {
  EmotionalMessage,
  EmotionalMessageSchema,
} from './entities/emotional-message.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { EmotionalMessageService } from './emotional-message.service';
import { EmotionalMessageController } from './emotional-message.controller';
@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [{ name: EmotionalMessage.name, schema: EmotionalMessageSchema }],
      'main_db',
    ),
  ],
  controllers: [EmotionalMessageController],
  providers: [EmotionalMessageService],
})
export class EmotionalMessageModule {}
