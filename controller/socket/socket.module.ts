/* eslint-disable prettier/prettier */
import { ChatGateway } from './chat.gateway';
import {
  FoodRequestModel,
  FoodRequestSchema,
} from '../request/entities/food-request.entity';
import { SocketService } from './socket.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { forwardRef, Module } from '@nestjs/common';
import { User, UserSchema } from '../users/entities/user.entity';
import {
  UserToken,
  UserTokenSchema,
} from '../users/entities/user-token.entity';
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: UserToken.name, schema: UserTokenSchema },
        { name: FoodRequestModel.name, schema: FoodRequestSchema },
      ],
      'main_db',
    ),
    forwardRef(() => UsersModule),
  ],
  exports: [SocketService, ChatGateway],
  providers: [SocketService, ChatGateway],
})
export class SocketModule {}
