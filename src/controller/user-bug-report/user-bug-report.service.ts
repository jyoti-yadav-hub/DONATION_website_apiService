/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from '../../config/auth.config';
import { CreateUserBugReportDto } from './dto/create-user-bug-report.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import {
  UserBugReport,
  UserBugReportDocument,
} from './entities/user-bug-report.entity';
import { LogService } from '../../common/log.service';

const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class UserBugReportService {
  constructor(
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @Inject(REQUEST) private readonly request: any,
    @InjectModel(UserBugReport.name)
    private userBugReportModel: Model<UserBugReportDocument>,
  ) {}

  //Api for create Bug report
  public async create(
    file: object,
    createUserBugReportDto: CreateUserBugReportDto,
    res: any,
  ): Promise<UserBugReport> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createUserBugReportDto,
      );
      const imageId: any = await this.commonService.checkAndLoadImage(
        file,
        'bug-report',
      );

      createUserBugReportDto.image =
        imageId && imageId.file_name ? imageId.file_name : null;

      const createBugReport = new this.userBugReportModel(
        createUserBugReportDto,
      );
      await createBugReport.save();
      return res.json({
        message: mConfig.bug_report_created,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user-bug-report/user-bug-report.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list Bug report for Admin
  public async findAll(param, res: any): Promise<UserBugReport[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      if (param.allData == 1) {
        const result = await this.userBugReportModel
          .find()
          .collation({ locale: 'en' })
          .lean();
        return res.json({
          success: true,
          data: result,
        });
      }

      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        if (!_.isUndefined(filter.screen_name) && filter.screen_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.screen_name,
            'screen_name',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.description) && filter.description) {
          const query = await this.commonService.filter(
            'contains',
            filter.description,
            'description',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.user_id) && filter.user_id) {
          const query = await this.commonService.filter(
            'contains',
            filter.user_id,
            'user_id',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.user_name) && filter.user_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.user_name,
            'user_name',
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
          const fields = ['screen_name', 'description', 'user_id', 'createdAt'];
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
        screen_name: 'screen_name',
        description: 'description',
        user_id: 'user_id',
        createdAt: 'createdAt',
      };

      const userIdAddFields = {
        $addFields: {
          userId: {
            $cond: [
              { $ne: ['$user_id', ''] },
              { $toObjectId: '$user_id' },
              null,
            ],
          },
        },
      };
      const lookup = {
        $lookup: {
          from: 'user', // collection name in db
          localField: 'userId',
          foreignField: '_id',
          as: 'userData',
        },
      };
      const unwind = {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: true,
        },
      };
      const userNameAddField = {
        $addFields: {
          user_name: {
            $concat: ['$userData.first_name', ' ', '$userData.last_name'],
          },
        },
      };

      const total = await this.userBugReportModel
        .aggregate([
          userIdAddFields,
          lookup,
          unwind,
          userNameAddField,
          { $match: match },
          { $count: 'count' },
        ])
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

      const data = await this.userBugReportModel.aggregate(
        [
          userIdAddFields,
          lookup,
          unwind,
          userNameAddField,
          { $match: match },
          { $sort: sort },
          {
            $project: {
              _id: 1,
              screen_name: 1,
              description: 1,
              image: {
                $concat: [authConfig.imageUrl, 'bug-report/', '$image'],
              },
              user_name: 1,
              user_id: 1,
              status: 1,
              createdAt: 1,
            },
          },
          { $skip: start_from },
          { $limit: per_page },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        data: data,
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
        'src/controller/user-bug-report/user-bug-report.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for change status
  public async changeStatus(
    id: string,
    status: string,
    res: any,
  ): Promise<UserBugReport> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id,status},
      );
      const bugReportData = await this.userBugReportModel
        .findById(id)
        .select({ _id: 1, user_id: 1, status: 1 })
        .lean();
      if (!bugReportData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const updateStatus = status == 'resolve' ? 'resolved' : 'canceled';
        if (bugReportData && bugReportData.user_id) {
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_bug_report,
            {
              '{{status}}': updateStatus,
            },
          );

          const input = {
            title: mConfig.noti_title_bug_report,
            message: msg,
            type: 'bug-report',
            userId: bugReportData?.user_id,
          };
          this.commonService.notification(input);
        }
        await this.userBugReportModel
          .findByIdAndUpdate(id, { status: status }, { new: true })
          .lean();

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: bugReportData._id,
          entity_name: 'Bug Reports',
          description: `Bug report has been ${updateStatus}.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.bug_report_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user-bug-report/user-bug-report.service.ts- changeStatus',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
