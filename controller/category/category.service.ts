/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  RequestModel,
  RequestDocument,
} from '../request/entities/request.entity';
import { authConfig } from '../../config/auth.config';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { LogService } from '../../common/log.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ErrorlogService } from '../error-log/error-log.service';
import { Category, CategoryDocument } from './entities/category.entity';
import { format } from 'path';
import { APIGateway } from 'aws-sdk';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class CategoryService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  //Api for create category
  public async create(
    body: any,
    res: any,
    createType: string,
  ): Promise<Category> {
    try {
      // Create an API log entry to record the incoming request and the data being created
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', body);
      // Check if a category with the same 'category_slug' already exists
      let query: object = {
        category_slug: body.category_slug,
        is_template: { $ne: true },
        is_deleted: { $ne: true },
      };
      if (body.is_template && !_.isUndefined(body.is_template)) {
        query = {
          category_slug: body.category_slug,
          is_template: { $eq: true },
          is_deleted: { $ne: true },
        };
      }
      const category = await this.categoryModel
        .findOne(query)
        .select({ _id: 1, category_slug: 1 })
        .lean();
      if (category) {
        return res.json({
          message: body.is_template
            ? mConfig.Template_exist
            : mConfig.Category_exist,
          success: false,
        });
      } else {
        // Check the 'createType' and set 'is_draft' accordingly
        if (createType === 'draft' && _.isEmpty(body.draft_id)) {
          body.is_draft = true;
        } else if (createType === 'main' && !_.isEmpty(body.draft_id)) {
          body['$unset'] = { is_draft: 1 };
        }

        // Upload files to Amazon S3 if 'icon' and 'image' are provided in the request
        if (body.icon && !_.isUndefined(body.icon)) {
          await this.commonService.uploadFileOnS3(body.icon, 'category');
          body.icon = body.icon ? body.icon : null;
        }

        if (body.image && !_.isUndefined(body.image)) {
          await this.commonService.uploadFileOnS3(body.image, 'category-image');
          body.image = body.image ? body.image : null;
        }

        let result;
        if (body.draft_id) {
          // If 'draft_id' is provided, update the existing category draft
          result = await this.categoryModel
            .findByIdAndUpdate(body.draft_id, body, { new: true })
            .select({ _id: 1, name: 1 })
            .lean();
        } else {
          // Otherwise, create a new category
          body['restore_form_data'] = body.form_settings;
          const createCategory = new this.categoryModel(body);
          result = await createCategory.save();
        }

        // Add an activity log to record the category creation/update
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Causes',
          description:
            createType === 'draft' && body.is_template
              ? `${result.name} cause template has been save as draft.`
              : createType === 'draft' && !body.is_template
              ? `${result.name} cause has been save as draft.`
                ? body.is_template
                : `${result.name} cause template has been created.`
              : `${result.name} cause has been created.`,
        };
        this.logService.createAdminLog(logData);

        // Return a success response indicating the creation/update
        return res.json({
          message:
            createType === 'draft'
              ? mConfig.Draft_saved
              : body.is_template
              ? mConfig.Template_created
              : mConfig.Category_created,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/category.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list category for Admin
  public async findAll(param, res: any): Promise<Category[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
      if (param.allData == 1) {
        // If 'allData' is set to 1, return all categories without filtering or pagination
        const result = await this.categoryModel
          .find({ is_template: { $ne: true } })
          .collation(authConfig.collation)
          .select({ _id: 1, category_slug: 1, name: 1 })
          .sort({ name: 1 })
          .lean();
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
        if (!_.isUndefined(filter.type) && filter.type) {
          if (filter.type === 'template') {
            where.push({ is_template: true });
          } else {
            where.push({ is_template: { $ne: true } });
          }
        }
        if (!_.isUndefined(filter.name) && filter.name) {
          // Filter by 'name'
          const query = await this.commonService.filter(
            'contains',
            filter.name,
            'name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.category_slug) && filter.category_slug) {
          // Filter by 'category_slug'
          const query = await this.commonService.filter(
            'contains',
            filter.category_slug,
            'category_slug',
          );
          where.push(query);
        }
        // Filter by 'description'
        if (!_.isUndefined(filter.description) && filter.description) {
          const query = await this.commonService.filter(
            'contains',
            filter.description,
            'description',
          );
          where.push(query);
        }
        // Filter by 'index'
        if (!_.isUndefined(filter.index) && filter.index) {
          const query = await this.commonService.filter(
            '=',
            filter.index,
            'index',
          );
          where.push(query);
        }
        // Filter by 'createdAt'
        if (!_.isUndefined(filter.createdAt) && filter.createdAt) {
          const query = await this.commonService.filter(
            'date',
            filter.createdAt,
            'createdAt',
          );
          where.push(query);
        }
        // Filter by 'is_category_active'
        if (
          !_.isUndefined(filter.is_category_active) &&
          filter.is_category_active
        ) {
          const query = await this.commonService.filter(
            'is',
            filter.is_category_active,
            'is_category_active',
          );
          where.push(query);
        }
        //filter by search params
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'name',
            'category_slug',
            'description',
            'is_category_active',
            'createdAt',
          ];
          const field = ['index'];
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
        // merge mongo query filter
        if (!_.isUndefined(filter.search) && !_.isEmpty(query)) {
          match['$or'] = query;
        }
        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      const sortData = {
        _id: '_id',
        description: 'description',
        name: 'name',
        category_slug: 'category_slug',
        createdAt: 'createdAt',
        index: 'index',
        is_category_active: 'is_category_active',
      };

      const total_record = await this.categoryModel.countDocuments(match).exec();

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

      const data = await this.categoryModel.aggregate(
        [
          { $match: match },
          { $sort: sort },
          {
            $project: {
              name: 1,
              category_slug: 1,
              icon: {
                $concat: [authConfig.imageUrl, 'category/', '$icon'],
              },
              image: {
                $concat: [authConfig.imageUrl, 'category-image/', '$image'],
              },
              comment_enabled: 1,
              description: 1,
              form_settings: 1,
              header_form: 1,
              index: 1,
              is_category_active: 1,
              is_urgent_help: 1,
              for_fund: 1,
              is_template: 1,
              for_fundraiser: 1,
              for_corporate: 1,
              label_of_count: 1,
              who_can_access: 1,
              createdAt: 1,
              date: 1,
              countries: 1,
              is_draft: 1,
              is_stepper: 1,
            },
          },
          { $skip: start_from },
          { $limit: per_page },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        data: data,
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
        'src/controller/category/category.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update category
  public async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    res: any,
  ): Promise<Category> {
    try {
      // Create an API log entry to record the incoming request and the data being updated
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateCategoryDto,
      );
      // Find the existing category by its ID
      const category = await this.categoryModel
        .findById(id)
        .select({ _id: 1, icon: 1, name: 1, is_template: 1 })
        .lean();
      if (!category) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        // Check if a category with the same 'category_slug' already exists, excluding the current category by ID
        const categoryData = await this.categoryModel
          .findOne({
            category_slug: updateCategoryDto.category_slug,
            _id: { $ne: ObjectID(id) },
          })
          .select({ _id: 1, category_slug: 1 })
          .lean();
        if (categoryData) {
          return res.json({
            message: mConfig.Category_exist,
            success: false,
          });
        } else {
          // Upload updated files to Amazon S3 if 'icon' and 'image' are provided in the request
          await this.commonService.uploadFileOnS3(
            updateCategoryDto.icon,
            'category',
            category.icon,
          );

          await this.commonService.uploadFileOnS3(
            updateCategoryDto.image,
            'category-image',
            category.image,
          );

          updateCategoryDto.icon = updateCategoryDto.icon
            ? updateCategoryDto.icon
            : category.icon;

          updateCategoryDto.image = updateCategoryDto.image
            ? updateCategoryDto.image
            : category.image;

          //store default form for restore form if lost
          if (updateCategoryDto.store_form) {
            updateCategoryDto['restore_form_data'] =
              updateCategoryDto.form_settings;
          }

          await this.categoryModel
            .findByIdAndUpdate(id, updateCategoryDto, { new: true })
            .select({ _id: 1 })
            .lean();

          if (!category.is_template) {
            await this.commonService.sendAllUserHiddenNotification(
              'update_category',
            );
          }

          //Add Activity Log
          const logData = {
            action: 'update',
            entity_id: category._id,
            entity_name: 'Causes',
            description: category.is_template
              ? `${category.name} cause template has been updated.`
              : `${category.name} cause has been updated.`,
          };
          this.logService.createAdminLog(logData);

          return res.json({
            message: category.is_template
              ? mConfig.Template_updated
              : mConfig.Category_updated,
            success: true,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/category.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete category
  public async remove(id: string, res: any): Promise<Category> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'delete', {
        id,
      });
      const category = await this.categoryModel
        .findByIdAndDelete(id)
        .select({ _id: 1, icon: 1, image: 1, name: 1, is_template: 1 })
        .lean();
      if (!category) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //call unlink file function
      await this.commonService.s3ImageRemove('category', category.icon);
      await this.commonService.s3ImageRemove('category-image', category.image);

      if (!category.is_template) {
        await this.commonService.sendAllUserHiddenNotification(
          'update_category',
        );
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: category._id,
        entity_name: 'Causes',
        description: category.is_template
          ? `${category.name} cause template has been deleted.`
          : `${category.name} cause has been deleted.`,
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: category.is_template
          ? mConfig.Template_deleted
          : mConfig.Category_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/category.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list category for app
  public async categoryList(param: any, res: any): Promise<Category[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
      let match: any = {
        is_template: { $ne: true },
        is_category_active: 'active',
      };
      if (!_.isUndefined(param.country) && param.country) {
        match['$or'] = [
          { countries: param.country },
          { countries: { $size: 0 } },
        ];
      }

      //handle type of request
      if (!_.isEmpty(param.fund) && param.fund == 1) {
        match.for_fund = true;
      } else if (!_.isEmpty(param.corporate) && param.corporate == 1) {
        match.for_corporate = true;
      } else {
        match.for_fundraiser = true;
      }

      const data = await this.categoryModel
        .find(match, {
          form_settings: 0,
          restore_form_data: 0,
          is_category_active: 0,
          index: 0,
          countries: 0,
          for_fundraiser: 0,
          for_fund: 0,
          for_corporate: 0,
        })
        .sort({ index: 1 })
        .lean();
      // loop processes each category in the categories array by calculating request counts
      const allData = data.map(async (item) => {
        return new Promise(async (resolve) => {
          if (_.isEmpty(param.fund) && _.isEmpty(param.corporate)) {
            const requestCount = await this.requestModel
              .count({
                category_slug: item.category_slug,
                status: { $in: ['complete', 'delivered'] },
              })
              .lean();
            item.request_count = requestCount;
          }
          item.icon = _.isNull(item.icon)
            ? null
            : authConfig.imageUrl + 'category/' + item.icon;

          item.image = _.isNull(item.image)
            ? null
            : authConfig.imageUrl + 'category-image/' + item.image;
          resolve(item);
        });
      });
      return Promise.all(allData).then((result) => {
        return res.json({
          success: true,
          data: result,
        });
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/category.service.ts-categoryList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get category details
  public async categoryDetail(id: string, res: any): Promise<Category> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', {
        id,
      });
      const categoryDetail = await this.categoryModel.findById(id).lean();
      if (!categoryDetail) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //Replaced object keys icon and image value
        categoryDetail.icon = _.isNull(categoryDetail.icon)
          ? null
          : authConfig.imageUrl + 'category/' + categoryDetail.icon;

        categoryDetail.image = _.isNull(categoryDetail.image)
          ? null
          : authConfig.imageUrl + 'category-image/' + categoryDetail.image;
        return res.json({
          data: categoryDetail,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/category.service.ts-categoryDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list category for Admin
  public async categoryRequestCount(param, res: any): Promise<Category[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
      //Fetch request data category slug wise
      const data = await this.requestModel.aggregate([
        {
          $match: {
            status: { $ne: 'draft' },
            category_slug: { $ne: 'start-fund' },
          },
        },
        {
          $group: {
            _id: '$category_slug',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: 'category_slug',
            as: 'categoryData',
          },
        },
        {
          $unwind: '$categoryData',
        },
        {
          $project: {
            icon: {
              $concat: [authConfig.imageUrl, 'category/', '$categoryData.icon'],
            },
            image: {
              $concat: [
                authConfig.imageUrl,
                'category-image/',
                '$categoryData.image',
              ],
            },
            name: '$categoryData.name',
            category_slug: '$categoryData.category_slug',
            is_category_active: '$categoryData.is_category_active',
            index: '$categoryData.index',
            count: 1,
            _id: '$categoryData._id',
          },
        },
        {
          $sort: { is_category_active: 1, index: 1 },
        },
      ]);

      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      return res.json({
        success: true,
        data: data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/category.service.ts-categoryRequestCount',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for enable/disable category
  public async setCategory(id: string, res: any): Promise<Category> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'put', {
        id,
      });
      const category = await this.categoryModel
        .findById(id)
        .select({ _id: 1, is_category_active: 1, name: 1, is_template: 1 })
        .lean();
      if (!category) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        //Check if category exist, Update status of category
        let status;
        if (category.is_category_active === 'active') {
          status = 'deactive';
        } else {
          status = 'active';
        }

        const updateData = {
          is_category_active: status,
        };

        await this.categoryModel
          .findByIdAndUpdate(id, updateData, { new: true })
          .select({ _id: 1 })
          .lean();

        if (!category.is_template) {
          //send hidden notification to all user
          await this.commonService.sendAllUserHiddenNotification(
            'update_category',
          );
        }

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: category._id,
          entity_name: 'Causes',
          description: category.is_template
            ? `${category.name} cause template has been ${status}.`
            : `${category.name} cause has been ${status}.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: category.is_template
            ? mConfig.Template_status_changed
            : mConfig.Category_status_changed,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/category.service.ts-setCategory',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for restore form
  public async restoreForm(id, res): Promise<Category[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', {
        id,
      });
      const result = await this.categoryModel
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
        'src/controller/category/category.service.ts-restoreForm',
      );
    }
  }

  // Api for get template
  public async getTemplate(id: string, res: any): Promise<Category[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const result = await this.categoryModel
        .findOne({
          _id: ObjectID(id),
          is_template: true,
          is_deleted: { $ne: true },
        })
        .select({ form_settings: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        return res.json({
          success: true,
          data: result && result.form_settings ? result.form_settings : {},
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/category.service.ts-getTemplate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get template list
  public async getTemplateList(param: any, res: any): Promise<Category[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const result = await this.categoryModel
        .find({ is_template: true, is_deleted: { $ne: true } })
        .collation(authConfig.collation)
        .select({ _id: 1, template_name: '$name' })
        .sort({ name: 1 })
        .lean();
      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/category/category.service.ts-getTemplateList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
