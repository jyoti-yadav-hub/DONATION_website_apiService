import fs from 'fs';
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import {
  CurrencyModel,
  CurrencyDocument,
} from '../currency/entities/currency.entity';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from 'src/config/auth.config';
import { Inject, Injectable } from '@nestjs/common';
import { LogService } from 'src/common/log.service';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateNgoFormDto } from './dto/create-ngo-form.dto';
import { UpdateNgoFormDto } from './dto/update-ngo-form.dto';
import { NgoForm, NgoFormDocument } from './entities/ngo-form.entity';

const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class NgoFormService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(NgoForm.name)
    private ngoFormModel: Model<NgoFormDocument>,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
  ) {}

  //Api for create country ngo form
  public async create(
    createNgoFormDto: CreateNgoFormDto,
    res: any,
  ): Promise<NgoFormDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createNgoFormDto,
      );
      const adminData = this.request.user;

      let query: object = {
        country_code: createNgoFormDto.country_code,
        is_deleted: { $ne: true },
        is_template: { $ne: true },
      };
      if (createNgoFormDto.is_template) {
        query = {
          country_code: createNgoFormDto.country_code,
          is_deleted: { $ne: true },
          is_template: { $eq: true },
        };
      }
      const findNgoform: any = await this.ngoFormModel
        .findOne(query, { _id: 1 })
        .lean();

      if (!_.isEmpty(findNgoform)) {
        return res.json({
          message: mConfig.form_exist,
          success: false,
        });
      } else {
        createNgoFormDto['createdBy'] = adminData.name;
        createNgoFormDto['updatedBy'] = adminData.name;
        //store default form for restore form if lost
        createNgoFormDto['restore_form_data'] = createNgoFormDto.form_data;

        const createNgoForm = new this.ngoFormModel(createNgoFormDto);
        const result = await createNgoForm.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Ngo Form',
          description: createNgoFormDto.is_template
            ? 'NGO Form template has been created successfully.'
            : 'NGO Form has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: createNgoFormDto.is_template
            ? mConfig.Template_created
            : mConfig.NGO_form_created,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo-form/ngo-form.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for country ngo form list admin
  public async list(param, res: any): Promise<NgoFormDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { is_deleted: { $ne: true } };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.type) && filter.type) {
          if (filter.type === 'template') {
            where.push({ is_template: true });
          } else {
            where.push({ is_template: { $ne: true } });
          }
        }
        if (!_.isUndefined(filter.country) && filter.country) {
          const query = await this.commonService.filter(
            operator,
            filter.country,
            'country',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.country_code) && filter.country_code) {
          const query = await this.commonService.filter(
            operator,
            filter.country_code,
            'country_code',
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
            'country',
            'country_code',
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
        country: 'country',
        country_code: 'country_code',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };

      const total = await this.ngoFormModel
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

      const result = await this.ngoFormModel.aggregate(
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
        'src/controller/ngo-form/ngo-form.service.ts-list',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get NGO form in app
  public async getNGOForm(
    type,
    id: string,
    res: any,
  ): Promise<NgoFormDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id, type },
      );
      let match;
      if (type == 'app') {
        match = {
          country_code: id,
          is_deleted: { $ne: true },
          is_template: { $ne: true },
        };
      } else {
        match = {
          _id: ObjectID(id),
          is_deleted: { $ne: true },
        };
      }
      const formData = await this.ngoFormModel
        .findOne(match, { form_data: 1 })
        .lean();
      if (!_.isEmpty(formData)) {
        return res.json({
          success: true,
          data: formData.form_data,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo-form/ngo-form.service.ts-getNGOForm',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update ngo form
  public async update(
    id: string,
    updateNgoFormDto: UpdateNgoFormDto,
    res: any,
  ): Promise<NgoFormDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateNgoFormDto,
      );
      const adminData = this.request.user;
      updateNgoFormDto['updatedBy'] = adminData.name;
      //store default form for restore form if lost
      if (updateNgoFormDto.store_form) {
        updateNgoFormDto['restore_form_data'] = updateNgoFormDto.form_data;
      }

      const result = await this.ngoFormModel
        .findByIdAndUpdate(id, updateNgoFormDto, { new: true })
        .select({ _id: 1, is_template: 1 })
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
        entity_name: 'Ngo Form',
        description: result.is_template
          ? 'Ngo Form template has been updated successfully.'
          : 'Ngo Form has been updated successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: result.is_template
          ? mConfig.Template_updated
          : mConfig.NGO_form_updated,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo-form/ngo-form.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete ngo form
  public async delete(id: string, res: any): Promise<NgoFormDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const findForm = await this.ngoFormModel
        .findByIdAndUpdate(id, {
          is_deleted: true,
        })
        .select({ _id: 1, is_template: 1 })
        .lean();
      if (!findForm) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: findForm._id,
        entity_name: 'Ngo Form',
        description: findForm.is_template
          ? 'Ngo Form template has been deleted successfully.'
          : 'Ngo Form has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: findForm.is_template
          ? mConfig.Template_deleted
          : mConfig.NGO_form_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo-form/ngo-form.service.ts-delete',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for restore form
  public async restoreForm(id, res): Promise<NgoFormDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const result = await this.ngoFormModel
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
        'src/controller/ngo-form/ngo-form.service.ts-restoreForm',
      );
    }
  }

  // Api for get template
  public async getTemplate(id: string, res: any): Promise<NgoFormDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const result = await this.ngoFormModel
        .findOne({
          _id: ObjectID(id),
          is_template: true,
          is_deleted: { $ne: true },
        })
        .select({ form_data: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        return res.json({
          success: true,
          data: result && result.form_data ? result.form_data : {},
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo-form/ngo-form.service.ts-getTemplate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get template list
  public async getTemplateList(
    param: any,
    res: any,
  ): Promise<NgoFormDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const result = await this.ngoFormModel
        .find({ is_template: true, is_deleted: { $ne: true } })
        .collation(authConfig.collation)
        .select({ _id: 1, template_name: 1 })
        .sort({ template_name: 1 })
        .lean();
      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo-form/ngo-form.service.ts-getTemplateList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
