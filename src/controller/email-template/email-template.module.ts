import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateController } from './email-template.controller';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from './entities/email-template.entity';

@Module({
  imports: [
    UsersModule,
    AdminModule,
    MongooseModule.forFeature(
      [{ name: EmailTemplate.name, schema: EmailTemplateSchema }],
      'main_db',
    ),
  ],
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService],
})
export class EmailTemplateModule {}
