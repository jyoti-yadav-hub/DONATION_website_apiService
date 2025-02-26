import { Module } from '@nestjs/common';
import { FooterStripService } from './footer-strip.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FooterStripController } from './footer-strip.controller';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import {
  FooterStripModel,
  FooterStripSchema,
} from './entities/footer-strip.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: FooterStripModel.name, schema: FooterStripSchema }],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  providers: [FooterStripService],
  controllers: [FooterStripController],
})
export class FooterStripModule {}
