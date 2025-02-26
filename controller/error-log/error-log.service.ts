/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import ip from 'ip';
import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { DeleteErrorLogDto } from './dto/delete-error-log.dto';
import { ErrorLog, ErrorLogDocument } from './entities/error-log.entity';
import { Log, LogDocument } from './entities/log.entity';
import { Logs, LogsDocument } from './entities/logs.entity';
import { authConfig } from '../../config/auth.config';
import { REQUEST } from '@nestjs/core';
import moment from 'moment';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectID = require('mongodb').ObjectID;
@Injectable()
export class ErrorlogService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    @InjectModel(ErrorLog.name) private errorLogModel: Model<ErrorLogDocument>,
    @InjectModel(Log.name) private logModel: Model<LogDocument>,
  ) {}

  //Api for list ErrorLog for admin
  public async findAll(param, res: any): Promise<ErrorLog[]> {
    try {
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let query = [];
        const where = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.error_name) && filter.error_name) {
          const query = await this.commonService.filter(
            operator,
            filter.error_name,
            'error_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.error_message) && filter.error_message) {
          const query = await this.commonService.filter(
            operator,
            filter.error_message,
            'error_message',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.error_file) && filter.error_file) {
          const query = await this.commonService.filter(
            operator,
            filter.error_file,
            'error_file',
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
          const fields = [
            'error_name',
            'error_message',
            'error_file',
            'createdAt',
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
        error_name: 'error_name',
        error_message: 'error_message',
        error_file: 'error_file',
        createdAt: 'createdAt',
      };
      const total_record = await this.errorLogModel.countDocuments(match).exec();
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

      const result = await this.errorLogModel.aggregate(
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
      this.errorLog(
        error,
        'src/controller/errorlog/errorlog.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete error log
  public async deleteErrorLog(id: string, res: any): Promise<ErrorLog> {
    try {
      const errorLog = await this.errorLogModel.findByIdAndDelete(id).exec();
      if (!errorLog) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      return res.json({
        message: mConfig.Errorlog_deleted,
        success: true,
      });
    } catch (error) {
      this.errorLog(
        error,
        'src/controller/errorlog/errorlog.service.ts-deleteErrorLog',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete error log
  public async deleteManyErrorLog(
    deleteErrorLogDto: DeleteErrorLogDto,
    res: any,
  ): Promise<ErrorLog> {
    try {
      const allId = deleteErrorLogDto.id;
      const errorLog = await this.errorLogModel
        .deleteMany({
          _id: {
            $in: allId,
          },
        })
        .exec();
      if (errorLog.deletedCount == 0) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      return res.json({
        message: mConfig.Errorlog_deleted,
        success: true,
      });
    } catch (error) {
      this.errorLog(
        error,
        'src/controller/errorlog/errorlog.service.ts-deleteManyErrorLog',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for add error log
  public async errorLog(value, file, body = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const obj = {
          error_name: value.name ? value.name : '',
          error_message: value.message ? value.message : '',
          error_path: value.stack ? value.stack : value,
          error_file: file ? file : '',
          body: body,
          api_log_id: this.request.api_log_id ? this.request.api_log_id : '',
          ip: this.request.headers['x-forwarded-for'],
        };
        await this.errorLogModel.create(obj);
        obj['createdAt'] = new Date();
        //save logs on s3 server
        this.commonService.uploadLogOnS3(obj, 'error_logs');
      } catch (error) {
        resolve([]);
      }
    });
  }

  // Api for add log
  public async createApiLog(api, method, data) {
    return new Promise(async (resolve, reject) => {
      try {
        const obj = {
          api: api ? api : '',
          method: method ? method : '',
          data: data ? data : '',
        };
        await this.logModel.create(obj);
      } catch (error) {
        resolve([]);
      }
    });
  }
}
export class ErrorlogServiceForCron {
  constructor(
    private readonly commonService: CommonService,
    @InjectModel(ErrorLog.name) private errorLogModel: Model<ErrorLogDocument>,
    @InjectModel(Logs.name) private logsModel: Model<LogsDocument>,
  ) {}

  // Api for add error log
  public async errorLog(value, file, body = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const obj = {
          error_name: value.name ? value.name : '',
          error_message: value.message ? value.message : '',
          error_path: value.stack ? value.stack : value,
          error_file: file ? file : '',
          body: body,
          ip: ip.address(),
        };
        await this.errorLogModel.create(obj);
        obj['createdAt'] = new Date();
        // save logs on s3 server
        this.commonService.uploadLogOnS3(obj, 'error_logs');
      } catch (error) {
        resolve([]);
      }
    });
  }

  //  Create log for check conditions on server
  public async createLog(log_name, data) {
    return new Promise(async (resolve, reject) => {
      try {
        var duration:any = moment.duration(moment(new Date()).diff(data.run_time));
        let finalLogFields ={
          run_time:data.run_time,
          end_time:new Date(),
          total_time:duration['_data'] ,
          error_log_id:ObjectID()
        }
        const obj = {
          log_name: log_name ? log_name : '',
          data: finalLogFields,
        };
        await this.logsModel.create(obj);
      } catch (error) {
        resolve([]);
      }
    });
  }
}
