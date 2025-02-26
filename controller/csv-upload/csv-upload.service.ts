/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
// import { CreateFooterStripDto } from './dto/create-footer-strip.dto';
// import { UpdateFooterStripDto } from './dto/update-footer-strip.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import {
  CsvUploadModel,
  CsvUploadDocument,
} from './entities/csv-upload.entity';
import {
  HospitalSchool,
  HospitalSchoolDocument,
} from '../hospital-school/entities/hospital-school.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import fs, { createWriteStream } from 'fs';
import ip from 'ip';
import { async } from 'rxjs';
import moment from 'moment';
import { authConfig } from '../../config/auth.config';
import { LogService } from 'src/common/log.service';

const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class CsvUploadService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(CsvUploadModel.name)
    private csvUploadModel: Model<CsvUploadDocument>,
    @InjectModel(HospitalSchool.name)
    private hospitalSchoolModel: Model<HospitalSchoolDocument>,
  ) {}

  //Api for add csv file
  public async uploadCsv(type, file, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { type, file },
      );
      if (_.isEmpty(type)) {
        return res.json({
          success: false,
          message: mConfig.Params_are_missing,
        });
      }
      const adminData = this.request.user;
      //Get stored file name
      const csvId: any = await this.commonService.uploadCsv(file);
      if (csvId && csvId.error) {
        return res.json({
          message: csvId.error,
          success: false,
        });
      } else {
        const body = {
          type: type,
          file_name: csvId.file_name,
          status: 'Pending',
          uploadedBy: adminData.name,
        };
        const createHospitalSchool = new this.csvUploadModel(body);
        const result = await createHospitalSchool.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'CSV Files',
          description: 'CSV File has been uploaded successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.CSV_uploaded,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/csv-upload/csv-upload.service.ts-uploadCsv',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async importCsv(res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const result = await this.csvUploadModel
        .find({
          imported: { $ne: true },
          type: { $in: ['school', 'hospital'] },
        })
        .limit(1);

      const csv = require('csvtojson');
      if (!_.isEmpty(result)) {
        const commonService = this.commonService;
        const _hospitalSchoolModel = this.hospitalSchoolModel;
        // Process each doc CSV file in parallel
        await Promise.all(
          result.map(async (file: any) => {
            const file_name = file.file_name;
            const filepath = __dirname + `/../../../uploads/csv/${file_name}`;
            const jsonArray = await csv().fromFile(filepath);

            const failedRows = [];
            if (!_.isEmpty(jsonArray)) {
              let rows = 2;
              let addData = [];
              // Process each row in the JSON array
              for (let i = 0; i < jsonArray.length; i++) {
                addData = [];
                const data = jsonArray[i];
                // Process each key-value pair in the row
                await Promise.all(
                  Object.keys(data).map(async function (key) {
                    let val = data[key];
                    if (
                      key === 'areas_served' ||
                      key === 'courses_or_diseases' ||
                      key === 'departments'
                    ) {
                      val = data[key].split(',');
                    } else if (key === 'address' && data[key] != '') {
                      //Get address object
                      const latLongaddress =
                        await commonService.getLatLongFromAddress(data[key]);
                      val = {
                        type: 'Point',
                        coordinates: [
                          latLongaddress['longitude'],
                          latLongaddress['latitude'],
                        ],
                        city: latLongaddress['address'],
                      };
                      key = 'location';
                    } else if (key === 'emergency_department') {
                      val = data[key].toLowerCase() == 'yes' ? true : false;
                    }

                    addData[key] = val;
                  }),
                );
                addData['type'] = 'Hospital';
                addData['createdBy'] = file.uploadedBy;
                addData['updatedBy'] = file.uploadedBy;

                try {
                  const createHospitalSchool = new _hospitalSchoolModel(
                    addData,
                  );
                  const result = await createHospitalSchool.save();

                  //Add Activity Log
                  const logData = {
                    action: 'create',
                    entity_id: result._id,
                    entity_name: 'CSV Files',
                    description: 'CSV File has been imported successfully.',
                  };
                  this.logService.createAdminLog(logData);
                } catch (error) {
                  failedRows.push(rows);
                }
                rows++;
              }

              let body;
              body['failed_rows'] = failedRows;
              body['imported'] = true;
              body['status'] = 'Success';
              const result = await this.csvUploadModel
                .findByIdAndUpdate(file._id, body, { new: true })
                .select({ _id: 1 })
                .lean();
            }
          }),
        );
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/csv-upload/csv-upload.service.ts-importCsv',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete csv file
  public async removeCsvFile(id: string, res: any): Promise<CsvUploadDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const data = await this.csvUploadModel
        .findByIdAndDelete(id)
        .select({ _id: 1, file_name: 1 })
        .lean();
      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //Check file_name key does not undefined and not empty string
      if (data.file_name && !_.isEmpty(data.file_name)) {
        //Remove file
        await this.commonService.unlinkFileFunction('csv', data.file_name);
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: data._id,
        entity_name: 'CSV Files',
        description: 'CSV File has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        success: true,
        message: mConfig.CSV_deleted,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/csv-upload/csv-upload.service.ts-removeCsvFile',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list csv files
  public async findAll(param, res: any): Promise<HospitalSchoolDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { type: { $in: ['school', 'hospital'] } };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.file_name) && filter.file_name) {
          const query = await this.commonService.filter(
            operator,
            filter.file_name,
            'file_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.type) && filter.type) {
          const query = await this.commonService.filter(
            operator,
            filter.type,
            'type',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            'is',
            filter.status,
            'status',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.failed_rows) && filter.failed_rows) {
          const query = await this.commonService.filter(
            '=',
            filter.failed_rows,
            'failed_rows ',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.uploadedBy) && filter.uploadedBy) {
          const query = await this.commonService.filter(
            operator,
            filter.uploadedBy,
            'uploadedBy',
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

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'file_name',
            'status',
            'type',
            'uploadedBy',
            'createdAt',
            'updatedAt',
          ];
          const field = ['failed_rows'];
          const stringFilter = await this.commonService.getGlobalFilter(
            fields,
            filter.search,
          );
          const numFilter = await this.commonService.getNumberFilter(
            field,
            filter.search,
          );
          query = stringFilter.concat(numFilter);
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
        file_name: 'file_name',
        status: 'status',
        type: 'type',
        uploadedBy: 'uploadedBy',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      };
      const total_record = await this.csvUploadModel
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

      const result = await this.csvUploadModel.aggregate([
        {
          $addFields: {
            failed_rows: {
              $size: { $ifNull: ['$failed_rows', []] },
            },
          },
        },
        { $match: match },
        {
          $project: {
            _id: 1,
            uploadedBy: 1,
            status: 1,
            file_name: 1,
            type: 1,
            createdAt: 1,
            updatedAt: 1,
            csv_file_url: {
              $concat: [authConfig.uploadsFolderUrl, 'csv/', '$file_name'],
            },
            failed_rows: 1,
          },
        },
        { $sort: sort },
        { $skip: start_from },
        { $limit: per_page },
      ]);

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
        'src/controller/csv-upload/csv-upload.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list csv files
  public async failedRows(
    id,
    param,
    res: any,
  ): Promise<HospitalSchoolDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { _id: ObjectID(id) };
      const filter = !_.isEmpty(param) ? param : [];

      const sortData = {
        _id: '_id',
        row: 'row',
        message: 'message',
      };
      //Get total count of filtered docs
      const total = await this.csvUploadModel
        .aggregate([
          { $match: match },
          { $project: { count: { $size: '$failed_rows' } } },
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

      const result = await this.csvUploadModel.aggregate([
        { $match: match },
        { $unwind: '$failed_rows' },
        {
          $project: {
            row: '$failed_rows.row',
            message: '$failed_rows.message',
          },
        },
        { $sort: sort },
        { $skip: start_from },
        { $limit: per_page },
      ]);

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
        'src/controller/csv-upload/csv-upload.service.ts-failedRows',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
