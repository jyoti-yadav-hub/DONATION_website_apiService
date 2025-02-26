import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import {
  EmotionalMessage,
  EmotionalMessageDocument,
} from './entities/emotional-message.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { authConfig } from 'src/config/auth.config';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateEmotionalMessageDto } from './dto/create-emotional-message.dto';
import { UpdateEmotionalMessageDto } from './dto/update-emotional-message.dto';
import { LogService } from 'src/common/log.service';

@Injectable()
export class EmotionalMessageService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(EmotionalMessage.name)
    private emotionalMessageModel: Model<EmotionalMessageDocument>,
  ) {}
  //Api for create emotional messages
  public async create(
    createEmotionalMessageDto: CreateEmotionalMessageDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createEmotionalMessageDto,
      );
      const adminData = this.request.user;
      await this.commonService.uploadFileOnS3(
        createEmotionalMessageDto.image,
        'emotional-message',
      );

      createEmotionalMessageDto.createdBy = adminData.name;
      createEmotionalMessageDto.updatedBy = adminData.name;
      const createData = new this.emotionalMessageModel(
        createEmotionalMessageDto,
      );
      const result = await createData.save();

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: result._id,
        entity_name: 'Emotional Messages',
        description: 'Emotional Message has been created successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Emotional_message_created,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/emotional-message/emotional-message.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list emotional messages
  public async findAll(param, res: any) {
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
        if (!_.isUndefined(filter.category_slug) && filter.category_slug) {
          const query = await this.commonService.filter(
            operator,
            filter.category_slug,
            'category_slug',
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
        if (!_.isUndefined(filter.message) && filter.message) {
          const query = await this.commonService.filter(
            operator,
            filter.message,
            'message',
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
            'category_slug',
            'type',
            'message',
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
        message: 'message',
        type: 'type',
        status: 'status',
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
        category_slug: 'category_slug',
      };
      const total_record = await this.emotionalMessageModel.countDocuments(match).exec();
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

      const result = await this.emotionalMessageModel.aggregate(
        [
          { $match: match },
          {
            $project: {
              message: 1,
              image: {
                $concat: [authConfig.imageUrl, 'emotional-message/', '$image'],
              },
              type: 1,
              category_slug: 1,
              createdAt: 1,
              status: 1,
              updatedAt: 1,
              createdBy: 1,
              updatedBy: 1,
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
        'src/controller/emotional-message/emotional-message.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update emotional messages
  public async update(
    id: string,
    updateEmotionalMessageDto: UpdateEmotionalMessageDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateEmotionalMessageDto,
      );
      const adminData = this.request.user;
      const emotionalMessage: any = await this.emotionalMessageModel
        .findById(id)
        .select({ _id: 1, image: 1, type: 1 })
        .lean();
      if (!emotionalMessage) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        await this.commonService.uploadFileOnS3(
          updateEmotionalMessageDto.image,
          'emotional-message',
        );

        if (
          emotionalMessage.type === 'image' &&
          (updateEmotionalMessageDto.removeFile ||
            (!_.isEmpty(updateEmotionalMessageDto.image) &&
              !_.isEmpty(emotionalMessage.image) &&
              updateEmotionalMessageDto.image != emotionalMessage.image))
        ) {
          await this.commonService.s3ImageRemove(
            'emotional-message',
            emotionalMessage.image,
          );
          if (updateEmotionalMessageDto.removeFile) {
            updateEmotionalMessageDto.image = null;
          }
        }

        updateEmotionalMessageDto.updatedBy = adminData.name;

        await this.emotionalMessageModel
          .findByIdAndUpdate(id, updateEmotionalMessageDto, { new: true })
          .select({ _id: 1 })
          .lean();

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: emotionalMessage._id,
          entity_name: 'Emotional Messages',
          description: 'Emotional Message has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Emotional_message_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/emotional-message/emotional-message.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete emotional messages
  public async remove(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const emotionalMessage: any = await this.emotionalMessageModel
        .findByIdAndDelete(id)
        .select({ _id: 1, image: 1, type: 1 })
        .lean();
      if (!emotionalMessage) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //call unlink file function
      if (emotionalMessage && emotionalMessage.type == 'image') {
        await this.commonService.s3ImageRemove(
          'emotional-message',
          emotionalMessage.image,
        );
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: emotionalMessage._id,
        entity_name: 'Emotional Messages',
        description: 'Emotional Message has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Emotional_message_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/emotional-message/emotional-message.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get random emotional message
  public async getEmotionalMessage(categorySlug, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        categorySlug,
      );
      const emotionalMessage = await this.emotionalMessageModel.aggregate([
        { $match: { category_slug: categorySlug, status: 'Active' } },
        { $sample: { size: 1 } },
        {
          $project: {
            message: 1,
            image: {
              $concat: [authConfig.imageUrl, 'emotional-message/', '$image'],
            },
            type: 1,
          },
        },
      ]);

      return res.json({
        success: true,
        data: emotionalMessage,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/emotional-message/emotional-message.service.ts-getEmotionalMessage',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
