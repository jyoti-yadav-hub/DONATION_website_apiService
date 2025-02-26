import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { Race, RaceDocument } from './entities/race.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { _ } from 'lodash';
import { authConfig } from 'src/config/auth.config';
import { LogService } from '../../common/log.service';

@Injectable()
export class RaceService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly logService: LogService,
    @InjectModel(Race.name) private raceModel: Model<RaceDocument>,
  ) {}
  public async create(createRaceDto: CreateRaceDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createRaceDto,
      );
      const raceData = await this.raceModel
        .findOne({ race: new RegExp('^' + createRaceDto.race + '$', 'i') })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(raceData)) {
        return res.json({
          success: false,
          message: mConfig.Race_already_exists,
        });
      } else {
        const createRace = new this.raceModel(createRaceDto);
        const result = await createRace.save();
        //Add admin log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Race',
          description: 'Race has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.Race_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/race/race.service.ts-createRace',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findAll(param, res: any): Promise<Race[]> {
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
        if (!_.isUndefined(filter.race) && filter.race) {
          const query = await this.commonService.filter(
            operator,
            filter.race,
            'race',
          );
          where.push(query);
        }

        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      const sortData = {
        _id: '_id',
        race: 'race',
      };

      const total = await this.raceModel
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
      const result = await this.raceModel.aggregate(
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
        'src/controller/race/race.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findList(param, res: any): Promise<Race[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const result = await this.raceModel
        .find()
        .collation(authConfig.collation)
        .select({ race: 1 })
        .sort({ race: 1 })
        .lean();

      const data = ['Prefer Not To Say'];
      if (result && !_.isEmpty(result)) {
        result.map(function (e) {
          data.push(e.race);
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
    updateRaceDto: UpdateRaceDto,
    res: any,
  ): Promise<UpdateRaceDto> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateRaceDto,
      );
      const raceData: any = await this.raceModel
        .findOne({ race: new RegExp('^' + updateRaceDto.race + '$', 'i') })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(raceData) && raceData._id.toString() !== id) {
        return res.json({
          success: false,
          message: mConfig.Race_already_exists,
        });
      } else {
        const result: any = await this.raceModel
          .findByIdAndUpdate(id, updateRaceDto, { new: true })
          .select({ _id: 1 })
          .lean();
        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }
        //send hidden notification to all user
        await this.commonService.sendAllUserHiddenNotification('race_update');
        //add admin log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Race',
          description: 'Race has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Race_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/race/race.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async delete(id: string, res: any): Promise<Race> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const race: any = await this.raceModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!race) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      await this.commonService.sendAllUserHiddenNotification('race_update');
      //add admin log
      const logData = {
        action: 'delete',
        entity_id: race._id,
        entity_name: 'Race',
        description: 'Race has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Race_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/race/race.service.ts-deleteRace',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
