import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from 'src/config/auth.config';
import { LogService } from '../../common/log.service';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateJobTitleDto } from './dto/create-job-title.dto';
import { UpdateJobTitleDto } from './dto/update-job-title.dto';
import { JobTitle, JobTitleDocument } from './entities/job-title.entity';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class JobTitleService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly logService: LogService,
    @InjectModel(JobTitle.name) private jobTitleModel: Model<JobTitleDocument>,
  ) {}

  public async create(createJobTitleDto: CreateJobTitleDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createJobTitleDto,
      );
      const jobTitle = await this.jobTitleModel
        .findOne({
          job_title: new RegExp('^' + createJobTitleDto.job_title + '$', 'i'),
          is_deleted: { $ne: true },
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(jobTitle)) {
        return res.json({
          success: false,
          message: mConfig.Job_title_exist,
        });
      } else {
        const adminData = this.request.user;

        createJobTitleDto.createdBy = adminData.name;
        createJobTitleDto.updatedBy = adminData.name;
        const createJobTitle = new this.jobTitleModel(createJobTitleDto);
        const result = await createJobTitle.save();
        //Add admin log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Job Title',
          description: `${result.job_title} Job Title has been created successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.Jon_title_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/job-title/job-title.service.ts-create',
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
      const match = { is_deleted: { $ne: true } };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.job_title) && filter.job_title) {
          const query = await this.commonService.filter(
            operator,
            filter.job_title,
            'job_title',
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
        if (!_.isUndefined(filter.updatedAt) && filter.updatedAt) {
          const query = await this.commonService.filter(
            'date',
            filter.updatedAt,
            'updatedAt',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.createdBy) && filter.createdBy) {
          const query = await this.commonService.filter(
            'is',
            filter.createdBy,
            'createdBy',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.updatedBy) && filter.updatedBy) {
          const query = await this.commonService.filter(
            'is',
            filter.updatedBy,
            'updatedBy',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'job_title',
            'createdAt',
            'updatedAt',
            'createdBy',
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
        job_title: 'job_title',
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.jobTitleModel.countDocuments(match).exec();
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
      const result = await this.jobTitleModel.aggregate(
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
        'src/controller/job-title/job-title.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findList(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const result = await this.jobTitleModel
        .find({ is_deleted: { $ne: true } })
        .collation(authConfig.collation)
        .select({ _id: 1, name: '$job_title' })
        .sort({ job_title: 1 })
        .lean();

      return res.json({
        data: result,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/job-title/job-title.service.ts-findList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async update(
    id: string,
    updateJobTitleDto: UpdateJobTitleDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateJobTitleDto,
      );
      const adminData = this.request.user;

      const jobTitleData: any = await this.jobTitleModel
        .findOne({
          job_title: new RegExp('^' + updateJobTitleDto.job_title + '$', 'i'),
          _id: { $ne: ObjectID(id) },
          is_deleted: { $ne: true },
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(jobTitleData)) {
        return res.json({
          success: false,
          message: mConfig.Job_title_exist,
        });
      } else {
        updateJobTitleDto.updatedBy = adminData.name;

        const result: any = await this.jobTitleModel
          .findByIdAndUpdate(id, updateJobTitleDto, { new: true })
          .select({ _id: 1 })
          .lean();
        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }
        //send hidden notification
        await this.commonService.sendAllUserHiddenNotification(
          'job_title_update',
        );
        //create admin log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Job Title',
          description: `${result.job_title} Job Title has been updated successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Job_title_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/job-title/job-title.service.ts-update',
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
        { id },
      );
      const result: any = await this.jobTitleModel
        .findByIdAndUpdate(id, { is_deleted: true }, { new: true })
        .select({ _id: 1, job_title: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //send hidden notification
      await this.commonService.sendAllUserHiddenNotification(
        'job_title_update',
      );
      //create admin log
      const logData = {
        action: 'delete',
        entity_id: result._id,
        entity_name: 'Job Title',
        description: `${result.job_title} Job Title has been deleted successfully.`,
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Job_title_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/job-title/job-title.service.ts-delete',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
