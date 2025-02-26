import { Module } from '@nestjs/common';
import {
  RequestModel,
  RequestSchema,
} from '../request/entities/request.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { RoleService } from './role.service';
import { authConfig } from '../../config/auth.config';
import { RoleController } from './role.controller';
import { Role, RoleSchema } from './entities/role.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Role.name, schema: RoleSchema },
        { name: RequestModel.name, schema: RequestSchema },
      ],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
