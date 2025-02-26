import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateShareMessageDto } from './dto/create-share-message.dto';
import { UpdateShareMessageDto } from './dto/update-share-message.dto';
import {
  ShareMessage,
  ShareMessageDocument,
} from './entities/share-message.entity';
import { authConfig } from 'src/config/auth.config';
import { LogService } from 'src/common/log.service';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.entity';

@Injectable()
export class ShareMessageService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(ShareMessage.name)
    private shareMessageModel: Model<ShareMessageDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  //Api for create share message
  public async create(
    createShareMessageDto: CreateShareMessageDto,
    res: any,
  ): Promise<ShareMessageDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createShareMessageDto,
      );
      const adminData = this.request.user;

      createShareMessageDto.createdBy = adminData.name;
      createShareMessageDto.updatedBy = adminData.name;
      const createMessage = new this.shareMessageModel(createShareMessageDto);
      const result = await createMessage.save();

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: result._id,
        entity_name: 'Share Messages',
        description: 'Share Message has been created successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.message_created,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/share-message/share-message.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update share message
  public async update(
    id: string,
    updateShareMessageDto: UpdateShareMessageDto,
    res: any,
  ): Promise<ShareMessageDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateShareMessageDto,
      );
      const adminData = this.request.user;
      updateShareMessageDto.updatedBy = adminData.name;
      const result = await this.shareMessageModel
        .findByIdAndUpdate(id, updateShareMessageDto, { new: true })
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
        entity_name: 'Share Messages',
        description: 'Share Message has been updated successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.message_updated,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/share-message/share-message.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete share message
  public async delete(id: string, res: any): Promise<ShareMessageDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const shareMessage = await this.shareMessageModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!shareMessage) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //Add Activity Log
        const logData = {
          action: 'delete',
          entity_id: shareMessage._id,
          entity_name: 'Share Messages',
          description: 'Share Message has been deleted successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.message_deleted,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/share-message/share-message.service.ts-delete',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for share message list
  public async findAll(param, res: any): Promise<ShareMessageDocument[]> {
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
        if (!_.isUndefined(filter.message) && filter.message) {
          const query = await this.commonService.filter(
            'contains',
            filter.message,
            'message',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.causes) && filter.causes) {
          const query = await this.commonService.filter(
            'contains',
            filter.causes,
            'causes',
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
            'message',
            'causes',
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
        message: 'message',
        causes: 'causes',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };

      const total = await this.shareMessageModel
        .aggregate([{ $match: match }, { $count: 'count' }])
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

      const result = await this.shareMessageModel.aggregate(
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
        'src/controller/share-message/share-message.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for find share message based on category
  public async findOne(param, res: any): Promise<ShareMessageDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const query: any = { causes: param.cause };

      const data = await this.shareMessageModel
        .findOne(query)
        .collation(authConfig.collation)
        .sort({ _id: 1 })
        .select({ message: 1 })
        .lean();

      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      return res.json({
        data,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/share-message/share-message.service.ts-findOne',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for list category for app
  public async categoryList(param: any, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const data = await this.categoryModel.aggregate([
        { $match: { is_category_active: 'active' } },
        {
          $lookup: {
            from: 'share_message',
            localField: 'category_slug',
            foreignField: 'causes',
            as: 'message',
          },
        },
        // { $match: { message: { $eq: [] } } },
        {
          $project: {
            name: 1,
            _id: 1,
            category_slug: 1,
            disabled: {
              $cond: {
                if: {
                  $eq: ['$message', []],
                },
                then: false,
                else: true,
              },
            },
          },
        },
        { $sort: { index: 1 } },
      ]);
      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/share-message/share-message.service.ts-categoryList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
