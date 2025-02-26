import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { Faq, FaqSchema} from './entities/faq.entity';


@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Faq.name, schema: FaqSchema },
      ],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}
