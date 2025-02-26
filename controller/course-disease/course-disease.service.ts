import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { LogService } from 'src/common/log.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateCourseDiseaseDto } from './dto/create-course-disease.dto';
import { UpdateCourseDiseaseDto } from './dto/update-course-disease.dto';
import {
  CourseDisease,
  CourseDiseaseDocument,
} from './entities/course-disease.entity';
import {
  HospitalSchool,
  HospitalSchoolDocument,
} from '../hospital-school/entities/hospital-school.entity';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../request/entities/cause-request.entity';
import { authConfig } from 'src/config/auth.config';
const ObjectID = require('mongodb').ObjectID;
@Injectable()
export class CourseDiseaseService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(CourseDisease.name)
    private courseDiseaseModel: Model<CourseDiseaseDocument>,
    @InjectModel(HospitalSchool.name)
    private hospitalSchoolModel: Model<HospitalSchoolDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
  ) {}
  //Api for create courses/diseases
  public async create(
    createCourseDiseaseDto: CreateCourseDiseaseDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createCourseDiseaseDto,
      );
      const adminData = this.request.user;
      const courseDiseaseData = await this.courseDiseaseModel
        .findOne({
          name: new RegExp('^' + createCourseDiseaseDto.name + '$', 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(courseDiseaseData)) {
        return res.json({
          success: false,
          message:
            createCourseDiseaseDto.type === 'Course'
              ? mConfig.Course_already_exists
              : mConfig.Disease_already_exists,
        });
      } else {
        createCourseDiseaseDto.createdBy = adminData.name;
        createCourseDiseaseDto.updatedBy = adminData.name;
        const createCourseDisease = new this.courseDiseaseModel(
          createCourseDiseaseDto,
        );
        const result = await createCourseDisease.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: `${createCourseDiseaseDto.type}s`,
          description: `${createCourseDiseaseDto.type} has been created successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message:
            createCourseDiseaseDto.type === 'Course'
              ? mConfig.Course_created
              : mConfig.Disease_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/course-disease/course-disease.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list courses in admin
  public async findAll(type, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { type };
      const filter = !_.isEmpty(param) ? param : [];
      //Handle mongo match object
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
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
            'name',
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
        name: 'name',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.courseDiseaseModel
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

      const result = await this.courseDiseaseModel.aggregate(
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
        'src/controller/course-disease/course-disease.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update courses/diseases
  public async update(
    id: string,
    updateCourseDiseaseDto: UpdateCourseDiseaseDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateCourseDiseaseDto,
      );
      const adminData = this.request.user;
      const courseDiseaseData = await this.courseDiseaseModel
        .findOne({
          name: new RegExp('^' + updateCourseDiseaseDto.name + '$', 'i'),
        })
        .select({ _id: 1, type: 1 })
        .lean();
      if (
        !_.isEmpty(courseDiseaseData) &&
        courseDiseaseData._id.toString() !== id
      ) {
        return res.json({
          success: false,
          message:
            courseDiseaseData.type === 'Course'
              ? mConfig.Course_already_exists
              : mConfig.Disease_already_exists,
        });
      } else {
        updateCourseDiseaseDto.updatedBy = adminData.name;
        const result = await this.courseDiseaseModel
          .findByIdAndUpdate(id, updateCourseDiseaseDto, { new: true })
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
          entity_name: `${updateCourseDiseaseDto.type}s`,
          description: `${updateCourseDiseaseDto.type} has been updated successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message:
            updateCourseDiseaseDto.type === 'Course'
              ? mConfig.Course_updated
              : mConfig.Disease_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/course-disease/course-disease.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete courses/diseases
  public async remove(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const data = await this.courseDiseaseModel
        .findOne({ _id: ObjectID(id) })
        .select({ _id: 1, name: 1, type: 1 })
        .lean();
      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const findRequests = await this.causeRequestModel
          .find({
            category_slug: { $ne: 'hunger' },
            status: { $ne: 'complete' },
            is_deleted: { $ne: true },
            'form_data.specify_name': data.name,
          })
          .select({ _id: 1 })
          .exec();
        if (!_.isEmpty(findRequests)) {
          return res.json({
            message: mConfig.Request_created_with_this_data,
            success: false,
          });
        }
        await this.courseDiseaseModel.deleteOne({ _id: ObjectID(id) }).lean();

        // Add Activity Log
        const logData = {
          action: 'delete',
          entity_id: data._id,
          entity_name: `${data.type}s`,
          description: `${data.type} has been deleted successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message:
            data.type === 'Course'
              ? mConfig.Course_deleted
              : mConfig.Disease_deleted,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/course-disease/course-disease.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list diseases in dynamic form
  public async courseDiseaseList(category, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        category,
      );
      let query = {};
      // Initialize a query object based on the 'category' variable
      if (category === 'education') {
        query = { type: 'Course' };
      } else if (category === 'health') {
        query = { type: 'Disease' };
      }

      const result = await this.courseDiseaseModel
        .find(query)
        .collation(authConfig.collation)
        .select({ name: 1 })
        .sort({ name: 1 })
        .lean();
      const data = [];
      if (result && !_.isEmpty(result)) {
        result.map(function (e) {
          data.push(e.name);
        });
      }
      data.push('Other');
      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/course-disease/course-disease.service.ts-courseDiseaseList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list hospital and school in admin
  public async findSchoolCourses(schoolId: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        schoolId,
      );
      //Handle mongo query
      const query = {
        _id: ObjectID(schoolId),
        type: 'School',
      };

      const result = await this.hospitalSchoolModel
        .findOne(query, { courses_or_diseases: 1 })
        .select({ courses_or_diseases: 1 })
        .collation(authConfig.collation)
        .lean();

      let data = [];
      if (!_.isEmpty(result) && !_.isEmpty(result.courses_or_diseases)) {
        data = result.courses_or_diseases.sort();
      }
      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/course-disease/course-disease.service.ts-findSchoolCourses',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
