import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateDriveTypeDto } from './dto/create-drive-type.dto';
import { UpdateDriveTypeDto } from './dto/update-drive-type.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { DriveType, DriveTypeDocument } from './entities/drive-type.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { _ } from 'lodash';
import { authConfig } from 'src/config/auth.config';
import { REQUEST } from '@nestjs/core';
import { LogService } from 'src/common/log.service';

@Injectable()
export class DriveTypeService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(DriveType.name)
    private driveTypeModel: Model<DriveTypeDocument>,
  ) {}

  //Api for create drive type
  public async create(createDriveTypeDto: CreateDriveTypeDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createDriveTypeDto,
      );
      const adminData = this.request.user;

      const driveTypeData = await this.driveTypeModel
        .findOne({
          drive_type: new RegExp(
            '^' + createDriveTypeDto.drive_type + '$',
            'i',
          ),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(driveTypeData)) {
        return res.json({
          success: false,
          message: mConfig.Drive_Type_already_exists,
        });
      } else {
        createDriveTypeDto.createdBy = adminData.name;
        createDriveTypeDto.updatedBy = adminData.name;
        const createDriveType = new this.driveTypeModel(createDriveTypeDto);
        const result = await createDriveType.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Drive Types',
          description: 'Drive type has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.Drive_Type_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive-type/drive-type.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get drive type for admin
  public async findAll(param, res: any): Promise<DriveType[]> {
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
        if (!_.isUndefined(filter.drive_type) && filter.drive_type) {
          const query = await this.commonService.filter(
            operator,
            filter.drive_type,
            'drive_type',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            operator,
            filter.status,
            'status',
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
            'contains',
            filter.createdBy,
            'createdBy',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.updatedBy) && filter.updatedBy) {
          const query = await this.commonService.filter(
            'contains',
            filter.updatedBy,
            'updatedBy',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'drive_type',
            'status',
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
        drive_type: 'drive_type',
        status: 'status',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.driveTypeModel.countDocuments(match).exec();
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
      const result = await this.driveTypeModel.aggregate(
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
        'src/controller/drive-type/drive-type.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for fetch drive type
  public async list(param, res: any): Promise<DriveType[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const result = await this.driveTypeModel
        .aggregate(
          [
            { $match: { is_deleted: { $ne: true }, status: 'Active' } },
            {
              $project: {
                _id: 1,
                name: '$drive_type',
                sort: {
                  $cond: {
                    if: {
                      $eq: ['$drive_type', 'Other'],
                    },
                    then: 2,
                    else: 1,
                  },
                },
              },
            },
            {
              $sort: {
                sort: 1,
                name: 1,
              },
            },
          ],
          { collation: authConfig.collation },
        )
        .exec();

      return res.json({
        data: result,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive-type/drive-type.service.ts-list',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update drive type
  public async update(
    id: string,
    updateDriveTypeDto: UpdateDriveTypeDto,
    res: any,
  ): Promise<UpdateDriveTypeDto> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateDriveTypeDto,
      );
      const adminData = this.request.user;

      const driveTypeData: any = await this.driveTypeModel
        .findOne({
          drive_type: new RegExp(
            '^' + updateDriveTypeDto.drive_type + '$',
            'i',
          ),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(driveTypeData) && driveTypeData._id.toString() !== id) {
        return res.json({
          success: false,
          message: mConfig.Drive_Type_already_exists,
        });
      } else {
        updateDriveTypeDto.updatedBy = adminData.name;
        const result: any = await this.driveTypeModel
          .findByIdAndUpdate(id, updateDriveTypeDto, { new: true })
          .select({ _id: 1 })
          .lean();
        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }
        await this.commonService.sendAllUserHiddenNotification(
          'drive_type_updated',
        );

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Drive Types',
          description: 'Drive type has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Drive_Type_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive-type/drive-type.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for remove drive type
  public async remove(id: string, res: any): Promise<DriveType> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const driveType: any = await this.driveTypeModel
        .findByIdAndUpdate(id, { is_deleted: true, deletedAt: new Date() })
        .select({ _id: 1 })
        .lean();
      if (!driveType) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      await this.commonService.sendAllUserHiddenNotification(
        'drive_type_deleted',
      );

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: driveType._id,
        entity_name: 'Drive Types',
        description: 'Drive type has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Drive_Type_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive-type/drive-type.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
