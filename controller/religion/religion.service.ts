import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateReligionDto } from './dto/create-religion.dto';
import { UpdateReligionDto } from './dto/update-religion.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { Religion, ReligionDocument } from './entities/religion.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { _ } from 'lodash';
import { authConfig } from 'src/config/auth.config';
import { LogService } from '../../common/log.service';
@Injectable()
export class ReligionService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly logService: LogService,
    @InjectModel(Religion.name) private religionModel: Model<ReligionDocument>,
  ) {}
  public async create(createReligionDto: CreateReligionDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createReligionDto,
      );
      const religionData = await this.religionModel
        .findOne({
          religion: new RegExp('^' + createReligionDto.religion + '$', 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(religionData)) {
        return res.json({
          success: false,
          message: mConfig.Religion_already_exists,
        });
      } else {
        const createReligion = new this.religionModel(createReligionDto);
        const result = await createReligion.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Religion',
          description: 'Religion has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.Religion_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/religion/religion.service.ts-createReligion',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findAll(param, res: any): Promise<Religion[]> {
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
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.religion) && filter.religion) {
          const query = await this.commonService.filter(
            operator,
            filter.religion,
            'religion',
          );
          where.push(query);
        }

        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      const sortData = {
        _id: '_id',
        religion: 'religion',
      };

      const total = await this.religionModel
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
      const result = await this.religionModel.aggregate(
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
        'src/controller/religion/religion.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findList(param, res: any): Promise<Religion[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const result = await this.religionModel
        .find()
        .collation(authConfig.collation)
        .sort({ religion: 1 })
        .select({ religion: 1 })
        .lean();
      const data = ['Prefer Not To Say'];
      if (result && !_.isEmpty(result)) {
        result.map(function (e) {
          data.push(e.religion);
        });
      }

      return res.json({
        data,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/race/race.service.ts-findList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async update(
    id: string,
    updateReligionDto: UpdateReligionDto,
    res: any,
  ): Promise<UpdateReligionDto> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateReligionDto,
      );
      const religionData: any = await this.religionModel
        .findOne({
          religion: new RegExp('^' + updateReligionDto.religion + '$', 'i'),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(religionData) && religionData._id.toString() !== id) {
        return res.json({
          success: false,
          message: mConfig.Religion_already_exists,
        });
      } else {
        const result: any = await this.religionModel
          .findByIdAndUpdate(id, updateReligionDto, { new: true })
          .select({ _id: 1 })
          .lean();
        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }
        //send hidden notification to all user
        await this.commonService.sendAllUserHiddenNotification(
          'religion_update',
        );

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Religion',
          description: 'Religion has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Religion_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/religion/religion.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async delete(id: string, res: any): Promise<Religion> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const religion: any = await this.religionModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!religion) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //send hidden notification to all user
      await this.commonService.sendAllUserHiddenNotification('religion_update');
      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: religion._id,
        entity_name: 'Religion',
        description: 'Religion has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Religion_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/religion/religion.service.ts-deleteReligion',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
