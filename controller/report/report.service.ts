import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report, ReportDocument } from './entities/report.entity';
import { LogService } from '../../common/log.service';

@Injectable()
export class ReportService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Report.name)
    private reportModel: Model<ReportDocument>,
  ) {}
  public async create(createReportDto: CreateReportDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createReportDto,
      );
      const createData = new this.reportModel(createReportDto);
      const data = await createData.save();

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: data._id,
        entity_name: 'Report Forms',
        description: 'New Report form has been created successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        success: true,
        message: mConfig.Report_created,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/report/report.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async findAll(params, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        params,
      );
      const result = await this.reportModel.find(params).lean();

      return res.json({
        data: result,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/report/report.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async update(id: string, updateReportDto: UpdateReportDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateReportDto,
      );
      const data: any = await this.reportModel
        .findByIdAndUpdate(id, updateReportDto, { new: true })
        .select({ _id: 1, type: 1 })
        .lean();

      if (!data) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }
      //send hidden notification to all user
      await this.commonService.sendAllUserHiddenNotification(
        `update_${data.type}`,
      );
      //Add Activity Log
      const logData = {
        action: 'update',
        entity_id: data._id,
        entity_name: 'Report Forms',
        description: 'Report form has been updated successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        success: true,
        message: mConfig.Report_updated,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/report/report.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async remove(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const data: any = await this.reportModel
        .findByIdAndDelete(id)
        .select({ _id: 1, type: 1 })
        .lean();
      if (!data) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }
      //send hidden notification to all user
      await this.commonService.sendAllUserHiddenNotification(
        `update_${data.type}`,
      );

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: data._id,
        entity_name: 'Report Forms',
        description: 'Report form has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Report_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/report/report.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async getReportForm(type, res: any): Promise<Report> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { type },
      );
      if (_.isEmpty(type)) {
        return res.json({
          success: false,
          message: mConfig.type_missing,
        });
      }
      const formData = await this.reportModel
        .findOne({ type })
        .select({ form_data: 1 })
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
        'src/controller/report/report.service.ts-getReportForm',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
