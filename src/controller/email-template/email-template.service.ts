/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { QueueService } from '../../common/queue.service';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import {
  EmailTemplate,
  EmailTemplateDocument,
} from './entities/email-template.entity';
import { authConfig } from 'src/config/auth.config';
import { LogService } from 'src/common/log.service';

@Injectable()
export class EmailTemplateService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly queueService: QueueService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(EmailTemplate.name)
    private emailTemplateModel: Model<EmailTemplateDocument>,
  ) {}

  //Api for create Email template
  public async create(
    createEmailTemplateDto: CreateEmailTemplateDto,
    res: any,
  ): Promise<EmailTemplate> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createEmailTemplateDto,
      );
      const adminData = this.request.user;
      const emailTemplateData = await this.emailTemplateModel
        .findOne({
          email_template_name: new RegExp(
            '^' + createEmailTemplateDto.email_template_name + '$',
            'i',
          ),
        })
        .select({ _id: 1 })
        .lean();

      if (!_.isEmpty(emailTemplateData)) {
        return res.json({
          success: false,
          message: mConfig.Email_template_already_exists,
        });
      } else {
        createEmailTemplateDto.createdBy = adminData.name;
        createEmailTemplateDto.updatedBy = adminData.name;
        const createTemplate = new this.emailTemplateModel(
          createEmailTemplateDto,
        );
        const result = await createTemplate.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Email Templates',
          description: 'Email Template has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Email_Template_created,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/email-template/email-template.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for cms list
  public async findAll(param, res: any): Promise<EmailTemplate[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (
          !_.isUndefined(filter.email_template_name) &&
          filter.email_template_name
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.email_template_name,
            'email_template_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.email_slug) && filter.email_slug) {
          const query = await this.commonService.filter(
            operator,
            filter.email_slug,
            'email_slug',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.email_subject) && filter.email_subject) {
          const query = await this.commonService.filter(
            operator,
            filter.email_subject,
            'email_subject',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            'is',
            filter.status,
            'email_status',
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
            'email_template_name',
            'email_slug',
            'email_subject',
            'email_status',
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
        email_template_name: 'email_template_name',
        email_slug: 'email_slug',
        email_subject: 'email_subject',
        email_status: 'email_status',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };
      const total_record = await this.emailTemplateModel.countDocuments(match).exec();
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

      const result = await this.emailTemplateModel.aggregate(
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
        'src/controller/email-template/email-template.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update email template
  public async update(
    id: string,
    updateEmailTemplateDto: UpdateEmailTemplateDto,
    res: any,
  ): Promise<EmailTemplate> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateEmailTemplateDto,
      );
      const adminData = this.request.user;
      const emailTemplateData: any = await this.emailTemplateModel
        .findOne({
          email_template_name: new RegExp(
            '^' + updateEmailTemplateDto.email_template_name + '$',
            'i',
          ),
        })
        .select({ _id: 1 })
        .lean();

      if (
        !_.isEmpty(emailTemplateData) &&
        emailTemplateData._id.toString() !== id
      ) {
        return res.json({
          success: false,
          message: mConfig.Email_template_already_exists,
        });
      } else {
        updateEmailTemplateDto.updatedBy = adminData.name;
        const result = await this.emailTemplateModel
          .findByIdAndUpdate(id, updateEmailTemplateDto, { new: true })
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
          entity_id: emailTemplateData._id,
          entity_name: 'Email Templates',
          description: 'Email Template has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Email_Template_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/email-template/email-template.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete email template
  public async delete(id: string, res: any): Promise<EmailTemplate> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const template: any = await this.emailTemplateModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!template) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //Add Activity Log
        const logData = {
          action: 'delete',
          entity_id: template._id,
          entity_name: 'Email Templates',
          description: 'Email Template has been deleted successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Email_Template_deleted,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/email-template/email-template.service.ts-delete',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for enable/disable email template
  public async setEmailTemplate(id: string, res: any): Promise<EmailTemplate> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const result: any = await this.emailTemplateModel
        .findById(id)
        .select({ _id: 1, email_status: 1, email_template_name: 1 })
        .lean();

      if (!result) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        let status;
        if (result.email_status === 'Active') {
          status = 'Deactive';
        } else {
          status = 'Active';
        }
        const updateData = {
          email_status: status,
        };

        await this.emailTemplateModel
          .findByIdAndUpdate(id, updateData, {
            new: true,
          })
          .select({ _id: 1 })
          .lean();

        const changeStatus = status === 'Active' ? 'activated' : 'deactivated';
        const updateData1 = {
          '{{template_name}}': result.email_template_name,
          '{{status}}': changeStatus,
        };
        const status_msg = await this.commonService.changeString(
          mConfig.Email_Template_change_status,
          updateData1,
        );

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Email Templates',
          description: `Email Template has been ${changeStatus} successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: status_msg,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/email-template/email-template.service.ts-setEmailTemplate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for find email template
  public async findTemplate(slug: string, res: any): Promise<EmailTemplate> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {slug},
      );
      const data = await this.emailTemplateModel
        .findOne({
          email_slug: slug,
        })
        .select({ email_content: 1 })
        .lean();

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/email-template/email-template.service.ts-findTemplate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
