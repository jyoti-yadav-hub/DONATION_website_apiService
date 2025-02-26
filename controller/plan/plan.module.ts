import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanController } from './plan.controller';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { PlanModel, PlanSchema } from './entities/plan.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: PlanModel.name, schema: PlanSchema }],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  providers: [PlanService],
  controllers: [PlanController],
})
export class PlanModule {}
