import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagesService } from './images.service';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { authConfig } from '../../config/auth.config';
import { ImagesController } from './images.controller';
import { Image, ImageSchema } from './entities/image.entity';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Image.name, schema: ImageSchema }],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
