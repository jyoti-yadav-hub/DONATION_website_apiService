import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { Region, RegionDocument } from './entities/region.entity';
import {
  CurrencyModel,
  CurrencyDocument,
} from './../currency/entities/currency.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { _ } from 'lodash';
import { authConfig } from 'src/config/auth.config';
import { LogService } from 'src/common/log.service';
@Injectable()
export class RegionService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Region.name) private regionModel: Model<RegionDocument>,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
  ) {}
  public async create(createRegionDto: CreateRegionDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createRegionDto,
      );
      const adminData = this.request.user;

      const regionData = await this.regionModel
        .findOne({
          region: new RegExp('^' + createRegionDto.region + '$', 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(regionData)) {
        return res.json({
          success: false,
          message: mConfig.Region_already_exists,
        });
      } else {
        createRegionDto.createdBy = adminData.name;
        createRegionDto.updatedBy = adminData.name;
        const createRegion = new this.regionModel(createRegionDto);
        const result = await createRegion.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Regions',
          description: 'Region has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.Region_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/region/region.service.ts-createRegion',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findAll(param, res: any): Promise<Region[]> {
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
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.region) && filter.region) {
          const query = await this.commonService.filter(
            operator,
            filter.region,
            'region',
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
            'region',
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
        region: 'region',
        status: 'status',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.regionModel.countDocuments(match).exec();
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
      const result = await this.regionModel.aggregate(
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
        'src/controller/region/region.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findList(param, res: any): Promise<Region[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const data = await this.regionModel
        .find({ status: 'Active' })
        .collation(authConfig.collation)
        .sort({ region: 1 })
        .select({ region: 1 })
        .lean();

      return res.json({
        data,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/region/region.service.ts-findList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async update(
    id: string,
    updateRegionDto: UpdateRegionDto,
    res: any,
  ): Promise<UpdateRegionDto> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateRegionDto,
      );
      const adminData = this.request.user;

      const regionData: any = await this.regionModel
        .findOne({
          region: new RegExp('^' + updateRegionDto.region + '$', 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(regionData) && regionData._id.toString() !== id) {
        return res.json({
          success: false,
          message: mConfig.Region_already_exists,
        });
      } else {
        updateRegionDto.updatedBy = adminData.name;

        const result: any = await this.regionModel
          .findByIdAndUpdate(id, updateRegionDto, { new: true })
          .select({ _id: 1 })
          .lean();
        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }
        await this.commonService.sendAllUserHiddenNotification('region_update');

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Regions',
          description: 'Region has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Region_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/region/region.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async delete(id: string, res: any): Promise<Region> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const region: any = await this.regionModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!region) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      await this.commonService.sendAllUserHiddenNotification('region_update');

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: region._id,
        entity_name: 'Regions',
        description: 'Region has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Region_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/region/region.service.ts-deleteRegion',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findCountries(body, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        body,
      );
      const region = body.region;
      const data = await this.currencyModel.aggregate([
        { $match: { region: { $in: region } } },
        {
          $group: {
            _id: '$region',
            items: {
              $addToSet: {
                name: '$country',
                country_code: '$country_code',
                group: '$group',
              },
            },
          },
        },
        {
          $unwind: {
            path: '$items',
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { 'items.name': 1 } },
        {
          $group: {
            _id: '$_id',
            items: {
              $push: '$items',
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return res.json({
        data,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/region/region.service.ts-findCountries',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
