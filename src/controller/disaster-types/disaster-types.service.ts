import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from 'src/config/auth.config';
import { LogService } from 'src/common/log.service';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateDisasterTypeDto } from './dto/create-disaster-type.dto';
import { UpdateDisasterTypeDto } from './dto/update-disaster-type.dto';
import {
  DisasterType,
  DisasterTypeDocument,
} from './entities/disaster-type.entity';

@Injectable()
export class DisasterTypesService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(DisasterType.name)
    private disasterTypeModel: Model<DisasterTypeDocument>,
  ) {}

  //API for create disaster relief type
  public async create(createDisasterTypeDto: CreateDisasterTypeDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createDisasterTypeDto,
      );
      const adminData = this.request.user;

      const disasterTypeData = await this.disasterTypeModel
        .findOne({
          disaster_type: new RegExp(
            '^' + createDisasterTypeDto.disaster_type + '$',
            'i',
          ),
          is_deleted: { $ne: true },
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(disasterTypeData)) {
        return res.json({
          success: false,
          message: mConfig.Disaster_type_already_exists,
        });
      } else {
        createDisasterTypeDto.createdBy = adminData.name;
        createDisasterTypeDto.updatedBy = adminData.name;
        const createDisasterType = new this.disasterTypeModel(
          createDisasterTypeDto,
        );
        const result = await createDisasterType.save();

        //send hidden notification to all user
        await this.commonService.sendAllUserHiddenNotification(
          'disaster_type_update',
        );

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Disaster Types',
          description: 'Disaster type has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.Disaster_type_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/disaster-type/disaster-type.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //API for list disaster relief type
  public async findAll(param, res: any): Promise<DisasterTypeDocument[]> {
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
        if (!_.isUndefined(filter.disaster_type) && filter.disaster_type) {
          const query = await this.commonService.filter(
            operator,
            filter.disaster_type,
            'disaster_type',
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
            'disaster_type',
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
        disaster_type: 'disaster_type',
        status: 'status',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.disasterTypeModel
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
      const result = await this.disasterTypeModel.aggregate(
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
        'src/controller/disaster-type/disaster-type.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //API for update disaster relief type
  public async update(
    id: string,
    updateDisasterTypeDto: UpdateDisasterTypeDto,
    res: any,
  ): Promise<DisasterTypeDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateDisasterTypeDto,
      );
      const adminData = this.request.user;

      const disasterTypeData: any = await this.disasterTypeModel
        .findOne({
          disaster_type: new RegExp(
            '^' + updateDisasterTypeDto.disaster_type + '$',
            'i',
          ),
          is_deleted: { $ne: true },
        })
        .select({ _id: 1 })
        .lean();

      if (
        !_.isEmpty(disasterTypeData) &&
        disasterTypeData._id.toString() !== id
      ) {
        return res.json({
          success: false,
          message: mConfig.Disaster_type_already_exists,
        });
      } else {
        updateDisasterTypeDto.updatedBy = adminData.name;
        const result: any = await this.disasterTypeModel
          .findByIdAndUpdate(id, updateDisasterTypeDto, { new: true })
          .select({ _id: 1 })
          .lean();
        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }

        //send hidden notification to all user
        await this.commonService.sendAllUserHiddenNotification(
          'disaster_type_update',
        );

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Disaster Types',
          description: 'Disaster type has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Disaster_type_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/disaster-type/disaster-type.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //API for delete disaster relief type
  public async remove(id: string, res: any): Promise<DisasterTypeDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const disasterType: any = await this.disasterTypeModel
        .findByIdAndUpdate(id, { is_deleted: true })
        .select({ _id: 1 })
        .lean();
      if (!disasterType) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      //send hidden notification to all user
      await this.commonService.sendAllUserHiddenNotification(
        'disaster_type_update',
      );

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: disasterType._id,
        entity_name: 'Disaster Types',
        description: 'Disaster type has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Disaster_type_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/disaster-type/disaster-type.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //API for list disaster relief type
  public async list(param, res: any): Promise<DisasterTypeDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );

      const result = await this.disasterTypeModel.aggregate(
        [
          {
            $match: {
              status: 'Active',
              is_deleted: { $ne: true },
            },
          },
          {
            $project: {
              _id: 1,
              name: '$disaster_type',
            },
          },
          { $sort: { name: 1 } },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        data: result,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/disaster-type/disaster-type.service.ts-list',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
