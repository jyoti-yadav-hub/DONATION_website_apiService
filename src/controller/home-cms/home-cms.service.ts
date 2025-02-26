import _ from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from '../../config/auth.config';
import mConfig from '../../config/message.config.json';
import { CreateHomeCmDto } from './dto/create-home-cm.dto';
import { UpdateHomeCmDto } from './dto/update-home-cm.dto';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { HomeCm, HomeCmDocuments } from './entities/home-cm.entity';
import { LogService } from '../../common/log.service';

@Injectable()
export class HomeCmsService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly logService: LogService,
    @InjectModel(HomeCm.name) private homeCmModel: Model<HomeCmDocuments>,
  ) {}

  //Api for create homepage cms page
  public async create(
    createHomeCmDto: CreateHomeCmDto,
    res: any,
  ): Promise<HomeCm> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createHomeCmDto,
      );
      await this.commonService.uploadFileOnS3(createHomeCmDto.image, 'cms');

      const createCms = new this.homeCmModel(createHomeCmDto);
      const cmsData = await createCms.save();

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: cmsData._id,
        entity_name: 'Home Cms',
        description: 'Home Cms has been created successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Home_CMS_created,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/home-cms/home-cms.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list homepage cms pages for Admin
  public async findAll(param, res: any): Promise<HomeCm[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.title) && filter.title) {
          const query = await this.commonService.filter(
            operator,
            filter.title,
            'title',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.slug) && filter.slug) {
          const query = await this.commonService.filter(
            operator,
            filter.slug,
            'slug',
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
        if (!_.isUndefined(filter.description) && filter.description) {
          const query = await this.commonService.filter(
            operator,
            filter.description,
            'description',
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
        if (!_.isUndefined(filter.index) && filter.index) {
          const query = await this.commonService.filter(
            '=',
            filter.index,
            'index',
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
          const fields = [
            'title',
            'slug',
            'type',
            'description',
            'status',
            'createdAt',
          ];
          const field = ['index'];
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
        title: 'title',
        slug: 'slug',
        type: 'type',
        description: 'description',
        status: 'status',
        index: 'index',
        createdAt: 'createdAt',
      };
      const total_record = await this.homeCmModel.countDocuments(match).exec();
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
      const result = await this.homeCmModel.aggregate(
        [
          { $match: match },
          {
            $project: {
              _id: 1,
              image: {
                $concat: [authConfig.imageUrl, 'cms/', '$image'],
              },
              status: 1,
              description: 1,
              type: 1,
              slug: 1,
              title: 1,
              createdAt: 1,
              index: 1,
            },
          },
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
        'src/controller/home-cms/home-cms.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update category
  public async update(
    id: string,
    updateHomeCmDto: UpdateHomeCmDto,
    res: any,
  ): Promise<HomeCm> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateHomeCmDto,
      );
      const cms = await this.homeCmModel
        .findById(id)
        .select({ _id: 1, image: 1, type: 1 })
        .lean();
      if (!cms) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //Insert new image in aws s3
        await this.commonService.uploadFileOnS3(updateHomeCmDto.image, 'cms');

        if (
          cms.type === 'file' &&
          (updateHomeCmDto.removeFile ||
            (!_.isEmpty(updateHomeCmDto.image) &&
              !_.isEmpty(cms.image) &&
              updateHomeCmDto.image != cms.image))
        ) {
          //Remove image files from aws s3
          await this.commonService.s3ImageRemove('cms', cms.image);
          if (updateHomeCmDto.removeFile) {
            updateHomeCmDto.image = null;
          }
        }

        await this.homeCmModel
          .findByIdAndUpdate(id, updateHomeCmDto, { new: true })
          .select({ _id: 1 })
          .lean();

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: cms._id,
          entity_name: 'Home Cms',
          description: 'Home Cms has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Home_CMS_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/home-cms/home-cms.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete homepage cms page
  public async remove(id: string, res: any): Promise<HomeCm> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const cms = await this.homeCmModel
        .findByIdAndDelete(id)
        .select({ _id: 1, image: 1 })
        .lean();
      if (!cms) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //call unlink file function
      await this.commonService.s3ImageRemove('cms', cms.image);

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: cms._id,
        entity_name: 'Home Cms',
        description: 'Home Cms has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Home_CMS_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/home-cms/home-cms.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get cms page from given slug
  public async getCms(res: any): Promise<HomeCm> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const data = await this.homeCmModel.aggregate([
        { $match: { status: 'Active' } },
        {
          $project: {
            _id: 1,
            image: {
              $concat: [authConfig.imageUrl, 'cms/', '$image'],
            },
            status: 1,
            description: 1,
            type: 1,
            slug: 1,
            title: 1,
            createdAt: 1,
          },
        },
        { $sort: { index: 1 } },
        { $limit: 10 },
      ]);

      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/home-cms/home-cms.service.ts-getCms',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get cms page from given slug
  public async getPage(slug: string, res: any): Promise<HomeCm> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', {
        slug,
      });
      const homeCms = await this.homeCmModel
        .findOne({ slug: slug, status: 'Active' })
        .select({
          _id: 1,
          image: {
            $concat: [authConfig.imageUrl, 'cms/', '$image'],
          },
          status: 1,
          description: 1,
          type: 1,
          slug: 1,
          title: 1,
          createdAt: 1,
        })
        .lean();
      if (!homeCms) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      res.json({
        success: true,
        data: homeCms,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/home-cms/home-cms.service.ts-getPage',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
