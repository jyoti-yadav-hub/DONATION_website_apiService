import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { Language, LanguageDocument } from './entities/language.entity';
import {
  CurrencyModel,
  CurrencyDocument,
} from '../currency/entities/currency.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { _ } from 'lodash';
import { authConfig } from 'src/config/auth.config';
import { LogService } from 'src/common/log.service';

@Injectable()
export class LanguageService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Language.name) private languageModel: Model<LanguageDocument>,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
  ) {}
  public async create(createLanguageDto: CreateLanguageDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createLanguageDto,
      );
      const adminData = this.request.user;

      const languageData = await this.languageModel
        .findOne({
          language: new RegExp('^' + createLanguageDto.language + '$', 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(languageData)) {
        return res.json({
          success: false,
          message: mConfig.Language_exist,
        });
      } else {
        createLanguageDto.createdBy = adminData.name;
        createLanguageDto.updatedBy = adminData.name;
        const createLanguage = new this.languageModel(createLanguageDto);
        const result = await createLanguage.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Languages',
          description: 'Language has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.Language_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/language/language.service.ts-createLanguage',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findAll(param, res: any): Promise<Language[]> {
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
        if (!_.isUndefined(filter.language) && filter.language) {
          const query = await this.commonService.filter(
            operator,
            filter.language,
            'language',
          );
          if (
            !_.isUndefined(filter.language_specific_name) &&
            filter.language_specific_name
          ) {
            const query = await this.commonService.filter(
              operator,
              filter.language_specific_name,
              'language_specific_name',
            );
            where.push(query);
          }
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
            'language',
            'language_specific_name',
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
        language: 'language',
        language_specific_name: 'language_specific_name',
        status: 'status',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };

      const lookup = {
        from: 'currency',
        localField: 'country_code',
        foreignField: 'country_code',
        as: 'countries',
      };

      const total = await this.languageModel
        .aggregate([
          { $match: match },
          { $lookup: lookup },
          { $count: 'count' },
        ])
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
      const result = await this.languageModel.aggregate(
        [
          { $match: match },
          { $lookup: lookup },
          {
            $project: {
              _id: 1,
              language: 1,
              status: 1,
              country_code: 1,
              createdAt: 1,
              updatedAt: 1,
              createdBy: 1,
              updatedBy: 1,
              language_specific_name: 1,
              country: {
                $map: {
                  input: '$countries',
                  as: 'c',
                  in: '$$c.country',
                },
              },
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
        'src/controller/language/language.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findList(param, res: any): Promise<Language[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const query: any = { status: 'Active' };

      if (param.country_code) {
        query['$or'] = [
          { country_code: { $in: [param.country_code] } },
          { country_code: { $size: 0 } },
        ];
      }
      const data = await this.languageModel
        .find(query)
        .collation(authConfig.collation)
        .sort({ language: 1 })
        .select({ language: 1, language_specific_name: 1 })
        .lean();

      return res.json({
        data,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/language/language.service.ts-findList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async update(
    id: string,
    updateLanguageDto: UpdateLanguageDto,
    res: any,
  ): Promise<UpdateLanguageDto> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateLanguageDto,
      );
      const adminData = this.request.user;

      const languageData: any = await this.languageModel
        .findOne({
          language: new RegExp('^' + updateLanguageDto.language + '$', 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(languageData) && languageData._id.toString() !== id) {
        return res.json({
          success: false,
          message: mConfig.Language_exist,
        });
      } else {
        updateLanguageDto.updatedBy = adminData.name;

        const result: any = await this.languageModel
          .findByIdAndUpdate(id, updateLanguageDto, { new: true })
          .select({ _id: 1 })
          .lean();
        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }

        this.commonService.sendAllUserHiddenNotification('language_update');

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Languages',
          description: 'Language has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Language_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/language/language.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async delete(id: string, res: any): Promise<Language> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const language: any = await this.languageModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!language) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      this.commonService.sendAllUserHiddenNotification('language_update');

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: language._id,
        entity_name: 'Languages',
        description: 'Language has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Language_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/language/language.service.ts-deleteLanguage',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
