import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { ContactUsService } from './contact-us.service';
import { ContactUsController } from './contact-us.controller';
import { ContactUs, ContactUsSchema } from './entities/contact-us.entity';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [{ name: ContactUs.name, schema: ContactUsSchema }],
      'main_db',
    ),
  ],
  controllers: [ContactUsController],
  providers: [ContactUsService],
})
export class ContactUsModule {}
