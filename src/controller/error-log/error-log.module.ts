import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { ErrorlogService, ErrorlogServiceForCron } from './error-log.service';
import { ErrorlogController } from './error-log.controller';
import { forwardRef, Global, Module } from '@nestjs/common';
import { ErrorLog, ErrorLogSchema } from './entities/error-log.entity';
import { Log, LogSchema } from './entities/log.entity';
import { Logs, LogsSchema } from './entities/logs.entity';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: ErrorLog.name, schema: ErrorLogSchema },
        { name: Log.name, schema: LogSchema },
        { name: Logs.name, schema: LogsSchema },
      ],
      'log_db',
    ),
    forwardRef(() => AdminModule),
  ],
  exports: [ErrorlogService, ErrorlogServiceForCron],
  providers: [ErrorlogService, ErrorlogServiceForCron],
  controllers: [ErrorlogController],
})
export class ErrorlogModule {}
