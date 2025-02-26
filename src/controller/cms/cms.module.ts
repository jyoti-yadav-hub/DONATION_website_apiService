import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { Cms, CmsSchema } from './entities/cm.entity';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [{ name: Cms.name, schema: CmsSchema }],
      'main_db',
    ),
  ],
  providers: [CmsService],
  controllers: [CmsController],
})
export class CmsModule {}
