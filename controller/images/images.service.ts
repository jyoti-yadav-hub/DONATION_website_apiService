/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from '../../config/auth.config';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { Image, ImageDocument } from './entities/image.entity';
import { LogService } from 'src/common/log.service';

@Injectable()
export class ImagesService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
  ) {}

  //Api for create Image
  public async create(
    createImageDto: CreateImageDto,
    res: any,
  ): Promise<Image> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createImageDto,
      );
      const adminData = this.request.user;
      createImageDto.createdBy = adminData.name;
      createImageDto.updatedBy = adminData.name;

      await this.commonService.uploadFileOnS3(createImageDto.image, 'images');
      createImageDto.image = createImageDto.image ? createImageDto.image : null;

      const createImage = new this.imageModel(createImageDto);
      const result = await createImage.save();

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: result._id,
        entity_name: 'Images',
        description: 'Image has been created successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Image_created,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/images/images.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list Images for Admin
  public async findAll(param, res: any): Promise<Image[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      //returned image list
      if (param.allData == 1) {
        const result = await this.imageModel
          .find()
          .collation(authConfig.collation)
          .select({
            _id: 1,
            image: authConfig.imageUrl + 'images/' + '$image',
            view_type: 1,
            index: 1,
            createdAt: 1,
          })
          .lean();
        return res.json({
          success: true,
          data: result,
        });
      }

      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      const operator = param.operator ? param.operator.trim() : '=';
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        if (!_.isUndefined(filter.view_type) && filter.view_type) {
          const query = await this.commonService.filter(
            'contains',
            filter.view_type,
            'view_type',
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
            operator,
            filter.createdBy,
            'createdBy',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.updatedBy) && filter.updatedBy) {
          const query = await this.commonService.filter(
            operator,
            filter.updatedBy,
            'updatedBy',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'view_type',
            'createdAt',
            'updatedAt',
            'createdBy',
            'updatedBy',
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
        index: 'index',
        view_type: 'view_type',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.imageModel.countDocuments(match).exec();
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

      const data = await this.imageModel.aggregate(
        [
          { $match: match },
          { $sort: sort },
          {
            $project: {
              _id: 1,
              view_type: 1,
              index: 1,
              image: { $concat: [authConfig.imageUrl, 'images/', '$image'] },
              createdAt: 1,
              updatedAt: 1,
              createdBy: 1,
              updatedBy: 1,
            },
          },
          { $skip: start_from },
          { $limit: per_page },
        ],
        { collation: authConfig.collation },
      );

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
        'src/controller/images/images.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update image
  public async update(
    id: string,
    updateImageDto: UpdateImageDto,
    res: any,
  ): Promise<Image> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateImageDto,
      );
      const imageData = await this.imageModel
        .findById(id)
        .select({ _id: 1, image: 1 })
        .lean();
      if (!imageData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //insert image
        await this.commonService.uploadFileOnS3(
          updateImageDto.image,
          'images',
          imageData.image,
        );

        updateImageDto.image = updateImageDto.image
          ? updateImageDto.image
          : imageData.image;

        const adminData = this.request.user;
        updateImageDto.updatedBy = adminData.name;

        await this.imageModel
          .findByIdAndUpdate(id, updateImageDto, { new: true })
          .lean();
        await this.commonService.sendAllUserHiddenNotification('update_images');

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: imageData._id,
          entity_name: 'Images',
          description: 'Image has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Image_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/images/images.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete image
  public async remove(id: string, res: any): Promise<Image> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const imageData = await this.imageModel
        .findByIdAndDelete(id)
        .select({ _id: 1, image: 1 })
        .lean();
      if (!imageData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //call unlink file function
      await this.commonService.s3ImageRemove('images', imageData.image);
      await this.commonService.sendAllUserHiddenNotification('update_images');

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: imageData._id,
        entity_name: 'Images',
        description: 'Image has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Image_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/images/images.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get All images
  public async findImages(param: any, res: any): Promise<Image> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const imageData: any = await this.imageModel.aggregate([
        { $match: { view_type: param.type } },
        {
          $project: {
            view_type: 1,
            ngo_cover_image: {
              $concat: [authConfig.imageUrl, 'images/', '$image'],
            },
          },
        },
      ]);
      if (!imageData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      return res.json({
        success: true,
        data: imageData,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/images/images.service.ts-findImages',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
