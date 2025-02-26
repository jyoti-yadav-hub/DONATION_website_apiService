/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateCmDto } from './dto/create-cm.dto';
import { UpdateCmDto } from './dto/update-cm.dto';
import { Cms, CmsDocument } from './entities/cm.entity';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { authConfig } from '../../config/auth.config';
import { LogService } from '../../common/log.service';

@Injectable()
export class CmsService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly logService: LogService,
    @InjectModel(Cms.name) private cmsModel: Model<CmsDocument>,
  ) {}

  //Api for create cms
  public async createCms(createCmDto: CreateCmDto, res: any): Promise<Cms> {
    try {
      // Create an API log entry to record the incoming request and the data being post
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        createCmDto,
      );
      const cmsData = await this.cmsModel
        .findOne({ title: new RegExp('^' + createCmDto.title + '$', 'i') })
        .select({ _id: 1 })
        .lean();
      //Check if not exist then send response
      if (!_.isEmpty(cmsData)) {
        return res.json({
          success: false,
          message: mConfig.CMS_already_exists,
        });
      } else {
        const createCms = new this.cmsModel(createCmDto);
        const cms = await createCms.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: cms._id,
          entity_name: 'Cms',
          description: 'Cms has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.CMS_created,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/cms/cms.service.ts-createCms',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for cms list
  public async findAll(param, res: any): Promise<Cms[]> {
    try {
      // Create an API log entry to record the incoming request and the data being get
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      //Check if filter is not empty then manage mongoes query
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        //Add filter buy title
        if (!_.isUndefined(filter.title) && filter.title) {
          const query = await this.commonService.filter(
            operator,
            filter.title,
            'title',
          );
          where.push(query);
        }
        //Add filter buy slug
        if (!_.isUndefined(filter.slug) && filter.slug) {
          const query = await this.commonService.filter(
            operator,
            filter.slug,
            'slug',
          );
          where.push(query);
        }
        //Add filter buy description
        if (!_.isUndefined(filter.description) && filter.description) {
          const query = await this.commonService.filter(
            operator,
            filter.description,
            'description',
          );
          where.push(query);
        }
        //Add filter buy status
        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            'is',
            filter.status,
            'status',
          );
          where.push(query);
        }
        //Add filter buy screen name
        if (!_.isUndefined(filter.screen_name) && filter.screen_name) {
          const query = await this.commonService.filter(
            operator,
            filter.screen_name,
            'screen_name',
          );
          where.push(query);
        }
        //Add filter buy usage
        if (!_.isUndefined(filter.usage) && filter.usage) {
          const query = await this.commonService.filter(
            operator,
            filter.usage,
            'usage',
          );
          where.push(query);
        }
        //Add filter buy createdAt
        if (!_.isUndefined(filter.createdAt) && filter.createdAt) {
          const query = await this.commonService.filter(
            'date',
            filter.createdAt,
            'createdAt',
          );
          where.push(query);
        }
        //Add global serch filter
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'title',
            'slug',
            'description',
            'status',
            'screen_name',
            'usage',
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
        title: 'title',
        slug: 'slug',
        description: 'description',
        status: 'status',
        createdAt: 'createdAt',
        screen_name: 'screen_name',
        usage: 'usage',
      };
      const total_record = await this.cmsModel.countDocuments(match).exec();
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
      const result = await this.cmsModel.aggregate(
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
        'src/controller/cms/cms.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update cms
  public async updateCms(
    id: string,
    updateCmDto: UpdateCmDto,
    res: any,
  ): Promise<Cms> {
    try {
      // Create an API log entry to record the incoming request and the data being put
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateCmDto,
      );
      const cmsData = await this.cmsModel
        .findOne({ title: new RegExp('^' + updateCmDto.title + '$', 'i') })
        .select({ _id: 1 })
        .lean();
      //Check if cms data id is exist then fire query
      if (!_.isEmpty(cmsData) && cmsData._id.toString() !== id) {
        return res.json({
          success: false,
          message: mConfig.CMS_already_exists,
        });
      } else {
        const result = await this.cmsModel
          .findByIdAndUpdate(id, updateCmDto, { new: true })
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
          entity_name: 'Cms',
          description: 'Cms has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.CMS_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/cms/cms.service.ts-updateCms',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete cms
  public async deleteCms(id: string, res: any): Promise<Cms> {
    try {
      // Create an API log entry to record the incoming request and the data being deleted
      this.errorlogService.createApiLog(this.request.originalUrl, 'delete', {
        id,
      });
      const cms = await this.cmsModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!cms) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: cms._id,
        entity_name: 'Cms',
        description: 'Cms has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.CMS_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/cms/cms.service.ts-deleteCms',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get cms page from given slug
  public async getPage(slug: string, res: any): Promise<Cms> {
    try {
      // Create an API log entry to record the incoming request and the data being get
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', {
        slug,
      });
      //get cms doc data by specific slug
      const cms = await this.cmsModel
        .findOne({ slug: slug, status: 'Active' })
        .lean();
      if (!cms) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      res.json({
        success: true,
        data: cms,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/cms/cms.service.ts-getPage',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
