import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { LogService } from '../../common/log.service';
import { CreateDefaultOtpDto } from './dto/create-default-otp.dto';
import { UpdateDefaultOtpDto } from './dto/update-default-otp.dto';
import {
  OtpVerifyDocument,
  OtpVerifyModel,
} from '../users/entities/otp-verify';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class DefaultOtpService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly logService: LogService,
    @InjectModel(OtpVerifyModel.name)
    private otpVerifyModel: Model<OtpVerifyDocument>,
  ) {}

  //Api for create default OTP
  public async create(createDefaultOtpDto: CreateDefaultOtpDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createDefaultOtpDto,
      );
      const otpData = await this.otpVerifyModel
        .findOne({
          phone_code: createDefaultOtpDto.phone_code,
          phone: createDefaultOtpDto.phone,
        })
        .select({ _id: 1, is_default: 1 })
        .lean();
      if (!_.isEmpty(otpData) && !_.isUndefined(otpData)) {
        if (otpData.is_default === true) {
          return res.json({
            success: false,
            message: mConfig.OTP_Duplicate,
          });
        } else {
          await this.otpVerifyModel
            .deleteOne({ _id: ObjectID(otpData._id) })
            .lean();
        }
      }
      const adminData = this.request.user;
      createDefaultOtpDto['is_default'] = true;
      createDefaultOtpDto['createdBy'] = adminData.name;
      createDefaultOtpDto['updatedBy'] = adminData.name;
      const createDefaultOtp = new this.otpVerifyModel(createDefaultOtpDto);
      const defaultOtp = await createDefaultOtp.save();

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: defaultOtp._id,
        entity_name: 'Default OTP',
        description: 'Default OTP has been created successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.default_otp_created,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/default-otp/default-otp.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for default OTP list
  public async findAll(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { is_default: true };
      const filter = !_.isEmpty(param) ? param : [];

      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : 'contains';

        if (!_.isUndefined(filter.phone) && filter.phone) {
          const query = await this.commonService.filter(
            operator,
            filter.phone,
            'phone',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.app_otp) && filter.app_otp) {
          const query = await this.commonService.filter(
            operator,
            filter.app_otp,
            'app_otp',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.web_otp) && filter.web_otp) {
          const query = await this.commonService.filter(
            operator,
            filter.web_otp,
            'web_otp',
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

        if (!_.isUndefined(filter.search) && filter.search) {
          const str_fields = ['phone', 'app_otp', 'web_otp', 'createdAt'];
          query = await this.commonService.getGlobalFilter(
            str_fields,
            filter.search,
          );
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
        phone: 'phone',
        app_otp: 'app_otp',
        web_otp: 'web_otp',
        createdAt: 'createdAt',
      };

      const addFields = {
        $addFields: {
          phone: { $concat: ['$phone_code', ' ', '$phone'] },
        },
      };
      const total_record = await this.otpVerifyModel.countDocuments(match).exec();
      let {
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

      const result = await this.otpVerifyModel.aggregate(
        [
          addFields,
          { $match: match },
          {
            $project: {
              _id: 1,
              phone: 1,
              app_otp: 1,
              web_otp: 1,
              createdAt: 1,
              phone_code: 1,
              updatedAt: 1,
              createdBy: 1,
              updatedBy: 1,
            },
          },
          { $sort: sort },
          { $skip: start_from },
          { $limit: per_page },
        ],
        { collation: { locale: 'en' } },
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
        'src/controller/default-otp/default-otp.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update default OTP
  public async update(id: string, updateDefaultOtpDto: any, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateDefaultOtpDto,
      );
      const { phone_code, phone } = updateDefaultOtpDto;
      const otpData = await this.otpVerifyModel
        .findOne({
          phone_code,
          phone,
          _id: { $ne: new ObjectID(id) },
          is_default: true,
        })
        .lean();
      if (!_.isEmpty(otpData) && !_.isUndefined(otpData)) {
        return res.json({
          success: false,
          message: mConfig.OTP_Duplicate,
        });
      }
      const adminData = this.request.user;
      updateDefaultOtpDto['updatedBy'] = adminData.name;
      const result: any = await this.otpVerifyModel
        .findByIdAndUpdate(id, updateDefaultOtpDto, { new: true })
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'update',
        entity_id: result._id,
        entity_name: 'Default OTP',
        description: 'Default OTP has been updated successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.default_otp_updated,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/default-otp/default-otp.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete default OTP
  public async delete(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const result = await this.otpVerifyModel
        .findOneAndDelete({ _id: ObjectID(id), is_default: true })
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: result._id,
        entity_name: 'Default OTP',
        description: 'Default OTP has been deleted.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.default_otp_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/default-otp/default-otp.service.ts-delete',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
