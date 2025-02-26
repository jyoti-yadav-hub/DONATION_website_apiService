/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { CreateFooterStripDto } from './dto/create-footer-strip.dto';
import { UpdateFooterStripDto } from './dto/update-footer-strip.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import {
  FooterStripModel,
  FooterStripDocument,
} from './entities/footer-strip.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { authConfig } from 'src/config/auth.config';
import { LogService } from 'src/common/log.service';

@Injectable()
export class FooterStripService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(FooterStripModel.name)
    private footerStripModel: Model<FooterStripDocument>,
  ) {}

  // Api for footer strip
  public async createFooterStrip(
    createFooterStripDto: CreateFooterStripDto,
    res: any,
  ): Promise<FooterStripDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createFooterStripDto,
      );
      const adminData = this.request.user;
      createFooterStripDto.createdBy = adminData.name;
      createFooterStripDto.updatedBy = adminData.name;
      const create = new this.footerStripModel(createFooterStripDto);
      const data = await create.save();

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: data._id,
        entity_name: 'Footer Strips',
        description: 'Footer Strip has been created successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Footer_strip_created,
        success: true,
        data: data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/footer-strip/footer-strip.service.ts-createFooterStrip',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for update footer strip
  public async updateFooterStrip(
    id: string,
    updateFooterStripDto: UpdateFooterStripDto,
    res: any,
  ): Promise<FooterStripDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateFooterStripDto,
      );
      const data = await this.footerStripModel
        .findById(id)
        .select({ _id: 1, slug: 1 })
        .lean();
      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const adminData = this.request.user;
        updateFooterStripDto.updatedBy = adminData.name;
        await this.footerStripModel
          .findByIdAndUpdate(id, updateFooterStripDto, { new: true })
          .select({ _id: 1 })
          .lean();

        await this.commonService.sendAllUserHiddenNotification(data.slug);

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: data._id,
          entity_name: 'Footer Strips',
          description: 'Footer Strip has been updated successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Footer_strip_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/footer-strip/footer-strip.service.ts-updateFooterStrip',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete footer strip
  public async removeFooterStrip(
    id: string,
    res: any,
  ): Promise<FooterStripDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const data = await this.footerStripModel
        .findByIdAndDelete(id)
        .select({ _id: 1, slug: 1 })
        .lean();
      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      await this.commonService.sendAllUserHiddenNotification(data.slug);

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: data._id,
        entity_name: 'Footer Strips',
        description: 'Footer Strip has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        success: true,
        message: mConfig.Footer_strip_deleted,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/footer-strip/footer-strip.service.ts-removeFooterStrip',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for list footer strip
  public async findAll(param, res: any): Promise<FooterStripDocument[]> {
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
        if (!_.isUndefined(filter.outer_title) && filter.outer_title) {
          const query = await this.commonService.filter(
            operator,
            filter.outer_title,
            'outer_title',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.outer_description) &&
          filter.outer_description
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.outer_description,
            'outer_description',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.inner_title) && filter.inner_title) {
          const query = await this.commonService.filter(
            operator,
            filter.inner_title,
            'inner_title',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.inner_description) &&
          filter.inner_description
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.inner_description,
            'inner_description',
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
        if (!_.isUndefined(filter.url) && filter.url) {
          const query = await this.commonService.filter(
            operator,
            filter.url,
            'url',
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
            operator,
            filter.createdBy,
            'createdBy',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.updatedBy) && filter.updatedBy) {
          const query = await this.commonService.filter(
            operator,
            filter.updatedBy,
            'updatedBy',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'outer_title',
            'outer_description',
            'inner_title',
            'inner_description',
            'slug',
            'url',
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
        outer_title: 'outer_title',
        outer_description: 'outer_description',
        inner_title: 'inner_title',
        inner_description: 'inner_description',
        slug: 'slug',
        url: 'url',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      }
      const total_record = await this.footerStripModel.countDocuments(match).exec();
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

      const result = await this.footerStripModel.aggregate(
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
        'src/controller/footer-strip/footer-strip.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get cms page from given slug
  public async findOne(slug: string, res: any): Promise<FooterStripDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {slug},
      );
      let footerStrip: any = await this.footerStripModel
        .findOne({ slug: slug })
        .lean();
      if (!footerStrip) {
        if (slug === 'ngo-account-blocked-by-admin') {
          footerStrip = {
            url: 'Click here',
            slug: 'ngo-account-blocked-by-admin',
            inner_description:
              "We've detected suspicious activity on your account.Sorry, the organization you are trying to access restricts at-risk users. Please contact Saayam admin.We've detected suspicious activity on yours",
            inner_title: 'Your account is blocked',
            outer_description:
              "To use the NGO & it's services please update registration document",
            outer_title: 'NGO account blocked by Admin',
          };
        } else if (slug === 'upload-registration-document') {
          footerStrip = {
            slug: 'upload-registration-document',
            outer_description:
              "To use the NGO & It's services please update registration document.To use the NGO & It's services please update registration document.",
            outer_title: 'Upload registration document!',
          };
        }
      }
      return res.json({
        success: true,
        data: footerStrip,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/footer-strip/footer-strip.service.ts-findOne',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
