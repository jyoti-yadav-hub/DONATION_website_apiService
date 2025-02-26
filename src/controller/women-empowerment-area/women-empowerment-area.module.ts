import { Module } from '@nestjs/common';
import { WomenEmpowermentAreaService } from './women-empowerment-area.service';
import { WomenEmpowermentAreaController } from './women-empowerment-area.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { WomenEmpowermentArea, WomenEmpowermentAreaSchema } from './entities/women-empowerment-area.entity';
import { AdminModule } from '../admin/admin.module';
import { authConfig } from 'src/config/auth.config';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: WomenEmpowermentArea.name, schema: WomenEmpowermentAreaSchema }],
      'main_db',
    ),
    authConfig,
    AdminModule,
    UsersModule,
  ],
  controllers: [WomenEmpowermentAreaController],
  providers: [WomenEmpowermentAreaService]
})
export class WomenEmpowermentAreaModule {}
