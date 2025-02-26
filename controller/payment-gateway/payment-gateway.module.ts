import { Module } from '@nestjs/common';
import {
  PaymentGateway,
  PaymentGatewaySchema,
} from './entities/payment-gateway.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { PaymentGatewayService } from './payment-gateway.service';
import { User, UserSchema } from '../users/entities/user.entity';
import { PaymentGatewayController } from './payment-gateway.controller';
@Module({
  imports: [
    AdminModule,
    UsersModule,
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: PaymentGateway.name, schema: PaymentGatewaySchema },
      ],
      'main_db',
    ),
  ],
  controllers: [PaymentGatewayController],
  providers: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
