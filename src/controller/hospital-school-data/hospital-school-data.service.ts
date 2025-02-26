import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import {
  HospitalSchoolData,
  HospitalSchoolDataDocument,
} from './entities/hospital-school-data.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { QueueService } from 'src/common/queue.service';
import { CommonService } from 'src/common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { authConfig } from 'src/config/auth.config';
import { LogService } from 'src/common/log.service';

@Injectable()
export class HospitalSchoolDataService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly queueService: QueueService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(HospitalSchoolData.name)
    private hospitalSchoolDataModel: Model<HospitalSchoolDataDocument>,
  ) {}

  public async findAll(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : 'contains';

        if (
          !_.isUndefined(filter.saayam_supported_name) &&
          filter.saayam_supported_name
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.saayam_supported_name,
            'saayam_supported_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.specify_name) && filter.specify_name) {
          const query = await this.commonService.filter(
            operator,
            filter.specify_name,
            'specify_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.country) && filter.country) {
          const query = await this.commonService.filter(
            operator,
            filter.country,
            'country',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.city) && filter.city) {
          const query = await this.commonService.filter(
            operator,
            filter.city,
            'location.city',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.createdAt) && filter.createdAt) {
          const query = await this.commonService.filter(
            operator,
            filter.createdAt,
            'createdAt',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.createdBy) && filter.createdBy) {
          const query = await this.commonService.filter(
            operator,
            filter.createdBy,
            'createdBy',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.updatedAt) && filter.updatedAt) {
          const query = await this.commonService.filter(
            operator,
            filter.updatedAt,
            'updatedAt',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.updatedBy) && filter.updatedBy) {
          const query = await this.commonService.filter(
            operator,
            filter.updatedBy,
            'updatedBy',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'saayam_supported_name',
            'specify_name',
            'country',
            'location.city',
            'createdAt',
            'createdBy',
            'updatedAt',
            'updatedBy',
          ];
          query = await this.commonService.getGlobalFilter(
            fields,
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
        saayam_supported_name: 'saayam_supported_name',
        reference_phone_number: 'reference_phone_number',
        specify_name: 'specify_name',
        country: 'country',
        city: 'location.city',
        createdAt: 'createdAt',
        createdBy: 'createdBy',
        updatedAt: 'updatedAt',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.hospitalSchoolDataModel.countDocuments(match).exec();
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
      const result = await this.hospitalSchoolDataModel.aggregate(
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
        'src/controller/hospital-school-data/hospital-school-data.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async remove(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const data: any = await this.hospitalSchoolDataModel
        .findByIdAndDelete(id)
        .select({ _id: 1, type: 1 })
        .lean();
      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const type = data.type == 'education' ? 'School' : 'Hospital';
        //Add Activity Log
        const logData = {
          action: 'delete',
          entity_id: data._id,
          entity_name: 'Unverified Hospitals/Schools',
          description: `${type} has been deleted successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Data_deleted,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/hospital-school-data/hospital-school-data.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
