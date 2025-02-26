import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import {
  FundHelpRequest,
  FundHelpRequestSchema,
} from './entities/fund-help-request.entity';
import { FundHelpRequestService } from './fund-help-request.service';
import { FundHelpRequestController } from './fund-help-request.controller';
import { Fund, FundSchema } from '../fund/entities/fund.entity';
import {
  CauseRequestModel,
  CauseRequestSchema,
} from '../request/entities/cause-request.entity';
import { Category, CategorySchema } from '../category/entities/category.entity';
import { authConfig } from 'src/config/auth.config';
import { User, UserSchema } from '../users/entities/user.entity';
import { FundModule } from '../fund/fund.module';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    authConfig,
    FundModule,
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: FundHelpRequest.name, schema: FundHelpRequestSchema },
        { name: Fund.name, schema: FundSchema },
        { name: Category.name, schema: CategorySchema },
        { name: CauseRequestModel.name, schema: CauseRequestSchema },
      ],
      'main_db',
    ),
  ],
  controllers: [FundHelpRequestController],
  providers: [FundHelpRequestService],
})
export class FundHelpRequestModule {}
