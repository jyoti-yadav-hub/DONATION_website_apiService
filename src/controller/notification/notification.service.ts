/* eslint-disable prettier/prettier */
import _ from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import {
  Notification,
  NotificationDocument,
} from './entities/notification.entity';
import {
  AdminNotification,
  AdminNotificationDocument,
} from './entities/admin-notification.entity';
import {
  CorporateNotification,
  CorporateNotificationDocument,
} from './entities/corporate-notification.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { LogService } from 'src/common/log.service';
import { UserNotificationDto } from './dto/user-notification.dto';
import { authConfig } from 'src/config/auth.config';

const dotenv = require('dotenv');
const ObjectID = require('mongodb').ObjectID;
dotenv.config({
  path: './.env',
});
import FCM from 'fcm-node';
const fcm = new FCM(process.env.serverKey);

// eslint-disable-next-line @typescript-eslint/no-var-requires
@Injectable()
export class NotificationService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(AdminNotification.name)
    private adminNotificationModel: Model<AdminNotificationDocument>,
    @InjectModel(CorporateNotification.name)
    private corporateNotificationModel: Model<CorporateNotificationDocument>,
  ) {}

  //Api for list Notification
  public async findAll(param, res: any): Promise<Notification[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const query: any = {
        user_id: this.request.user._id,
        hidden: false,
        is_deleted: { $ne: true },
      };
      let modelName;
      if (
        this.request.user.active_type &&
        this.request.user.active_type === 'admin'
      ) {
        modelName = this.adminNotificationModel;
        query.type = { $ne: 'help-request' };
        if (param.help_request && param.help_request == 1) {
          query.type = 'help-request';
        }
      } else {
        modelName = this.notificationModel;
      }

      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        if (!_.isUndefined(filter.title) && filter.title) {
          where.push({
            title: new RegExp(filter.title, 'i'),
          });
        }
        if (!_.isUndefined(filter.message) && filter.message) {
          where.push({
            message: new RegExp(filter.message, 'i'),
          });
        }

        if (!_.isEmpty(where)) {
          query['$and'] = where;
        }
      }

      const sortData = ['_id', 'title', 'message', 'createdAt'];

      const total_record = await modelName.count(query).lean();
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

      const result = await modelName
        .find(query)
        .select({ uuid: 0 })
        .collation({ locale: 'en' })
        .sort(sort)
        .skip(start_from)
        .limit(per_page)
        .lean();

      query.is_read = false;
      const totalUnreadCount = await modelName.count(query).lean();

      return res.json({
        data: result,
        success: true,
        totalUnreadCount,
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
        'src/controller/notification/notification.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for Remove one notification
  public async removeOne(id: string, res: any): Promise<Notification> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      let modelName;
      const activeType = this.request.user.active_type;
      if (activeType && activeType === 'admin') {
        modelName = this.adminNotificationModel;
      } else {
        modelName = this.notificationModel;
      }
      const notification = await modelName
        .findOneAndRemove({ _id: id, user_id: this.request.user._id })
        .select({ _id: 1 })
        .lean();
      if (!notification) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        if (activeType === 'admin') {
          //Add Activity Log
          const logData = {
            action: 'delete',
            entity_id: notification._id,
            entity_name: 'Notifications',
            description: 'Notification has been deleted successfully.',
          };
          this.logService.createAdminLog(logData);
        }

        return res.json({
          message: mConfig.Notification_deleted,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/notification/notification.service.ts-removeOne',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for Remove all notification
  public async removeAll(param, res: any): Promise<Notification> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const query: any = {
        user_id: this.request.user._id,
      };
      let modelName;
      if (
        this.request.user.active_type &&
        this.request.user.active_type === 'admin'
      ) {
        modelName = this.adminNotificationModel;
        query.type = { $ne: 'help-request' };
        if (param && param.help_request && param.help_request == 1) {
          query.type = 'help-request';
        }
      } else {
        modelName = this.notificationModel;
      }
      const notification = await modelName.deleteMany(query).lean();
      if (!notification) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_name: `Notifications`,
        description: 'All Notifications has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Notification_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/notification/notification.service.ts-removeAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get admin notifications badge count
  public async badgeCount(param, res: any): Promise<Notification> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const query: any = {
        user_id: this.request.user._id,
        is_read: false,
        type: { $ne: 'help-request' },
      };
      if (param.help_request && param.help_request == 1) {
        query.type = 'help-request';
      }
      const badge = await this.adminNotificationModel.count(query).lean();
      return res.json({
        data: badge,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/notification/notification.service.ts-badgeCount',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for read all admin notification
  public async readAll(param, type, res: any): Promise<Notification> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const query: any = { user_id: this.request.user._id, is_read: false };
      let modelName;
      if (type === 'admin') {
        modelName = this.adminNotificationModel;
        query.type = { $ne: 'help-request' };
        if (param && param.help_request && param.help_request == 1) {
          query.type = 'help-request';
        }
      } else if (type === 'app') {
        modelName = this.notificationModel;
      }
      await modelName.updateMany(query, { is_read: true }).lean();
      return res.json({
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/notification/notification.service.ts-readAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for read only one notification in app
  public async readOne(id, type, res: any): Promise<Notification> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      let modelName;
      if (type === 'admin') {
        modelName = this.adminNotificationModel;
      } else if (type === 'app') {
        modelName = this.notificationModel;
      }
      await modelName
        .updateOne(
          { user_id: this.request.user._id, is_read: false, _id: id },
          { is_read: true },
        )
        .lean();
      return res.json({
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/notification/notification.service.ts-readOne',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for sent notification
  public async sendNotification(token: any, res: any): Promise<Notification> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { token },
      );
      const message = {
        to: token,
        notification: {
          title: 'Testing Notification',
          body: 'This is testing notification message.',
          sound: 'default',
        },
        data: {
          //you can send only notification or only data(or include both)
          title: 'Testing Notification',
          body: 'This is testing notification message.',
          badge: '100',
        },
        priority: 'high',
      };
      let count = 1;

      fcm.send(message, async function (err, response) {
        count = count + 1;
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/notification/notification.service.ts-sendNotification',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete notifications
  public async deleteManyNotifications(
    ids: any,
    res: any,
  ): Promise<Notification> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { ids },
      );
      const allId = ids;
      const deleteCount = await this.notificationModel
        .deleteMany({
          _id: {
            $in: allId,
          },
        })
        .lean();
      if (deleteCount.deletedCount == 0) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      return res.json({
        message: mConfig.Notification_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/notification/notification.service.ts-deleteManyNotifications',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list corporate Notification
  public async corporateList(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const query: any = {
        user_id: this.request.user._id,
      };

      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        if (!_.isUndefined(filter.title) && filter.title) {
          where.push({
            title: new RegExp(filter.title, 'i'),
          });
        }
        if (!_.isUndefined(filter.message) && filter.message) {
          where.push({
            message: new RegExp(filter.message, 'i'),
          });
        }

        if (!_.isEmpty(where)) {
          query['$and'] = where;
        }
      }

      const sortData = ['_id', 'title', 'message', 'createdAt'];

      const total_record = await this.corporateNotificationModel
        .count(query)
        .lean();
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

      const result = await this.corporateNotificationModel
        .find(query)
        .select({ uuid: 0 })
        .collation({ locale: 'en' })
        .sort(sort)
        .skip(start_from)
        .limit(per_page)
        .lean();

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
        'src/controller/notification/notification.service.ts-corporateList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for send notification to user from admin panel
  public async sendToUser(
    userNotificationDto: UserNotificationDto,
    res: any,
  ): Promise<Notification> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        userNotificationDto,
      );

      for (let i = 0; i < userNotificationDto.user_ids.length; i++) {
        const detail = {
          title: userNotificationDto.title,
          message: userNotificationDto.message,
          user_id: ObjectID(userNotificationDto.user_ids[i]),
          type: 'received-from-admin',
          is_send: false,
          received_from_admin: true,
        };
        const createNotification = new this.notificationModel(detail);
        await createNotification.save();
      }

      return res.json({
        success: true,
        message: mConfig.Notification_sent,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/notification/notification.service.ts-sendToUser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for admin sent notification list
  public async sentByAdmin(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { received_from_admin: true };
      const match2 = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.title) && filter.title) {
          const query = await this.commonService.filter(
            'contains',
            filter.title,
            'title',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.message) && filter.message) {
          const query = await this.commonService.filter(
            'contains',
            filter.message,
            'message',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.user_name) && filter.user_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.user_name,
            'user_name',
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

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'title',
            'message',
            'user_name',
            'createdAt',
            'updatedAt',
          ];
          query = await this.commonService.getGlobalFilter(
            fields,
            filter.search,
          );
        }

        if (!_.isUndefined(filter.search) && !_.isEmpty(query)) {
          match2['$or'] = query;
        }
        if (!_.isEmpty(where)) {
          match2['$and'] = where;
        }
      }

      const lookup = {
        $lookup: {
          from: 'user',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData',
        },
      };
      const unwind = {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: true,
        },
      };
      const addFields = {
        $addFields: {
          user_name: {
            $concat: ['$userData.first_name', ' ', '$userData.last_name'],
          },
        },
      };

      const sortData = {
        _id: '_id',
        title: 'title',
        message: 'message',
        user_name: 'user_name',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      };

      const total = await this.notificationModel
        .aggregate([
          { $match: match },
          lookup,
          unwind,
          addFields,
          { $match: match2 },
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

      const result = await this.notificationModel.aggregate(
        [
          { $match: match },
          lookup,
          unwind,
          addFields,
          { $match: match2 },
          {
            $project: {
              _id: 1,
              title: 1,
              message: 1,
              received_from_admin: 1,
              user_id: 1,
              user_name: 1,
              user_image: 1,
              createdAt: 1,
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
        'src/controller/notification/notification.service.ts-sentByAdmin',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
