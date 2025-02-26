/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import ip from 'ip';
import { REQUEST } from '@nestjs/core';
import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import {
  PaymentServerLog,
  PaymentServerLogDocument,
} from './entities/payment-server-log.entity';
import { authConfig } from '../../config/auth.config';
import { ErrorlogService } from '../error-log/error-log.service';

@Injectable()
export class PaymentServerLogService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(PaymentServerLog.name)
    private paymentServerLogModel: Model<PaymentServerLogDocument>,
  ) {}
  /**
   * Api for add error log
   *
   */
  public async create(body, res: any) {
    try {
      await this.paymentServerLogModel.create({ request: body });
      body.createdAt = new Date();
      //Upload a new object (file or data) to an Amazon S3
      this.commonService.uploadLogOnS3(
        { request: body },
        'payment_server_logs',
      );
      return res.json({
        success: true,
        message: mConfig.Log_created,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/payment-server-log/payment-server-log.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
