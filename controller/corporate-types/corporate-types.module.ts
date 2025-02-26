import { Module } from '@nestjs/common';
import {
  CorporateType,
  CorporateTypeSchema,
} from './entities/corporate-type.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { CorporateTypesService } from './corporate-types.service';
import { CorporateTypesController } from './corporate-types.controller';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: CorporateType.name, schema: CorporateTypeSchema }],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [CorporateTypesController],
  providers: [CorporateTypesService],
})
export class CorporateTypesModule {}
