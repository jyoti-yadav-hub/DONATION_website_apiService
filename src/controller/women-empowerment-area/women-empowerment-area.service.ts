import { Inject, Injectable } from '@nestjs/common';
import { CreateWomenEmpowermentAreaDto } from './dto/create-women-empowerment-area.dto';
import { UpdateWomenEmpowermentAreaDto } from './dto/update-women-empowerment-area.dto';
import { ErrorlogService } from '../error-log/error-log.service';
import mConfig from '../../config/message.config.json';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import {
  WomenEmpowermentArea,
  WomenEmpowermentAreaDocument,
} from './entities/women-empowerment-area.entity';
import { Model } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { _ } from 'lodash';
import { LogService } from 'src/common/log.service';

const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class WomenEmpowermentAreaService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(WomenEmpowermentArea.name)
    private womenEmpowermentAreaModel: Model<WomenEmpowermentAreaDocument>,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
  ) {}

  /*
   *Api for create women empowerment type :women-empowerment-area/create
   */
  async create(
    createWomenEmpowermentAreaDto: CreateWomenEmpowermentAreaDto,
    res: any,
  ): Promise<WomenEmpowermentAreaDocument> {
    try {
      const adminData = this.request.user;
      let final = {
        createdBy: adminData.name,
        updatedBy: adminData.name,
        ...createWomenEmpowermentAreaDto,
      };
      let area = await this.womenEmpowermentAreaModel.create(final);

      //send hidden notification to all user
      await this.commonService.sendAllUserHiddenNotification(
        'women_empowerment_area_update',
      );

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: area._id,
        entity_name: 'women_empowerment_area',
        description: 'women_empowerment_area has been created successfully.',
      };
      this.logService.createAdminLog(logData);
      let finalMsg = await this.commonService.changeString(
        mConfig.women_empowerment_area_action,
        {
          '{{action}}': 'created',
        },
      );
      return res.json({
        message: finalMsg,
        success: true,
      });
    } catch (error) {
      let errMsg =
        error.code === 11000
          ? mConfig.women_empowerment_area_exist
          : mConfig.Something_went_wrong;
      this.errorlogService.errorLog(
        error,
        'src/controller/women-empowerment-area/women-empowerment-area.service.ts-create',
      );
      return res.json({
        success: false,
        message: errMsg,
      });
    }
  }

  /*
   *Api for create women empowerment type :women-empowerment-area/list
   */
  async findAll(param, res: any): Promise<WomenEmpowermentAreaDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { is_deleted: false };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        if (!_.isUndefined(filter.area) && filter.area) {
          const query = await this.commonService.filter(
            'contains',
            filter.area,
            'area',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            'contains',
            filter.status,
            'status',
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
          const fields = ['area', 'status', '_id', 'createdBy', 'updatedBy'];
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
        area: 'area',
        status: 'status',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.womenEmpowermentAreaModel.countDocuments(
        match,
      );
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
      const data = await this.womenEmpowermentAreaModel
        .find(match)
        .sort(sort)
        .skip(start_from)
        .limit(per_page)
        .lean();
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
        'src/controller/women-empowerment-area/women-empowerment-area.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  /*
   *Api for create women empowerment type :women-empowerment-area/update/:id
   */
  async update(
    id: string,
    updateWomenEmpowermentAreaDto: UpdateWomenEmpowermentAreaDto,
    res: any,
  ): Promise<WomenEmpowermentAreaDocument> {
    try {
      let doc = await this.womenEmpowermentAreaModel.findById(id);
      if (!doc) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      const adminData = this.request.user;
      await this.womenEmpowermentAreaModel.findByIdAndUpdate(id, {
        updatedBy: adminData.name,
        ...updateWomenEmpowermentAreaDto,
      });

      //send hidden notification to all user
      await this.commonService.sendAllUserHiddenNotification(
        'women_empowerment_area_update',
      );

      //Add Activity Log
      const logData = {
        action: 'update',
        entity_id: ObjectID(id),
        entity_name: 'women_empowerment_area',
        description: 'women_empowerment_area has been updated successfully.',
      };
      this.logService.createAdminLog(logData);
      let finalMsg = await this.commonService.changeString(
        mConfig.women_empowerment_area_action,
        {
          '{{action}}': 'updated',
        },
      );
      return res.json({
        message: finalMsg,
        success: true,
      });
    } catch (error) {
      let errMsg =
        error.code === 11000
          ? mConfig.women_empowerment_area_exist
          : mConfig.Something_went_wrong;
      this.errorlogService.errorLog(
        error,
        'src/controller/women-empowerment-area/women-empowerment-area.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  /*
   *Api for create women empowerment type :women-empowerment-area/delete/:id
   */
  async remove(id: string, res: any): Promise<WomenEmpowermentAreaDocument> {
    try {
      let doc = await this.womenEmpowermentAreaModel.findById(id);
      if (!doc) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      const adminData = this.request.user;
      await this.womenEmpowermentAreaModel.findByIdAndUpdate(id, {
        updatedBy: adminData.name,
        is_deleted: true,
        deletedAt: new Date(),
      });

      //send hidden notification to all user
      await this.commonService.sendAllUserHiddenNotification(
        'women_empowerment_area_update',
      );
      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: ObjectID(id),
        entity_name: 'women_empowerment_area',
        description: 'women_empowerment_area has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);
      let finalMsg = await this.commonService.changeString(
        mConfig.women_empowerment_area_action,
        {
          '{{action}}': 'deleted',
        },
      );
      return res.json({
        message: finalMsg,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/women-empowerment-area/women-empowerment-area.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  /*
   *Api for create women empowerment type :women-empowerment-area/user/list
   */
  async findAllData(param, res: any): Promise<WomenEmpowermentAreaDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { is_deleted: false };
      const data = await this.womenEmpowermentAreaModel
        .find(match)
        .select({ _id: 1, area: 1, sub_area: 1 })
        .lean();
      return res.json({
        success: true,
        data: data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/women-empowerment-area/women-empowerment-area.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
