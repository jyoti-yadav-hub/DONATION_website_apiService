import { Module } from '@nestjs/common';
import {
  RequestModel,
  RequestSchema,
} from '../request/entities/request.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { CategoryService } from './category.service';
import { authConfig } from '../../config/auth.config';
import { CategoryController } from './category.controller';
import { Category, CategorySchema } from './entities/category.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Category.name, schema: CategorySchema },
        { name: RequestModel.name, schema: RequestSchema },
      ],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
