/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { PlanModel, PlanDocument } from './entities/plan.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { authConfig } from 'src/config/auth.config';

@Injectable()
export class PlanService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(PlanModel.name) private planModel: Model<PlanDocument>,
  ) {}

  //Api for create Plan
  public async createPlan(
    createPlanDto: CreatePlanDto,
    res: any,
  ): Promise<PlanDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createPlanDto,
      );
      const adminData = this.request.user;
      createPlanDto.createdBy = adminData.name;
      createPlanDto.updatedBy = adminData.name;
      const createCategory = new this.planModel(createPlanDto);
      const data = await createCategory.save();
      return res.json({
        message: mConfig.Plan_created,
        success: true,
        data: data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/plan/plan.service.ts-createPlan',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update Plan
  public async updatePlan(
    id: string,
    updatePlanDto: UpdatePlanDto,
    res: any,
  ): Promise<PlanDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updatePlanDto,
      );
      const adminData = this.request.user;
      const plan = await this.planModel.findById(id).select({ _id: 1 }).lean();
      if (!plan) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const updateDetail: any = {
          title: updatePlanDto.title,
          description: updatePlanDto.description,
          duration: updatePlanDto.duration,
          duration_type: updatePlanDto.duration_type,
          amount: updatePlanDto.amount,
          status: updatePlanDto.status,
          updatedBy: adminData.name,
        };

        await this.planModel
          .findByIdAndUpdate(id, updateDetail, { new: true })
          .select({ _id: 1 })
          .lean();

        return res.json({
          message: mConfig.Plan_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/plan/plan.service.ts-updatePlan',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete Plan
  public async removePlan(id: string, res: any): Promise<PlanDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const plan = await this.planModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!plan) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      return res.json({
        success: true,
        message: mConfig.Plan_deleted,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/plan/plan.service.ts-removePlan',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list category for Admin
  public async findAll(param, res: any): Promise<PlanDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      if (param.allData == 1) {
        const result = await this.planModel.find().lean();
        return res.json({
          success: true,
          data: result,
        });
      }

      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.title) && filter.title) {
          const query = await this.commonService.filter(
            operator,
            filter.title,
            'title',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.description) && filter.description) {
          const query = await this.commonService.filter(
            operator,
            filter.description,
            'description',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.amount) && filter.amount) {
          const query = await this.commonService.filter(
            '=',
            filter.amount,
            'amount',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.duration) && filter.duration) {
          const query = await this.commonService.filter(
            '=',
            filter.duration,
            'duration',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.duration_type) && filter.duration_type) {
          const query = await this.commonService.filter(
            operator,
            filter.duration_type,
            'duration_type',
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
            'title',
            'description',
            'duration_type',
            'status',
            'createdAt',
          ];
          const field = ['amount', 'duration'];
          let stringFilter = await this.commonService.getGlobalFilter(
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
        title: 'title',
        description: 'description',
        amount: 'amount',
        duration: 'duration',
        duration_type: 'duration_type',
        status: 'status',
        createdAt: 'createdAt',
      };

      const total = await this.planModel
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

      const result = await this.planModel.aggregate(
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
        'src/controller/plan/plan.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list category for User
  public async planList(res: any): Promise<PlanDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const result = await this.planModel.find().lean();
      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/plan/plan.service.ts-planList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for enable/disable Plan
  public async setPlan(id: string, res: any): Promise<PlanDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const plan = await this.planModel
        .findById(id)
        .select({ _id: 1, status: 1 })
        .lean();
      let status = 'active';

      if (!plan) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }

      if (plan.status == 'active') {
        status = 'deactive';
      }

      const set = {
        status: status,
      };

      await this.planModel
        .findByIdAndUpdate(id, set, { new: true })
        .select({ _id: 1 })
        .lean();

      return res.json({
        success: true,
        message: mConfig.Plan_status_changed,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/plan.service.ts-setPlan',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
