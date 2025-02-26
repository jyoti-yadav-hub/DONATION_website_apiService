/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { DeleteAccountService } from './delete-account.service';
import { DeleteAccountController } from './delete-account.controller';
import {
  RequestModel,
  RequestSchema,
} from '../request/entities/request.entity';
import {
  DeleteAccount,
  DeleteAccountSchema,
} from './entities/delete-account.entity';
import { Fund, FundSchema } from '../fund/entities/fund.entity';
import { Drive, DriveSchema } from '../drive/entities/drive.entity';
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: RequestModel.name, schema: RequestSchema },
        { name: Fund.name, schema: FundSchema },
        {
          name: Drive.name,
          schema: DriveSchema,
        },
        { name: DeleteAccount.name, schema: DeleteAccountSchema },
      ],
      'main_db',
    ),
    AdminModule,
    UsersModule,
  ],
  controllers: [DeleteAccountController],
  providers: [DeleteAccountService],
})
export class DeleteAccountModule {}
