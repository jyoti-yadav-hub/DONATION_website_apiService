/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { User, UserDocument } from '../users/entities/user.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { CurrencyModel, CurrencyDocument } from './entities/currency.entity';
import {
  ExchangeRates,
  ExchangeRatesDocument,
} from '../fund/entities/exchange-rates.entity';
import { authConfig } from 'src/config/auth.config';
import { LogService } from 'src/common/log.service';

const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class CurrencyService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ExchangeRates.name)
    private exchangeRatesModel: Model<ExchangeRatesDocument>,
  ) {}

  //Api for create currency
  public async create(
    createCurrencyDto: CreateCurrencyDto,
    res: any,
  ): Promise<CurrencyDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createCurrencyDto,
      );
      const adminData = this.request.user;

      const countryCodeData = await this.currencyModel
        .findOne({
          country_code: new RegExp(
            '^' + createCurrencyDto.country_code + '$',
            'i',
          ),
        })
        .select({ _id: 1 })
        .lean();
      //Check country data if not exist then create
      if (!_.isEmpty(countryCodeData)) {
        return res.json({
          success: false,
          message: mConfig.Country_already_exists,
        });
      } else {
        createCurrencyDto.createdBy = adminData.name;
        createCurrencyDto.updatedBy = adminData.name;

        const createCurrency = new this.currencyModel(createCurrencyDto);
        const result = await createCurrency.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Country Currency',
          description: `${createCurrencyDto.country} Country Currency has been created successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Currency_created,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/Currency/currency.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for currency list
  public async findAll(param, res: any): Promise<CurrencyDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      //Return list of coutry
      if (param.all == 1) {
        const countryData = await this.currencyModel
          .find({}, { country: 1, currency: 1, country_code: 1 })
          .collation(authConfig.collation)
          .sort({ country: 1 })
          .lean();
        return res.json({ success: true, data: countryData });
      }

      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : 'contains';
        if (!_.isUndefined(filter.country) && filter.country) {
          const query = await this.commonService.filter(
            operator,
            filter.country,
            'country',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.region) && filter.region) {
          const query = await this.commonService.filter(
            operator,
            filter.region,
            'region',
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
        if (!_.isUndefined(filter.currency) && filter.currency) {
          const query1 = await this.commonService.filter(
            operator,
            filter.currency,
            'currency.name',
          );

          const query2 = await this.commonService.filter(
            operator,
            filter.currency,
            'currency.symbol',
          );
          const query = { $or: [query1, query2] };
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
            'currency.name',
            'currency.symbol',
            'region',
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
        region: 'region',
        country: 'country',
        country_code: 'country_code',
        currency: 'currency.name',
        status: 'status',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.currencyModel
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

      const result = await this.currencyModel.aggregate(
        [
          { $match: match },
          {
            $project: {
              _id: 1,
              currency: 1,
              country: 1,
              emoji: 1,
              region: 1,
              status: 1,
              country_code: 1,
              createdAt: 1,
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
        'src/controller/Currency/currency.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update currency
  public async update(
    id: string,
    updateCurrencyDto: UpdateCurrencyDto,
    res: any,
  ): Promise<CurrencyDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateCurrencyDto,
      );
      const adminData = this.request.user;

      const countryData = await this.currencyModel
        .findOne({
          country: new RegExp('^' + updateCurrencyDto.country + '$', 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(countryData) && countryData._id.toString() !== id) {
        return res.json({
          success: false,
          message: mConfig.Country_already_exists,
        });
      } else {
        updateCurrencyDto.updatedBy = adminData.name;

        const result = await this.currencyModel
          .findByIdAndUpdate(id, updateCurrencyDto, { new: true })
          .lean();

        const countryData: any = {
          _id: result._id,
          country: result.country,
          country_code: result.country_code,
          currency: result.currency,
          emoji: result.emoji,
        };

        await this.userModel
          .updateMany(
            { 'country_data._id': ObjectID(id) },
            { country_data: countryData },
          )
          .lean();

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Country Currency',
          description: `${result.country} Country Currency has been updated successfully.`,
        };
        this.logService.createAdminLog(logData);

        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }
        return res.json({
          message: mConfig.Currency_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/Currency/currency.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete currency
  public async delete(id: string, res: any): Promise<CurrencyDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const currency = await this.currencyModel
        .findByIdAndDelete(id)
        .select({ _id: 1, country: 1 })
        .lean();
      if (!currency) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: currency._id,
        entity_name: 'Country Currency',
        description: `${currency.country} Country Currency has been deleted successfully.`,
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Currency_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/Currency/currency.service.ts-delete',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for currency list for app
  public async find(param, res: any): Promise<CurrencyDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const query = { status: 'Active' };
      if (param.country && !_.isUndefined(param.country)) {
        query['country'] = new RegExp(param.country, 'i');
      }
      const result = await this.currencyModel
        .find(query)
        .collation({ locale: 'en' })
        .select({ _id: 1, currency: 1, country: 1, country_code: 1, emoji: 1 })
        .sort({ country: 1 })
        .lean();

      const updatedData = [];
      let userData: any = [];
      if (param.userId && !_.isUndefined(param.userId)) {
        userData = await this.userModel
          .findById(param.userId, { _id: 1, country_data: 1 })
          .select({ _id: 1, country_data: 1 })
          .lean();
      }
      //Handle selected flag
      await result.map(async (item: any) => {
        if (
          userData &&
          !_.isEmpty(userData) &&
          userData.country_data &&
          !_.isUndefined(userData.country_data) &&
          item.country == userData.country_data.country
        ) {
          item.selected = true;
        } else {
          item.selected = false;
        }
        updatedData.push(item);
      });

      return res.json({
        data: updatedData,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/Currency/currency.service.ts-find',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for valid currency list
  public async availableCurrency(res: any): Promise<ExchangeRatesDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const result = await this.exchangeRatesModel
        .find()
        .select({ name: { $toUpper: '$currency' }, _id: 0 })
        .lean();

      return res.json({
        data: result,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/Currency/currency.service.ts-availableCurrency',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
