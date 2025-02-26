import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LogService } from '../../common/log.service';
import { authConfig } from '../../config/auth.config';
import mConfig from '../../config/message.config.json';
import { CreateCorporateTypeDto } from './dto/create-corporate-type.dto';
import { UpdateCorporateTypeDto } from './dto/update-corporate-type.dto';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import {
  CorporateType,
  CorporateTypeDocument,
} from './entities/corporate-type.entity';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class CorporateTypesService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(CorporateType.name)
    private corporateTypeModel: Model<CorporateTypeDocument>,
  ) {}

  // Api for create Corporate Type
  public async create(
    createCorporateTypeDto: CreateCorporateTypeDto,
    res: any,
  ): Promise<CorporateTypeDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createCorporateTypeDto,
      );
      const partner = await this.corporateTypeModel
        .findOne({
          slug: createCorporateTypeDto.slug,
          is_deleted: { $ne: true },
        })
        .select({ _id: 1 })
        .lean();
      if (partner) {
        return res.json({
          message: mConfig.corporate_type_exist,
          success: false,
        });
      } else {
        //Replace oldfile from newfile
        if (
          createCorporateTypeDto.icon &&
          !_.isUndefined(createCorporateTypeDto.icon)
        ) {
          await this.commonService.uploadFileOnS3(
            createCorporateTypeDto.icon,
            'partner',
          );
          createCorporateTypeDto.icon = createCorporateTypeDto.icon
            ? createCorporateTypeDto.icon
            : null;
        }

        createCorporateTypeDto['restore_form_data'] =
          createCorporateTypeDto.form_settings;
        const createData = new this.corporateTypeModel(createCorporateTypeDto);
        const result = await createData.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Corporate Type',
          description: `${result.name} Corporate Type has been created.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.corporate_type_created,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate-type/corporate-type.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for update Corporate Type
  public async update(
    id: string,
    updateCorporateTypeDto: UpdateCorporateTypeDto,
    res: any,
  ): Promise<CorporateTypeDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateCorporateTypeDto,
      );
      const partner = await this.corporateTypeModel
        .findOne({ _id: ObjectID(id), is_deleted: { $ne: true } })
        .select({ _id: 1, icon: 1, name: 1 })
        .lean();
      if (!partner) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const alreadyExistData = await this.corporateTypeModel
          .findOne({
            slug: updateCorporateTypeDto.slug,
            _id: { $ne: ObjectID(id) },
            is_deleted: { $ne: true },
          })
          .select({ _id: 1, slug: 1 })
          .lean();
        if (alreadyExistData) {
          return res.json({
            message: mConfig.corporate_type_exist,
            success: false,
          });
        } else {
          //Replace old icon file from new icon file
          await this.commonService.uploadFileOnS3(
            updateCorporateTypeDto.icon,
            'partner',
            partner.icon,
          );

          updateCorporateTypeDto.icon = updateCorporateTypeDto.icon
            ? updateCorporateTypeDto.icon
            : partner.icon;

          //store default form for restore form if lost
          if (updateCorporateTypeDto.store_form) {
            updateCorporateTypeDto['restore_form_data'] =
              updateCorporateTypeDto.form_settings;
          }

          await this.corporateTypeModel
            .findByIdAndUpdate(id, updateCorporateTypeDto, { new: true })
            .select({ _id: 1 })
            .lean();
          this.commonService.sendAllUserHiddenNotification('update_partner');

          //Add Activity Log
          const logData = {
            action: 'update',
            entity_id: partner._id,
            entity_name: 'Corporate Type',
            description: `${partner.name} Corporate Type has been updated.`,
          };
          this.logService.createAdminLog(logData);

          return res.json({
            message: mConfig.corporate_type_updated,
            success: true,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate-type/corporate-type.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for list Corporate Type for Admin
  public async findAll(param, res: any): Promise<CorporateTypeDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { is_deleted: { $ne: true } };
      const filter = !_.isEmpty(param) ? param : [];
      //Handle mongoes match object
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        if (!_.isUndefined(filter.name) && filter.name) {
          const query = await this.commonService.filter(
            'contains',
            filter.name,
            'name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.slug) && filter.slug) {
          const query = await this.commonService.filter(
            'contains',
            filter.slug,
            'slug',
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
        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            'contains',
            filter.status,
            'status',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = ['name', 'slug', 'createdAt'];
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
        name: 'name',
        slug: 'slug',
        status: 'status',
        createdAt: 'createdAt',
        index: 'index',
      };

      const total_record = await this.corporateTypeModel
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

      const data = await this.corporateTypeModel.aggregate(
        [
          { $match: match },
          { $sort: sort },
          {
            $project: {
              _id: 1,
              name: 1,
              slug: 1,
              icon: {
                $concat: [authConfig.imageUrl, 'partner/', '$icon'],
              },
              form_settings: 1,
              index: 1,
              status: 1,
              coming_soon: 1,
              createdAt: 1,
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
        'src/controller/corporate-type/corporate-type.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete Corporate Type
  public async remove(id: string, res: any): Promise<CorporateTypeDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const partner = await this.corporateTypeModel
        .findOneAndUpdate(
          { _id: ObjectID(id), is_deleted: { $ne: true } },
          { is_deleted: true },
        )
        .select({ _id: 1, icon: 1, name: 1 })
        .lean();
      if (!partner) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //call unlink file function
      await this.commonService.sendAllUserHiddenNotification('update_partner');

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: partner._id,
        entity_name: 'Corporate Type',
        description: `${partner.name} Corporate Type has been deleted.`,
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.corporate_type_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate-type/corporate-type.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for list Corporate Type for app
  public async list(param: any, res: any): Promise<CorporateTypeDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const data = await this.corporateTypeModel.aggregate([
        { $match: { status: 'Active', is_deleted: { $ne: true } } },
        {
          $project: {
            _id: 1,
            name: 1,
            slug: 1,
            icon: {
              $concat: [authConfig.imageUrl, 'partner/', '$icon'],
            },
            coming_soon: 1,
          },
        },
        {
          $facet: {
            arr1: [
              { $match: { coming_soon: { $eq: false } } },
              { $group: { _id: null, values: { $first: '$$ROOT' } } },
              { $unwind: '$values' },
              { $replaceRoot: { newRoot: '$values' } },
            ],
            arr2: [
              { $match: { coming_soon: { $eq: true } } },
              { $group: { _id: null, values: { $push: '$$ROOT' } } },
              { $unwind: '$values' },
              { $replaceRoot: { newRoot: '$values' } },
            ],
          },
        },
        { $sort: { index: 1 } },
      ]);
      return res.json({
        success: true,
        data1: data[0].arr1,
        data2: data[0].arr2,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate-type/corporate-type.service.ts-list',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get partner details
  public async getFormSetting(
    type: string,
    res: any,
  ): Promise<CorporateTypeDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        type,
      );
      const result = await this.corporateTypeModel
        .findOne({ slug: type, is_deleted: { $ne: true } })
        .select({ form_settings: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        return res.json({
          data: result,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate-type/corporate-type.service.ts-getFormSetting',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for restore form
  public async restoreForm(id, res): Promise<CorporateTypeDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const result = await this.corporateTypeModel
        .findById(id)
        .select({ restore_form_data: 1 })
        .lean();
      if (_.isEmpty(result)) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        return res.json({
          success: true,
          data: result.restore_form_data,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate-type/corporate-type.service.ts-restoreForm',
      );
    }
  }
}
