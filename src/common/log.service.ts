/* eslint-disable prettier/prettier */
import ip from 'ip';
import _ from 'lodash';
import { Model } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { REQUEST } from '@nestjs/core';
import {
  CorporateActivityLog,
  CorporateActivityLogDocument,
} from '../controller/corporate/entities/corporate-activity-log.entity';
import {
  AdminLog,
  AdminLogDocument,
} from '../controller/admin/entities/admin-log.entity';
import { CommonService } from './common.service';
import { authConfig } from '../config/auth.config';
import mConfig from '../config/message.config.json';
import { ErrorlogService } from '../controller/error-log/error-log.service';
import {
  FundraiserActivityLog,
  FundraiserActivityLogDocument,
} from '../controller/request/entities/fundraiser-activity-log.entity';
import { FundraiserActivityLogDto } from 'src/controller/request/dto/fundraiser-activity-logs.dto';
import { ApiLog, ApiLogDocument } from './entities/api-log.entity';
const ObjectID = require('mongodb').ObjectID;
const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
@Injectable()
export class LogService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(CorporateActivityLog.name)
    private corporateActivityLog: Model<CorporateActivityLogDocument>,
    @InjectModel(FundraiserActivityLog.name)
    private fundraiserActivityLog: Model<FundraiserActivityLogDocument>,
    @InjectModel(AdminLog.name)
    private adminLog: Model<AdminLogDocument>,
    @InjectModel(ApiLog.name)
    private apiLog: Model<ApiLogDocument>,
  ) {}

  //Function for create  activity log
  async createActivityLog(data) {
    try {
      const user = this.request.user;

      const addData: any = {
        request_id: data.request_id,
        fund_id: data.fund_id,
        drive_id: data.drive_id,
        corporate_id: user.corporate_data._id,
        user_id: user._id,
        description: data.description,
        ip: this.request.headers['x-forwarded-for'],
      };
      const createActivityLog = new this.corporateActivityLog(addData);
      await createActivityLog.save();
    } catch (e) {
      this.errorlogService.errorLog(
        e,
        'common/log.service.ts-createActivityLog',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //Function for create admin log
  async createAdminLog(data) {
    try {
      const user = this.request.user;

      const addData: any = {
        action: data.action,
        entity_name: data.entity_name,
        admin_id: user.id,
        admin_name: user.name,
        admin_email: user.email,
        description: data.description,
        ip: this.request.headers['x-forwarded-for'],
      };

      if (data.entity_id && !_.isUndefined(data.entity_id)) {
        addData.entity_id = data.entity_id;
      }
      if (data.user_id && !_.isUndefined(data.user_id)) {
        addData.user_id = data.user_id;
      }
      if (data.request_id && !_.isUndefined(data.request_id)) {
        addData.request_id = data.request_id;
      }
      if (data.fund_id && !_.isUndefined(data.fund_id)) {
        addData.fund_id = data.fund_id;
      }
      if (data.drive_id && !_.isUndefined(data.drive_id)) {
        addData.drive_id = data.drive_id;
      }
      if (data.ngo_id && !_.isUndefined(data.ngo_id)) {
        addData.ngo_id = data.ngo_id;
      }
      const createAdminLog = new this.adminLog(addData);
      await createAdminLog.save();
    } catch (e) {
      this.errorlogService.errorLog(e, 'common/log.service.ts-createAdminLog');
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //Function for create fundraiser activity log
  async createFundraiserActivityLog(data) {
    try {
      const addData: any = {
        request_id: data.request_id,
        user_id: data.user_id,
        text: data.text,
      };
      const createActivityLog = new this.fundraiserActivityLog(addData);
      await createActivityLog.save();
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'common/log.service.ts-createFundraiserActivityLog',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //Api for list adminlog for admin
  public async adminLogList(param, res: any): Promise<AdminLog[]> {
    try {
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let query = [];
        const where = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.action) && filter.action) {
          const query = await this.commonService.filter(
            operator,
            filter.action,
            'action',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.entity_name) && filter.entity_name) {
          const query = await this.commonService.filter(
            operator,
            filter.entity_name,
            'entity_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.ip) && filter.ip) {
          const query = await this.commonService.filter(
            operator,
            filter.ip,
            'ip',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.admin_name) && filter.admin_name) {
          const query = await this.commonService.filter(
            operator,
            filter.admin_name,
            'admin_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.admin_email) && filter.admin_email) {
          const query = await this.commonService.filter(
            operator,
            filter.admin_email,
            'admin_email',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.admin_id) && filter.admin_id) {
          const query = await this.commonService.filter(
            'objectId',
            filter.admin_id,
            'admin_id',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.description) && filter.description) {
          const query = await this.commonService.filter(
            operator,
            filter.description,
            'description',
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
        if (!_.isUndefined(filter.entity_id) && filter.entity_id) {
          const fields = [
            'entity_id',
            'user_id',
            'request_id',
            'fund_id',
            'drive_id',
            'ngo_id',
          ];
          query = await this.commonService.getGlobalFilter(
            fields,
            filter.search,
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'action',
            'entity_name',
            'ip',
            'admin_name',
            'admin_email',
            'description',
            'createdAt',
          ];
          query = await this.commonService.getGlobalFilter(
            fields,
            filter.search,
          );

          const objectFields = [
            'admin_id',
            'entity_id',
            'user_id',
            'request_id',
            'fund_id',
            'drive_id',
            'ngo_id',
          ];
          const ObjectFilter = await this.commonService.getObjectFilter(
            objectFields,
            filter.search,
          );
          query = query.concat(ObjectFilter);
        }

        if (!_.isUndefined(filter.search) && !_.isEmpty(query)) {
          match['$or'] = query;
        }
        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      const sortData = {
        _id: '_id',
        action: 'action',
        entity_name: 'entity_name',
        ip: 'ip',
        admin_name: 'admin_name',
        admin_email: 'admin_email',
        admin_id: 'admin_id',
        description: 'description',
        createdAt: 'createdAt',
      };
      const total_record = await this.adminLog.countDocuments(match).exec();
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

      const result = await this.adminLog
        .find(match)
        .sort(sort)
        .skip(start_from)
        .limit(per_page)
        .collation(authConfig.collation)
        .exec();

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
        'common/log.service.ts-adminLogList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list fundraiser log
  public async fundraiserLogList(
    param: FundraiserActivityLogDto,
    res: any,
  ): Promise<AdminLog[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {
        request_id: ObjectID(param.request_id),
        user_id: ObjectID(param.user_id),
      };

      const sortData = {
        _id: '_id',
        text: 'text',
        user_name: 'user_name',
        createdAt: 'createdAt',
      };
      const total_record = await this.fundraiserActivityLog
        .countDocuments(match)
        .exec();
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

      const result = await this.fundraiserActivityLog.aggregate(
        [
          { $match: match },
          {
            $lookup: {
              from: 'user',
              localField: 'user_id',
              foreignField: '_id',
              as: 'userData',
            },
          },
          { $unwind: '$userData' },
          {
            $project: {
              _id: 1,
              request_id: 1,
              text: 1,
              user_id: 1,
              createdAt: 1,
              user_name: {
                $concat: ['$userData.first_name', ' ', '$userData.last_name'],
              },
              user_image: {
                $ifNull: [
                  {
                    $concat: [authConfig.imageUrl, 'user/', '$userData.image'],
                  },
                  null,
                ],
              },
            },
          },
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
        'common/log.service.ts-fundraiserLogList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Function for create app log for store request and response when api call from app
  async createApiLog(data) {
    try {
      const user = this.request.user;
      if (user) {
        data.user = {
          _id: user._id,
          active_type: user.active_type ? user.active_type : 'user',
          email: user.email,
        };
      }

      const logEntry = await this.apiLog.create(data);
      this.request.api_log_id = logEntry._id;
      data.createdAt = new Date();
      this.commonService.uploadLogOnS3(data, 'api_logs');
      return;
    } catch (e) {
      this.errorlogService.errorLog(e, 'common/log.service.ts-createApiLog');
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }
}
