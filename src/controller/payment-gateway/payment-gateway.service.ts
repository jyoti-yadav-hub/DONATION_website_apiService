import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import {
  PaymentGateway,
  PaymentGatewayDocument,
} from './entities/payment-gateway.entity';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreatePaymentGatewayDto } from './dto/create-payment-gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment-gateway.dto';
import { User, UserDocument } from '../users/entities/user.entity';
import { authConfig } from 'src/config/auth.config';

@Injectable()
export class PaymentGatewayService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(PaymentGateway.name)
    private paymentGatewayModel: Model<PaymentGatewayDocument>,
  ) {}
  public async create(
    createPaymentGatewayDto: CreatePaymentGatewayDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createPaymentGatewayDto,
      );
      const paymentGatewayData = await this.paymentGatewayModel
        .findOne({
          name: new RegExp(createPaymentGatewayDto.name, 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (paymentGatewayData) {
        return res.json({
          success: false,
          message: mConfig.payment_gateway_already_exists,
        });
      } else {
        const data: any = JSON.parse(createPaymentGatewayDto.form_data);
        const formData = {
          name: createPaymentGatewayDto.name,
          form_settings: createPaymentGatewayDto.form_data,
          form_fields: {},
        };
        //Handle form_fields object keys
        data.map(async (item: any) => {
          formData.form_fields[item.label] = item.value;
        });

        const createpaymentGateway = new this.paymentGatewayModel(formData);
        await createpaymentGateway.save();
        return res.json({
          success: true,
          message: mConfig.Payment_gateway_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/payment-gateway/payment-gateway.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findAll(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      if (param.allData == 1) {
        const data = await this.paymentGatewayModel
          .find({}, { _id: 1, name: 1 })
          .collation(authConfig.collation)
          .sort({ name: 1 })
          .lean();
        return res.json({ success: true, data });
      }
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.name) && filter.name) {
          const query = await this.commonService.filter(
            operator,
            filter.name,
            'name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.createdAt) && filter.createdAt) {
          const query = await this.commonService.filter(
            'date',
            filter.createdAt,
            'createdAt',
          );
          where.push(query);
        }

        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      const sortData = {
        _id: '_id',
        name: 'name',
        createdAt: 'createdAt',
      };

      const total = await this.paymentGatewayModel
        .aggregate([{ $match: match }, { $count: 'count' }])
        .exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      const {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        param.page,
        param.per_page,
        total_record,
        sortData,
        param.sort_type,
        param.sort,
      );

      const result = await this.paymentGatewayModel.aggregate(
        [
          { $match: match },
          { $sort: sort },
          { $skip: start_from },
          { $limit: per_page },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        data: result,
        success: true,
        total_count: total_record,
        prev_enable: prev_enable,
        next_enable: next_enable,
        total_pages: total_pages,
        per_page: per_page,
        page: page,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/payment-gateway/payment-gateway.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async update(
    id: string,
    updatePaymentGatewayDto: UpdatePaymentGatewayDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updatePaymentGatewayDto,
      );
      const data: any = JSON.parse(updatePaymentGatewayDto.form_data);
      const formData = {
        form_settings: updatePaymentGatewayDto.form_data,
        form_fields: {},
      };
      //Handle form_fields object keys
      data.map(async (item: any) => {
        formData.form_fields[item.label] = item.value;
      });
      const result = await this.paymentGatewayModel
        .findByIdAndUpdate(id, formData, { new: true })
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      return res.json({
        message: mConfig.Payment_gateway_updated,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/payment-gateway/payment-gateway.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async delete(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const data = await this.paymentGatewayModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .exec();
      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      return res.json({
        message: mConfig.Payment_gateway_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/payment-gateway/payment-gateway.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
