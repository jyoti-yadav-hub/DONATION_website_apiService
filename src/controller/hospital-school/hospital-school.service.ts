import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import {
  HospitalSchool,
  HospitalSchoolDocument,
} from './entities/hospital-school.entity';
import {
  HospitalSchoolData,
  HospitalSchoolDataDocument,
} from '../hospital-school-data/entities/hospital-school-data.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { QueueService } from 'src/common/queue.service';
import { CommonService } from 'src/common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { HospitalSchoolListDto } from './dto/hospital-school-list.dto';
import { authConfig } from 'src/config/auth.config';
import { LogService } from 'src/common/log.service';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../request/entities/cause-request.entity';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class HospitalSchoolService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly queueService: QueueService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(HospitalSchool.name)
    private hospitalSchoolModel: Model<HospitalSchoolDocument>,
    @InjectModel(HospitalSchoolData.name)
    private hospitalSchoolDataModel: Model<HospitalSchoolDataDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
  ) {}

  public async create(body, res: any, createType) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        body,
      );
      const adminData = this.request.user;

      if (createType === 'draft' && _.isEmpty(body.draft_id)) {
        body.is_draft = true;
      } else if (createType === 'main' && !_.isEmpty(body.draft_id)) {
        body['$unset'] = { is_draft: 1 };
      }

      if (
        body.unverified_id &&
        !_.isUndefined(body.unverified_id) &&
        createType === 'main'
      ) {
        await this.hospitalSchoolDataModel
          .findByIdAndDelete(body.unverified_id)
          .lean();
      }

      if (
        body.longitude &&
        !_.isUndefined(body.longitude) &&
        body.latitude &&
        !_.isUndefined(body.latitude) &&
        body.address &&
        !_.isUndefined(body.address)
      ) {
        const coords: any = [Number(body.longitude), Number(body.latitude)];
        body.location = {
          type: 'Point',
          coordinates: coords,
          city: body.address,
        };
      }
      body.createdBy = adminData.name;
      body.updatedBy = adminData.name;

      let result;
      if (!_.isEmpty(body.draft_id)) {
        result = await this.hospitalSchoolModel
          .findByIdAndUpdate(body.draft_id, body, { new: true })
          .select({ _id: 1 })
          .lean();
      } else if (!_.isEmpty(body.unverified_id) && createType === 'draft') {
        result = await this.hospitalSchoolDataModel
          .findByIdAndUpdate(body.unverified_id, body, { new: true })
          .select({ _id: 1 })
          .lean();
      } else {
        const createHospitalSchool = new this.hospitalSchoolModel(body);
        result = await createHospitalSchool.save();
      }

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: result._id,
        entity_name: `${body.type}s`,
        description:
          createType === 'draft'
            ? `${body.type} save as draft successfully.`
            : `${body.type} has been created successfully.`,
      };
      this.logService.createAdminLog(logData);

      return res.json({
        success: true,
        message:
          createType === 'draft'
            ? mConfig.Draft_saved
            : body.type === 'Hospital'
            ? mConfig.Hospital_created
            : mConfig.School_created,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/hospital-school/hospital-school.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findAll(type, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { type };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : 'contains';
        if (!_.isUndefined(filter.name) && filter.name) {
          const query = await this.commonService.filter(
            operator,
            filter.name,
            'name',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.school_college_type) &&
          filter.school_college_type
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.school_college_type,
            'school_college_type',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.types_of_hospital) &&
          filter.types_of_hospital
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.types_of_hospital,
            'types_of_hospital',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.emergency_department) &&
          filter.emergency_department
        ) {
          const query = await this.commonService.filter(
            'boolean',
            filter.emergency_department,
            'emergency_department',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.departments) && filter.departments) {
          const query = await this.commonService.filter(
            operator,
            filter.departments,
            'departments',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.areas_served) && filter.areas_served) {
          const query = await this.commonService.filter(
            operator,
            filter.areas_served,
            'areas_served',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.board) && filter.board) {
          const query = await this.commonService.filter(
            operator,
            filter.board,
            'board',
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
        if (!_.isUndefined(filter.state) && filter.state) {
          const query = await this.commonService.filter(
            operator,
            filter.state,
            'state',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.no_of_teachers) && filter.no_of_teachers) {
          const query = await this.commonService.filter(
            '=',
            filter.no_of_teachers,
            'no_of_teachers',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.no_of_students) && filter.no_of_students) {
          const query = await this.commonService.filter(
            '=',
            filter.no_of_students,
            'no_of_students',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.establishment_year) &&
          filter.establishment_year
        ) {
          const query = await this.commonService.filter(
            '=',
            filter.establishment_year,
            'establishment_year',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.location) && filter.location) {
          const query = await this.commonService.filter(
            operator,
            filter.location,
            'location.city',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.website) && filter.website) {
          const query = await this.commonService.filter(
            operator,
            filter.website,
            'website',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.escalation_contact_name) &&
          filter.escalation_contact_name
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.escalation_contact_name,
            'escalation_contact_name',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.escalation_contact_email) &&
          filter.escalation_contact_email
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.escalation_contact_email,
            'escalation_contact_email',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.escalation_contact_number) &&
          filter.escalation_contact_number
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.escalation_contact_number,
            'escalation_contact_number',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.admission_contact_name) &&
          filter.admission_contact_name
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.admission_contact_name,
            'admission_contact_name',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.admission_contact_email) &&
          filter.admission_contact_email
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.admission_contact_email,
            'admission_contact_email',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.admission_contact_number) &&
          filter.admission_contact_number
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.admission_contact_number,
            'admission_contact_number',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.finance_contact_name) &&
          filter.finance_contact_name
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.finance_contact_name,
            'finance_contact_name',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.finance_contact_email) &&
          filter.finance_contact_email
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.finance_contact_email,
            'finance_contact_email',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.finance_contact_number) &&
          filter.finance_contact_number
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.finance_contact_number,
            'finance_contact_number',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.management) && filter.management) {
          const query = await this.commonService.filter(
            operator,
            filter.management,
            'management',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.hospital_area) && filter.hospital_area) {
          const query = await this.commonService.filter(
            operator,
            filter.hospital_area,
            'hospital_area',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.no_of_beds) && filter.no_of_beds) {
          const query = await this.commonService.filter(
            '=',
            filter.no_of_beds,
            'no_of_beds',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.academic) && filter.academic) {
          const query = await this.commonService.filter(
            operator,
            filter.academic,
            'academic',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.instruction_medium) &&
          filter.instruction_medium
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.instruction_medium,
            'instruction_medium',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.courses_or_diseases) &&
          filter.courses_or_diseases
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.courses_or_diseases,
            'courses_or_diseases',
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
          const str_fields = [
            'name',
            'school_college_type',
            'types_of_hospital',
            'departments',
            'areas_served',
            'board',
            'country',
            'state',
            'location.city',
            'website',
            'escalation_contact_name',
            'admission_contact_name',
            'escalation_contact_email',
            'escalation_contact_number',
            'admission_contact_email',
            'admission_contact_number',
            'finance_contact_name',
            'finance_contact_email',
            'finance_contact_number',
            'management',
            'hospital_area',
            'academic',
            'instruction_medium',
            'courses_or_diseases',
            'createdAt',
            'updatedAt',
            'createdBy',
            'updatedBy',
          ];
          const num_fields = [
            'no_of_teachers',
            'no_of_students',
            'establishment_year',
            'no_of_beds',
          ];
          const bool_fields = ['emergency_department'];
          let stringFilter = await this.commonService.getGlobalFilter(
            str_fields,
            filter.search,
          );
          const numFilter = await this.commonService.getNumberFilter(
            num_fields,
            filter.search,
          );
          const boolFilter = await this.commonService.getBooleanFilter(
            bool_fields,
            filter.search,
          );
          query = stringFilter.concat(numFilter);
          query = query.concat(boolFilter);
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
        types_of_hospital: 'types_of_hospital',
        departments: 'departments',
        emergency_department: 'emergency_department',
        areas_served: 'areas_served',
        country: 'country',
        state: 'state',
        website: 'website',
        location: 'location.city',
        finance_contact_name: 'finance_contact_name',
        finance_contact_number: 'finance_contact_number',
        finance_contact_email: 'finance_contact_email',
        admission_contact_name: 'admission_contact_name',
        admission_contact_number: 'admission_contact_number',
        admission_contact_email: 'admission_contact_email',
        escalation_contact_name: 'escalation_contact_name',
        escalation_contact_number: 'escalation_contact_number',
        escalation_contact_email: 'escalation_contact_email',
        hospital_area: 'hospital_area',
        no_of_beds: 'no_of_beds',
        school_college_type: 'school_college_type',
        board: 'board',
        no_of_teachers: 'no_of_teachers',
        no_of_students: 'no_of_students',
        establishment_year: 'establishment_year',
        management: 'management',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
        academic: 'academic',
        instruction_medium: 'instruction_medium',
        courses_or_diseases: 'courses_or_diseases',
      };
      const total_record = await this.hospitalSchoolModel.countDocuments(match).exec();
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
      const result = await this.hospitalSchoolModel.aggregate(
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
        'src/controller/hospital-school/hospital-school.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async update(id: string, body: any, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        body,
      );
      const adminData = this.request.user;
      if (
        body.longitude &&
        !_.isUndefined(body.longitude) &&
        body.latitude &&
        !_.isUndefined(body.latitude) &&
        body.address &&
        !_.isUndefined(body.address)
      ) {
        const coords: any = [Number(body.longitude), Number(body.latitude)];
        body.location = {
          type: 'Point',
          coordinates: coords,
          city: body.address,
        };
      }
      body.updatedBy = adminData.name;
      const result: any = await this.hospitalSchoolModel
        .findByIdAndUpdate(id, body, { new: true })
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
        entity_name: `${body.type}s`,
        description: `${body.type} has been updated successfully.`,
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message:
          body.type === 'Hospital'
            ? mConfig.Hospital_updated
            : mConfig.School_updated,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/hospital-school/hospital-school.service.ts-update',
        id,
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
      const data: any = await this.hospitalSchoolModel
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
            'form_data.saayam_supported_name': data.name,
          })
          .select({ _id: 1 })
          .exec();
        if (!_.isEmpty(findRequests)) {
          return res.json({
            message: mConfig.Request_created_with_this_data,
            success: false,
          });
        }
        await this.hospitalSchoolModel.deleteOne({ _id: ObjectID(id) }).lean();
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
            data.type === 'Hospital'
              ? mConfig.Hospital_deleted
              : mConfig.School_deleted,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/hospital-school/hospital-school.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async hospitalSchoolList(
    hospitalSchoolListDto: HospitalSchoolListDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        hospitalSchoolListDto,
      );
      const coords: any = [
        Number(hospitalSchoolListDto.long),
        Number(hospitalSchoolListDto.lat),
      ];
      let match;
      if (hospitalSchoolListDto.category === 'education') {
        match = { type: 'School', is_draft: { $exists: false } };
      } else if (hospitalSchoolListDto.category === 'health') {
        match = {
          type: 'Hospital',
          is_draft: { $exists: false },
          courses_or_diseases: hospitalSchoolListDto.courses_or_diseases,
        };
      }

      const getMaxRadius = await this.queueService.getSetting(
        'max-radius-in-kilometer',
      );
      const maxRadiusKm = !_.isEmpty(getMaxRadius)
        ? parseFloat(getMaxRadius)
        : 15;
      // Check and get Donar who didn't have a restaurant
      const data = await this.hospitalSchoolModel.aggregate(
        [
          { $match: match },
          //This is comment because google api key is not working in admin
          // {
          //   $geoNear: {
          //     near: {
          //       type: 'Point',
          //       coordinates: coords,
          //     },
          //     distanceField: 'distance',
          //     maxDistance: maxRadiusKm * 1000,
          //     distanceMultiplier: 0.001,
          //     key: 'location',
          //     query: match,
          //     spherical: true,
          //   },
          // },
          {
            $sort: { name: 1 },
          },
          {
            $project: {
              _id: 1,
              name: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$name', ''] },
                      { $ifNull: ['$location', false] },
                      { $ne: ['$location.city', ''] },
                      { $ne: ['$location.city', null] },
                    ],
                  },
                  { $concat: ['$name', ', ', '$location.city'] },
                  '$name', // Return an empty string if one or both fields are empty
                ],
              },
            },
          },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/hospital-school/hospital-school.service.ts-hospitalSchoolList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
