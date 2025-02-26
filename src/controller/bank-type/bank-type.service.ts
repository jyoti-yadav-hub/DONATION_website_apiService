import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { authConfig } from '../../config/auth.config';
import { LogService } from '../../common/log.service';
import {
  CurrencyModel,
  CurrencyDocument,
} from '../currency/entities/currency.entity';
import { CreateBankTypeDto } from './dto/create-bank-type.dto';
import { UpdateBankTypeDto } from './dto/update-bank-type.dto';
import { BankType, BankTypeDocument } from './entities/bank-type.entity';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class BankTypeService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(BankType.name)
    private bankTypeModel: Model<BankTypeDocument>,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
  ) {}

  //Api for create country bank form
  public async create(
    createBankTypeDto: CreateBankTypeDto,
    res: any,
  ): Promise<BankTypeDocument[]> {
    try {
      // Create an API log entry to record the incoming request and the data being created
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        createBankTypeDto,
      );
      const adminData = this.request.user;
      const countryData = await this.currencyModel
        .findOne({ country: createBankTypeDto.country }, { _id: 1 })
        .lean();

      // Check if country data is found then get banck detail
      if (countryData) {
        const findBankType: any = await this.bankTypeModel
          .findOne(
            {
              bank_name: createBankTypeDto.bank_name,
            },
            { _id: 1 },
          )
          .lean();
        // If a bank type with the same name already exists, return an error response
        if (findBankType) {
          return res.json({
            message: mConfig.bank_already_exist,
            success: false,
          });
        } else {
          // Create a new bank type using the provided data
          const createManageBank = new this.bankTypeModel(createBankTypeDto);
          const result = await createManageBank.save();

          //Add Activity Log
          const logData = {
            action: 'create',
            entity_id: result._id,
            entity_name: 'Bank type',
            description: 'Bank type has been created successfully.',
          };
          this.logService.createAdminLog(logData);

          return res.json({
            message: mConfig.bank_type_created,
            success: true,
          });
        }
      } else {
        return res.json({
          message: mConfig.country_not_found,
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank-type/bank-type.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for country bank type list admin
  public async bankTypeList(param, res: any): Promise<BankTypeDocument[]> {
    try {
      // Create an API log entry to record the incoming request and the filter parameters
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      // Check if filter parameters have been provide
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        // Check if 'country' is a filter parameter then push in the variable
        if (!_.isUndefined(filter.country) && filter.country) {
          const query = await this.commonService.filter(
            operator,
            filter.country,
            'country',
          );
          where.push(query);
        }
        // Check if 'createdAt' is a filter parameter then push in the variable
        if (!_.isUndefined(filter.createdAt) && filter.createdAt) {
          const query = await this.commonService.filter(
            'date',
            filter.createdAt,
            'createdAt',
          );
          where.push(query);
        }
        // Check if 'bank_name' is a filter parameter then push in the variable
        if (!_.isUndefined(filter.bank_name) && filter.bank_name) {
          const query = await this.commonService.filter(
            operator,
            filter.bank_name,
            'bank_name',
          );
          where.push(query);
        }

        // Check if 'serch' is a filter parameter then merge in the variable
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = ['country', 'bank_name', 'createdAt', 'updatedAt'];
          query = await this.commonService.getGlobalFilter(
            fields,
            filter.search,
          );
        }
        //Merge mongo queries
        if (!_.isUndefined(filter.search) && !_.isEmpty(query)) {
          match['$or'] = query;
        }
        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      // Define the sorting options for the query
      const sortData = {
        _id: '_id',
        country: 'country',
        bank_name: 'bank_name',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      };

      const total_record = await this.bankTypeModel
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

      const result = await this.bankTypeModel.aggregate(
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
        'src/controller/bank-type/bank-type.service.ts-bankTypeList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update bank form
  public async update(
    id: string,
    updateBankTypeDto: UpdateBankTypeDto,
    res: any,
  ): Promise<BankTypeDocument[]> {
    try {
      // Create an API log entry to record the incoming request and the data being updated
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateBankTypeDto,
      );
      const adminData = this.request.user;

      // Attempt to find and update the bank type with the specified ID
      const result = await this.bankTypeModel
        .findByIdAndUpdate(id, updateBankTypeDto, { new: true })
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        // Check if a bank type with the same name already exists (excluding the current one)
        const findBankType: any = await this.bankTypeModel
          .findOne(
            {
              bank_name: updateBankTypeDto.bank_name,
              _id: { $ne: ObjectID(id) },
            },
            { _id: 1 },
          )
          .lean();
        if (findBankType) {
          return res.json({
            message: mConfig.bank_already_exist,
            success: false,
          });
        }
        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Bank Type',
          description: 'Bank type has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.bank_type_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank-type/bank-type.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete bank type
  public async delete(id: string, res: any): Promise<BankTypeDocument[]> {
    try {
      // Create an API log entry to record the incoming request
      this.errorlogService.createApiLog(this.request.originalUrl, 'delete', {
        id,
      });
      // Attempt to find and delete the bank type with the specified ID
      const findBank = await this.bankTypeModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!findBank) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: findBank._id,
        entity_name: 'Bank Type',
        description: 'Bank type has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.bank_type_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank-type/bank-type.service.ts-delete',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findList(country, res: any): Promise<BankTypeDocument[]> {
    try {
      // Create an API log entry to record the incoming request
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', {
        country,
      });
      const query: any = { country };

      //fetch bank type data based on the country
      const data = await this.bankTypeModel
        .find(query)
        .collation(authConfig.collation)
        .sort({ bank_name: 1 })
        .select({ country: '$bank_name' })
        .lean();

      return res.json({
        data,
        success: true,
      });
    } catch (error) {
      // Log the error in the error log service
      this.errorlogService.errorLog(
        error,
        'src/controller/bank-type/bank-type.service.ts-findList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
