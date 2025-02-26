import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { HomeCmsService } from './home-cms.service';
import { UsersModule } from '../users/users.module';
import { HomeCmsController } from './home-cms.controller';
import { HomeCm, HomeCmSchema } from './entities/home-cm.entity';
@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [{ name: HomeCm.name, schema: HomeCmSchema }],
      'main_db',
    ),
  ],
  controllers: [HomeCmsController],
  providers: [HomeCmsService],
})
export class HomeCmsModule {}
