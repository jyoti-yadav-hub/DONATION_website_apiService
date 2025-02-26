/* eslint-disable prettier/prettier */
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mConfig from '../../config/message.config.json';
import { QueueService } from '../../common/queue.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { CommonSettingDto } from './dto/common-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { Setting, SettingDocument } from './entities/setting.entity';
import { GetCommonSettingDto } from './dto/get-common-setting.dto';
import {
  CommonSetting,
  CommonSettingDocument,
} from './entities/common-setting.entity';
import {
  CurrencyModel,
  CurrencyDocument,
} from '../currency/entities/currency.entity';
import { _ } from 'lodash';
import { authConfig } from 'src/config/auth.config';
import { LogService } from '../../common/log.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class SettingService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly queueService: QueueService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly logService: LogService,
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
    @InjectModel(CommonSetting.name)
    private commonSettingModel: Model<CommonSettingDocument>,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
  ) {}

  //Api for create setting
  public async create(
    createSettingDto: CreateSettingDto,
    res: any,
  ): Promise<Setting> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createSettingDto,
      );
      const settingData = await this.settingModel
        .findOne({ name: new RegExp('^' + createSettingDto.name + '$', 'i') })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(settingData)) {
        return res.json({
          success: false,
          message: mConfig.Setting_already_exists,
        });
      } else {
        const createSetting = new this.settingModel(createSettingDto);
        const result = await createSetting.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Settings',
          description: 'Setting has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Setting_created,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/setting/setting.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list setting for admin
  public async findAll(param, res: any): Promise<Setting[]> {
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
        if (!_.isUndefined(filter.name) && filter.name) {
          const query = await this.commonService.filter(
            operator,
            filter.name,
            'name',
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
        if (!_.isUndefined(filter.value) && filter.value) {
          const query = await this.commonService.filter(
            operator,
            filter.value,
            'value',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.group_name) && filter.group_name) {
          const query = await this.commonService.filter(
            operator,
            filter.group_name,
            'group_name',
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
          const fields = ['name', 'slug', 'value', 'group_name', 'createdAt'];
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
        name: 'name',
        slug: 'slug',
        value: 'value',
        group_name: 'group_name',
        createdAt: 'createdAt',
      };

      const total = await this.settingModel
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

      const result = await this.settingModel.aggregate(
        [
          { $match: match },
          {
            $group: {
              _id: { $toLower: '$group_name' },
              settingData: { $push: '$$ROOT' },
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
        'src/controller/setting/setting.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update setting
  public async update(
    id: string,
    updateSettingDto: UpdateSettingDto,
    res: any,
  ): Promise<Setting> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateSettingDto,
      );
      const settingData = await this.settingModel
        .findOne({ name: new RegExp('^' + updateSettingDto.name + '$', 'i') })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(settingData) && settingData._id.toString() !== id) {
        return res.json({
          success: false,
          message: mConfig.Setting_already_exists,
        });
      } else {
        const result = await this.settingModel
          .findByIdAndUpdate(id, updateSettingDto, { new: true })
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
          entity_id: settingData._id,
          entity_name: 'Settings',
          description: 'Setting has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Setting_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/setting/setting.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete setting
  public async remove(id: string, res: any): Promise<Setting> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const setting = await this.settingModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!setting) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: setting._id,
        entity_name: 'Settings',
        description: 'Setting has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);
      return res.json({
        message: mConfig.Setting_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/setting/setting.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for find setting using slug
  public async findSetting(slug: string, res: any): Promise<Setting> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { slug },
      );
      const findSetting = await this.settingModel
        .findOne({ slug: slug })
        .select({ value: 1 })
        .lean();
      if (!_.isEmpty(findSetting)) {
        return res.json({
          success: true,
          data: findSetting,
        });
      } else {
        return res.json({
          success: false,
          data: mConfig.No_data_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/setting/setting.service.ts-findSetting',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for create setting
  public async createCommonSettings(
    commonSettingDto: CommonSettingDto,
    res: any,
  ): Promise<Setting> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        commonSettingDto,
      );
      let settingData;
      const data = JSON.parse(commonSettingDto.form_data);
      const formData: any = {
        form_settings: commonSettingDto.form_data,
        form_data: {},
        country: commonSettingDto.country,
        currency: commonSettingDto.currency,
        unit: commonSettingDto.unit,
      };
      data.map(async (item: any) => {
        const inputs = item.inputs;

        inputs.map(async (input) => {
          if (input.is_category) {
            formData.form_data[input.category_name] = {
              minimum_donation: input.min,
              maximum_donation: input.max,
              expiry_date_extend: input.expiry_date_extend,
            };
          } else {
            formData.form_data[input.input_slug] = input.values;
          }
        });
      });

      if (commonSettingDto.unit == 'mile') {
        //1km = 1.609344 miles
        //km = value/1.609344

        if (formData?.form_data?.radius_in_kilometer) {
          const km = formData.form_data.radius_in_kilometer * 1.609;
          formData.form_data.radius_in_kilometer = km.toFixed(3);
        }

        if (formData?.form_data?.max_radius_in_kilometer) {
          const km = formData.form_data.max_radius_in_kilometer * 1.609;
          formData.form_data.max_radius_in_kilometer = km.toFixed(3);
        }
      }

      const existData = await this.commonSettingModel
        .findOne({
          country: new RegExp('^' + commonSettingDto.country + '$', 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (!commonSettingDto.id) {
        if (!_.isEmpty(existData)) {
          return res.json({
            success: false,
            message: mConfig.Country_settings_already_exists,
          });
        }
        if (commonSettingDto.create_type === 'draft') {
          formData.is_draft = true;
        }
        formData['restore_form_data'] = commonSettingDto.form_data;
        const createSetting = new this.commonSettingModel(formData);
        settingData = await createSetting.save();
      } else {
        if (
          !_.isEmpty(existData) &&
          existData._id.toString() !== commonSettingDto.id
        ) {
          return res.json({
            success: false,
            message: mConfig.Country_settings_already_exists,
          });
        }
        if (commonSettingDto.create_type === 'main') {
          formData['$unset'] = { is_draft: 1 };
        }
        //store default form for restore form if lost
        if (commonSettingDto.store_form) {
          formData['restore_form_data'] = commonSettingDto.form_data;
        }

        settingData = await this.commonSettingModel
          .findByIdAndUpdate({ _id: commonSettingDto.id }, formData, {
            new: true,
          })
          .select({ _id: 1 })
          .lean();
      }
      if (!settingData) {
        return res.json({
          success: false,
          message: mConfig.Please_try_again,
        });
      } else {
        //Add Activity Log
        const logData = {
          action: commonSettingDto.id ? 'update' : 'create',
          entity_id: settingData._id,
          entity_name: 'Common Settings',
          description:
            commonSettingDto.create_type === 'draft'
              ? 'Common Setting has been save as draft.'
              : commonSettingDto.id
              ? 'Common Setting has been updated successfully.'
              : 'Common Setting has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message:
            commonSettingDto.create_type === 'draft'
              ? mConfig.Draft_saved
              : commonSettingDto.id
              ? mConfig.Common_setting_updated
              : mConfig.Common_setting_created,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/setting/setting.service.ts-createCommonSettings',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete setting
  public async deleteCommonSetting(id: string, res: any): Promise<Setting> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const setting = await this.commonSettingModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!setting) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: setting._id,
        entity_name: 'Common Settings',
        description: 'Common Setting has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Common_setting_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/setting/setting.service.ts-deleteCommonSetting',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list setting for admin
  public async commonSettingList(param, res: any): Promise<Setting[]> {
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
        if (!_.isUndefined(filter.country) && filter.country) {
          const query = await this.commonService.filter(
            operator,
            filter.country,
            'country',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.unit) && filter.unit) {
          const query = await this.commonService.filter(
            operator,
            filter.unit,
            'unit',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.payment_gateway) && filter.payment_gateway) {
          const query = await this.commonService.filter(
            operator,
            filter.payment_gateway,
            'form_data.payment_gateway',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.service_fee) && filter.service_fee) {
          const query = await this.commonService.filter(
            operator,
            filter.service_fee,
            'form_data.service_fee',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.transaction_fee) && filter.transaction_fee) {
          const query = await this.commonService.filter(
            operator,
            filter.transaction_fee,
            'form_data.transaction_fee',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.manage_fees) && filter.manage_fees) {
          const query = await this.commonService.filter(
            operator,
            filter.manage_fees,
            'form_data.manage_fees',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.minimum_donation) &&
          filter.minimum_donation
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.minimum_donation,
            'form_data.minimum_donation',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.maximum_donation) &&
          filter.maximum_donation
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.maximum_donation,
            'form_data.maximum_donation',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.saayam_contact_no) &&
          filter.saayam_contact_no
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.saayam_contact_no,
            'form_data.saayam_contact_no',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.saayam_email) && filter.saayam_email) {
          const query = await this.commonService.filter(
            operator,
            filter.saayam_email,
            'form_data.saayam_email',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.service_declaration) &&
          filter.service_declaration
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.service_declaration,
            'form_data.service_declaration',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.radius_in_kilometer) &&
          filter.radius_in_kilometer
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.radius_in_kilometer,
            'form_data.radius_in_kilometer',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.max_radius_in_kilometer) &&
          filter.max_radius_in_kilometer
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.max_radius_in_kilometer,
            'form_data.max_radius_in_kilometer',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.accept_time_out_in_minute) &&
          filter.accept_time_out_in_minute
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.accept_time_out_in_minute,
            'form_data.accept_time_out_in_minute',
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

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'country',
            'unit',
            'form_data.payment_gateway',
            'form_data.service_fee',
            'form_data.transaction_fee',
            'form_data.manage_fees',
            'form_data.minimum_donation',
            'form_data.maximum_donation',
            'form_data.saayam_contact_no',
            'form_data.saayam_email',
            'form_data.service_declaration',
            'form_data.radius_in_kilometer',
            'form_data.max_radius_in_kilometer',
            'form_data.accept_time_out_in_minute',
            'status',
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
        country: 'country',
        unit: 'unit',
        payment_gateway: 'form_data.payment_gateway',
        service_fee: 'form_data.service_fee',
        transaction_fee: 'form_data.transaction_fee',
        manage_fees: 'form_data.manage_fees',
        minimum_donation: 'form_data.minimum_donation',
        maximum_donation: 'form_data.maximum_donation',
        saayam_contact_no: 'form_data.saayam_contact_no',
        saayam_email: 'form_data.saayam_email',
        service_declaration: 'form_data.service_declaration',
        radius_in_kilometer: 'form_data.radius_in_kilometer',
        max_radius_in_kilometer: 'form_data.max_radius_in_kilometer',
        accept_time_out_in_minute: 'form_data.accept_time_out_in_minute',
        status: 'status',
        createdAt: 'createdAt',
      };

      const total = await this.commonSettingModel
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

      const result = await this.commonSettingModel.aggregate(
        [
          { $match: match },
          {
            $project: {
              _id: 1,
              country: 1,
              unit: 1,
              is_draft: 1,
              payment_gateway: '$form_data.payment_gateway',
              service_fee: '$form_data.service_fee',
              transaction_fee: '$form_data.transaction_fee',
              // radius_in_kilometer: '$form_data.radius_in_kilometer',
              radius_in_kilometer: {
                $cond: {
                  if: { $eq: ['$unit', 'mile'] },
                  then: {
                    $divide: [
                      { $toDouble: '$form_data.radius_in_kilometer' },
                      { $toDouble: 1.609 },
                    ],
                  },
                  else: '$form_data.radius_in_kilometer',
                },
              },
              // max_radius_in_kilometer: '$form_data.max_radius_in_kilometer',
              max_radius_in_kilometer: {
                $cond: {
                  if: { $eq: ['$unit', 'mile'] },
                  then: {
                    $divide: [
                      { $toDouble: '$form_data.max_radius_in_kilometer' },
                      { $toDouble: 1.609 },
                    ],
                  },
                  else: '$form_data.max_radius_in_kilometer',
                },
              },
              createdAt: 1,
              currency: 1,
              form_data: 1,
              form_settings: 1,
              status: 1,
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
        'src/controller/setting/setting.service.ts-commonSettingList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for find setting using slug
  public async getCountrySetting(
    getCommonSettingDto: GetCommonSettingDto,
    res: any,
  ): Promise<Setting> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        getCommonSettingDto,
      );
      const result = await this.commonService.getCommonSetting(
        getCommonSettingDto.country,
      );

      if (!_.isEmpty(result)) {
        const form_data: any = result.form_data;
        let data;
        if (
          getCommonSettingDto.type &&
          !_.isUndefined(getCommonSettingDto.type)
        ) {
          data = form_data[getCommonSettingDto.type];
          if (!_.isEmpty(data)) {
            form_data.minimum_donation = data.minimum_donation;
            form_data.maximum_donation = data.maximum_donation;
          }
        }
        return res.json({
          success: true,
          data: form_data,
        });
      } else {
        return res.json({
          success: false,
          data: mConfig.No_data_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/setting/setting.service.ts-getCountrySetting',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list setting for admin
  public async settingGroup(res: any): Promise<Setting[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const result = await this.settingModel.aggregate(
        [
          {
            $group: {
              _id: { $toLower: '$group_name' },
              count: {
                $sum: 1,
              },
            },
          },
          { $sort: { _id: 1 } },
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
        'src/controller/setting/setting.service.ts-settingGroup',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list setting for admin
  public async groupData(groupName, param, res: any): Promise<Setting[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { groupName, param },
      );
      const match = {};

      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';

        if (_.isUndefined(groupName) || _.isEmpty(groupName)) {
          return res.json({
            success: false,
            message: mConfig.group_name_missing,
          });
        } else {
          where.push({ group_name: groupName.toLowerCase() });
        }

        if (!_.isUndefined(filter.name) && filter.name) {
          const query = await this.commonService.filter(
            operator,
            filter.name,
            'name',
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
        if (!_.isUndefined(filter.value) && filter.value) {
          const query = await this.commonService.filter(
            operator,
            filter.value,
            'value',
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
          const fields = ['name', 'slug', 'value', 'group_name', 'createdAt'];
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
        name: 'name',
        slug: 'slug',
        value: 'value',
        group_name: 'group_name',
        createdAt: 'createdAt',
      };

      const total = await this.settingModel
        .aggregate([
          {
            $addFields: {
              group_name: { $toLower: '$group_name' },
            },
          },
          { $match: match },
          { $count: 'count' },
        ])
        .exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      let {
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

      const result = await this.settingModel.aggregate(
        [
          {
            $project: {
              name: 1,
              slug: 1,
              value: 1,
              group_name: { $toLower: '$group_name' },
              createdAt: 1,
              category_slug: 1,
            },
          },
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
        'src/controller/setting/setting.service.ts-groupData',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for enable/disable setting
  public async changeSettingStatus(id: string, res: any): Promise<Setting> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const setting = await this.commonSettingModel
        .findById(id)
        .select({ _id: 1, status: 1 })
        .lean();
      if (!setting) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        let status;
        if (setting.status === 'active') {
          status = 'deactive';
        } else {
          status = 'active';
        }

        const updateData = {
          status: status,
        };

        await this.commonSettingModel
          .findByIdAndUpdate(id, updateData, { new: true })
          .select({ _id: 1 })
          .lean();

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: setting._id,
          entity_name: 'Common Settings',
          description: `Common Setting has been ${status} successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.settings_status_changed,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/setting/setting.service.ts-changeSettingStatus',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for restore common settings form
  public async restoreForm(id, res): Promise<CommonSettingDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const result = await this.commonSettingModel
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
        'src/controller/setting/setting.service.ts-restoreForm',
      );
    }
  }
}
