import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { PaymentServerLogService } from './payment-server-log.service';
import { PaymentServerLogController } from './payment-server-log.controller';
import { forwardRef, Global, Module } from '@nestjs/common';
import {
  PaymentServerLog,
  PaymentServerLogSchema,
} from './entities/payment-server-log.entity';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: PaymentServerLog.name, schema: PaymentServerLogSchema }],
      'log_db',
    ),
    forwardRef(() => AdminModule),
  ],
  exports: [PaymentServerLogService],
  providers: [PaymentServerLogService],
  controllers: [PaymentServerLogController],
})
export class PaymentServerLogModule {}
