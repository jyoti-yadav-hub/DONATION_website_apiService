/* eslint-disable prettier/prettier */
import fs from 'fs';
import _ from 'lodash';
import moment from 'moment-timezone';
import FCM from 'fcm-node';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommonService } from './common.service';
import { authConfig } from '../config/auth.config';
import mConfig from '../config/message.config.json';
import {
  TransactionModel,
  TransactionDocument,
} from '../controller/donation/entities/transaction.entity';
import {
  Setting,
  SettingDocument,
} from '../controller/setting/entities/setting.entity';
import {
  SocialData,
  SocialDataDocument,
} from '../controller/users/entities/socialData.entity';
import {
  Category,
  CategoryDocument,
} from '../controller/category/entities/category.entity';
import {
  Queue,
  QueueDocument,
} from '../controller/request/entities/queue-data.entity';
import {
  FoodRequestDocument,
  FoodRequestModel,
} from '../controller/request/entities/food-request.entity';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../controller/request/entities/cause-request.entity';
import { Ngo, NgoDocument } from '../controller/ngo/entities/ngo.entity';
import {
  Notification,
  NotificationDocument,
} from '../controller/notification/entities/notification.entity';
import {
  EmailTemplate,
  EmailTemplateDocument,
} from '../controller/email-template/entities/email-template.entity';
import {
  CommonSetting,
  CommonSettingDocument,
} from '../controller/setting/entities/common-setting.entity';
import {
  HelpRequest,
  HelpRequestDocument,
} from '../controller/help-request/entities/help-request.entity';
import {
  Drive,
  DriveDocument,
} from '../controller/drive/entities/drive.entity';
import { ErrorlogServiceForCron } from '../controller/error-log/error-log.service';
import { User, UserDocument } from '../controller/users/entities/user.entity';
import {
  LastDonorNotificationModel,
  LastDonorNotificationDocument,
} from '../controller/donation/entities/notify-last-donor.entity';
import {
  PaymentProcessModel,
  PaymentProcessDocument,
} from '../controller/donation/entities/payment-process.entity';
import {
  UserToken,
  UserTokenDocument,
} from 'src/controller/users/entities/user-token.entity';
import {
  OtpVerifyModel,
  OtpVerifyDocument,
} from 'src/controller/users/entities/otp-verify';
import { Log, LogDocument } from '../controller/error-log/entities/log.entity';
import { OtpLog, OtpLogDocument } from './entities/otp-log.entity';
import { SmtpLog, SmtpLogDocument } from './entities/smtp-log.entity';
import {
  NotificationLog,
  NotificationLogDocument,
} from './entities/notification-log.entity';
import {
  ErrorLog,
  ErrorLogDocument,
} from 'src/controller/error-log/entities/error-log.entity';
import { ApiLog, ApiLogDocument } from './entities/api-log.entity';
const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
const fcm = new FCM(process.env.serverKey);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectID = require('mongodb').ObjectID;
@Injectable()
export class QueueService {
  constructor(
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogServiceForCron,
    @InjectModel(PaymentProcessModel.name)
    private paymentProcessModel: Model<PaymentProcessDocument>,
    @InjectModel(Queue.name)
    private queueModel: Model<QueueDocument>,
    @InjectModel(Log.name)
    private logModel: Model<LogDocument>,
    @InjectModel(Drive.name)
    private driveModel: Model<DriveDocument>,
    @InjectModel(LastDonorNotificationModel.name)
    private lastDonorNotificationModel: Model<QueueDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(SocialData.name)
    private socialDataModel: Model<SocialDataDocument>,
    @InjectModel(HelpRequest.name)
    private helpRequestModel: Model<HelpRequestDocument>,
    @InjectModel(FoodRequestModel.name)
    private foodRequestModel: Model<FoodRequestDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(EmailTemplate.name)
    private EmailTemplateModel: Model<EmailTemplateDocument>,
    @InjectModel(CommonSetting.name)
    private commonSettingModel: Model<CommonSettingDocument>,
    @InjectModel(Ngo.name) private ngoModel: Model<NgoDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(UserToken.name)
    private userTokenModel: Model<UserTokenDocument>,
    @InjectModel(OtpVerifyModel.name)
    private otpVerifyModel: Model<OtpVerifyDocument>,
    @InjectModel(OtpLog.name)
    private otpLogModel: Model<OtpLogDocument>,
    @InjectModel(SmtpLog.name)
    private smtpLogModel: Model<SmtpLogDocument>,
    @InjectModel(NotificationLog.name)
    private notificationLogModel: Model<NotificationLogDocument>,
    @InjectModel(ErrorLog.name)
    private errorLogModel: Model<ErrorLogDocument>,
    @InjectModel(ApiLog.name)
    private apiLogModel: Model<ApiLogDocument>,
  ) {}

  /**
   * Cron function to remove facebook data from db every 30 minutes
   */
  @Cron('*/30 * * * *')
  async handleCron() {
    let startTime = new Date();
    // return true;
    const date = new Date();
    await this.socialDataModel
      .deleteMany({
        createdAt: {
          $lte: new Date(date.getTime() - 1000 * 60 * 60),
        },
      })
      .lean();

    await this.otpVerifyModel
      .deleteMany({
        is_default: { $exists: false },
        createdAt: {
          $lte: new Date(moment().subtract(30, 'minutes').format()),
        },
      })
      .lean();

    await this.paymentProcessModel
      .deleteMany({
        createdAt: {
          $lte: new Date(moment().subtract(30, 'minutes').format()),
        },
      })
      .lean();
    await this.errorlogService.createLog('handleCron cron', {
      run_time: startTime,
    });
  }

  /**
   * Cron function for send notification to users
   */
  // @Cron('* * * * *')
  // async sendNotification() {
  //   return true;
  //   try {
  //     //find notification from db whish is not send yet
  //     const notification = await this.notificationModel.find({
  //       is_send: false,
  //     });
  //     const _this = this;
  //     Promise.all(
  //       notification.map(async (item: any) => {
  //         if (!_.isEmpty(item.uuid) || !_.isUndefined(item.uuid)) {
  //           let message = {};
  //           if (item.hidden) {
  //             message = {
  //               to: item.uuid,
  //               contentAvailable: 1,
  //               data: {
  //                 //you can send only notification or only data(or include both)
  //                 title: item.title,
  //                 body: item.message,
  //                 type: item.type,
  //                 request_id: item.request_id,
  //                 request_user_id: item.request_user_id,
  //                 category_slug: item.category_slug,
  //                 ngo_id: item.ngo_id,
  //                 additional_data: item.additional_data,
  //               },
  //             };
  //           } else {
  //             message = {
  //               to: item.uuid,
  //               notification: {
  //                 title: item.title,
  //                 body: item.message,
  //               },
  //               data: {
  //                 //you can send only notification or only data(or include both)
  //                 type: item.type,
  //                 request_id: item.request_id,
  //                 request_user_id: item.request_user_id,
  //                 category_slug: item.category_slug,
  //                 ngo_id: item.ngo_id,
  //                 additional_data: item.additional_data,
  //               },
  //             };
  //           }
  //   fcm.send(message, async function (err, response) {
  //     if (err) {
  //       return err;
  //     } else {
  //       await _this.notificationModel
  //       .updateOne({ _id: item._id }, { is_send: true })
  //       .exec();
  //       return response;
  //     }
  //   });
  // }
  //       }),
  //     );
  //   } catch (error) {
  //     return [];
  //   }
  // }

  /**
   * Cron function for send notification to users
   */
  // @Cron('* * * * *')
  // async sendAdminNotification() {
  //   return true;
  //   try {
  //     //find notification from db whish is not send yet
  //     const notification = await this.adminNotificationModel.find({
  //       is_send: false,
  //     });
  //     Promise.all(
  //       notification.map(async (item: any) => {
  //         if (!_.isEmpty(item.uuid)) {
  //           const message = {
  //             registration_ids: item.uuid,
  //             notification: {
  //               title: item.title,
  //               body: item.message,
  //             },
  //             data: {
  //               //you can send only notification or only data(or include both)
  //               type: item.type,
  //               request_id: item.requestId,
  //               category_slug: item.categorySlug,
  //               ngo_id: item.ngoId,
  //               additional_data: item.additionalData,
  //             },
  //           };

  //           fcm.send(message, function (err, response) {
  //             if (err) {
  //               return err;
  //             } else {
  //               return response;
  //             }
  //           });
  //           await this.adminNotificationModel
  //             .updateOne({ _id: item._id }, { is_send: true })
  //             .exec();
  //         }
  //       }),
  //     );
  //   } catch (error) {
  //     return [];
  //   }
  // }

  /**
   * Cron function to delete cancel and completed food request
   */
  @Cron('* * * * *')
  async deleteExpiredFoodRequest() {
    // return true;
    try {
      let startTime = new Date();
      const expireTime = new Date();

      const findRequest = await this.foodRequestModel
        .find({
          category_slug: 'hunger',
          is_deleted: { $ne: true },
          delete_time: { $exists: true, $lte: expireTime },
        })
        .lean();
      if (!_.isEmpty(findRequest)) {
        await Promise.all(
          findRequest.map(async (item: any) => {
            // const files = item.form_data.files;
            // for (const key in files) {
            //   files[key].map(async (item: any) => {
            //     await this.commonService.s3ImageRemove('request', item);
            //   });
            // }
            await this.foodRequestModel
              .findByIdAndUpdate(item._id, { is_deleted: true })
              .exec();
            await this.notificationModel
              .deleteMany({ request_id: item._id })
              .exec();
          }),
        );
      }
      await this.errorlogService.createLog('deleteExpiredFoodRequest cron', {
        run_time: startTime,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-deleteExpiredFoodRequest',
      );
      return [];
    }
  }

  /**
   * Cron function to check plan for feature request is expired
   */
  @Cron('* * * * *')
  async checkFeatureExpired() {
    // return true;
    try {
      let startTime = new Date();
      const date = new Date(moment().startOf('minute').format());

      const findFeatureExpired: any = await this.causeRequestModel
        .find({
          category_slug: { $ne: 'hunger' },
          plan_expired_date: date,
          'plan.is_active': true,
        })
        .lean();
      if (!_.isEmpty(findFeatureExpired)) {
        await findFeatureExpired.map(async (item: any) => {
          const findPlan = await item.plan.find(
            (i: any) => i.is_active == true,
          );
          if (!_.isEmpty(findPlan)) {
            const updateData = {
              is_featured: false,
              $set: {
                'plan.$.is_active': false,
              },
            };
            await this.causeRequestModel
              .findOneAndUpdate(
                { _id: ObjectID(item._id), 'plan.plan_id': findPlan.plan_id },
                updateData,
                {
                  new: true,
                },
              )
              .exec();
            const msg = this.commonService.changeString(
              mConfig.noti_msg_feature_expired,
              {
                '{{title}}': item.form_data.title_of_fundraiser,
                // '{{refId}}': item.reference_id,
              },
            );
            const allInput: any = {
              message: msg,
              title: mConfig.noti_title_feature_expired,
              type: item.category_slug,
              categorySlug: item.category_slug,
              requestId: item._id,
              requestUserId: item.user_id,
            };
            //Get users of ngo
            if (item.user_ngo_id) {
              const ngoUsers = await this.commonService.getNgoUserIds(
                item.user_ngo_id,
              );
              //send  notification to all user
              if (ngoUsers) {
                this.commonService.sendAllNotification(ngoUsers, allInput);
              }
            } else {
              //send notification to specific user
              allInput.userId = item.user_id;
              this.commonService.notification(allInput);
            }
          }
        });
      }
      await this.errorlogService.createLog('checkFeatureExpired cron', {
        run_time: startTime,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-checkFeatureExpired',
      );
      return [];
    }
  }

  /**
   * Cron function to check fundraiser request is expired
   */
  @Cron('* * * * *')
  async checkFundraiserRequestExpired() {
    // return true;
    try {
      let startTime = new Date();

      const date = new Date(moment().startOf('minute').format());

      const findExpiredRequest: any = await this.causeRequestModel
        .find({
          category_slug: { $ne: 'hunger' },
          'form_data.expiry_date': { $lte: date },
          status: {
            $nin: ['expired', 'complete', 'close', 'draft', 'blocked'],
          },
        })
        .lean();
      if (!_.isEmpty(findExpiredRequest)) {
        await findExpiredRequest.map(async (item: any) => {
          await this.causeRequestModel
            .findByIdAndUpdate({ _id: item._id }, { status: 'expired' })
            .exec();

          const updateData1 = {
            '{{cause}}': item.category_name,
            '{{refId}}': item.reference_id,
          };

          const notiTitle = await this.commonService.changeString(
            mConfig.noti_title_fundraiser_req_expired,
            { '{{cause}}': item.category_name },
          );

          const input: any = {
            title: notiTitle,
            type: item.category_slug,
            categorySlug: item.category_slug,
            requestId: item._id,
            requestUserId: item.user_id,
          };

          //send notification to ngo trustees
          let userIds = [];
          if (item.user_ngo_id) {
            userIds = await this.commonService.getNgoUserIds(item.user_ngo_id);
            if (userIds) {
              const msg1 = await this.commonService.changeString(
                mConfig.noti_msg_ngo_req_expired,
                updateData1,
              );
              //send notification to all user
              input.message = msg1;
              this.commonService.sendAllNotification(userIds, input);
            }
          } else {
            const msg2 = await this.commonService.changeString(
              mConfig.noti_msg_your_req_expired,
              updateData1,
            );

            userIds.push(item.user_id);
            input.message = msg2;
            input.userId = item.user_id;
            //send notification to specific user
            this.commonService.notification(input);
          }

          //send notification to admin and all auti users
          const msg3 = await this.commonService.changeString(
            mConfig.request_expired,
            updateData1,
          );
          input.message = msg3;
          //send notification to admin
          await this.commonService.sendAdminNotification(input);
        });
      }
      await this.errorlogService.createLog(
        'checkFundraiserRequestExpired cron',
        { run_time: startTime },
      );
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-checkFundraiserRequestExpired',
      );
      return [];
    }
  }

  /**
   * Cron function send reminder email to expired ngo
   */
  @Cron('0 0 * * *') //every day 12AM
  async sendReminderEmailtoExpiredNgo() {
    // return true;
    try {
      let startTime = new Date();

      const findNGO: any = await this.ngoModel
        .find({
          ngo_status: 'expired',
          is_expired: true,
          $or: [
            { renew_reminder_date: { $exists: false } },
            { renew_reminder_date: { $lte: new Date() } },
          ],
          is_close: {
            $ne: true,
          },
        })
        .select({
          _id: 1,
          ngo_name: '$form_data.ngo_name',
          expiry_date: '$form_data.expiry_date',
          ngo_status: 1,
          renew_reminder_date: 1,
          trustees_name: 1,
          ngo_email: '$form_data.ngo_email',
        })
        .lean();
      const reminder_in_days: any = await this.getSetting(
        'ngo-renew-reminder-days',
      );
      const ngo_last_date_days = await this.getSetting('last-ngo-renew-date');

      if (!_.isEmpty(findNGO) && reminder_in_days) {
        await findNGO.map(async (item: any) => {
          const findOwner = item.trustees_name.filter(function (obj) {
            return obj.is_owner === true;
          })[0];
          // return true;
          const expiry_date = moment(item?.expiry_date).format('X');

          //add days in ngo expiry date
          const ngo_last_date = moment(item?.expiry_date)
            .add(ngo_last_date_days, 'days')
            .format('X');

          //add reminder days
          const reminder_added = item.renew_reminder_date
            ? moment(item?.renew_reminder_date).format('X')
            : moment().format('X');
          const today = moment().format('X');

          //new reminder date
          const new_reminder = item.renew_reminder_date
            ? new Date(
                moment(item.renew_reminder_date)
                  .add(reminder_in_days, 'days')
                  .format(),
              )
            : new Date(moment().add(reminder_in_days, 'days').format());

          if (parseInt(ngo_last_date) < parseInt(today)) {
            await this.ngoModel.updateOne(
              { _id: item._id },
              {
                ngo_status: 'close',
                is_close: true,
              },
            );

            await this.transferNgoFund(findOwner._id, item);
            const input = {
              to: item.ngo_email,
              subject: 'NGO Expired',
              message:
                'Hello, Your NGO is expired due to the certificate and required document not being updated and your donation is transferred in Saayam.',
            };
            await this.commonService.sendMail(input);
          } else if (parseInt(reminder_added) <= parseInt(today)) {
            const input = {
              to: item.ngo_email,
              subject: 'NGO Renew Reminder',
              message:
                'Hello, Your NGO is expired update your NGO certificate and required documents otherwise your donation will be transferred in saayam.',
            };
            await this.commonService.sendMail(input);
            await this.ngoModel
              .updateOne(
                { _id: item._id },
                {
                  renew_reminder_date: new_reminder,
                },
              )
              .lean();
          }
        });
      }
      await this.errorlogService.createLog(
        'sendReminderEmailtoExpiredNgo cron',
        { run_time: startTime },
      );
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-sendReminderEmailtoExpiredNgo',
      );
      return [];
    }
  }

  /**
   * Cron function for delete 7 days before api logs
   */
  @Cron('0 3 * * *') //every day 12AM
  async deleteLogs() {
    try {
      let startTime = new Date();

      // change the below variable to change days dynamically
      const beforeDays = 7;

      const beforeDaysAgoDate = new Date();
      beforeDaysAgoDate.setDate(beforeDaysAgoDate.getDate() - beforeDays);

      // delete api-logs logs
      await this.logModel.deleteMany({
        createdAt: { $lt: beforeDaysAgoDate },
      });

      // delete api_logs logs
      await this.apiLogModel.deleteMany({
        createdAt: { $lt: beforeDaysAgoDate },
      });

      // delete otp logs
      await this.otpLogModel.deleteMany({
        createdAt: { $lt: beforeDaysAgoDate },
      });

      // delete smtp logs
      await this.smtpLogModel.deleteMany({
        createdAt: { $lt: beforeDaysAgoDate },
      });

      // delete notification logs
      await this.notificationLogModel.deleteMany({
        createdAt: { $lt: beforeDaysAgoDate },
      });

      // delete error logs
      await this.errorLogModel.deleteMany({
        createdAt: { $lt: beforeDaysAgoDate },
      });
      await this.errorlogService.createLog('deleteLogs cron', {
        run_time: startTime,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-deleteLogs',
      );
      return [];
    }
  }

  // send last donor notification(run every hour)
  @Cron('0 * * * *')
  async sendLastDonorNotification() {
    try {
      let startTime = new Date();

      const query = {
        next_date: {
          $lte: new Date(),
        },
      };
      const lastDonors = await this.lastDonorNotificationModel.find(query);

      if (!_.isEmpty(lastDonors)) {
        await lastDonors.map(async (item: any) => {
          const requestData: any = await this.causeRequestModel
            .findById({
              _id: item.request_id,
            })
            .select({
              _id: 1,
              status: 1,
              category_slug: 1,
              category_name: 1,
              form_data: 1,
            })
            .lean();

          if (requestData && requestData.status == 'approve') {
            const input: any = {
              title: 'Request remaining amount',
              type: 'remaining_amount',
              requestId: item.request_id,
              categorySlug: requestData.category_slug,
              message: `${requestData.category_name} request ${
                item.request_id
              } ${Number(requestData.form_data.remaining_amount).toFixed(
                2,
              )} amount is remaining to complete the request`,
              userId: item.user_id,
            };
            //send notification to specific user
            await this.commonService.notification(input);
            await this.lastDonorNotificationModel.findOneAndUpdate(
              { _id: item._id },
              { next_date: new Date(moment().add(3, 'day').format()) },
            );
          }
        });
      }
      await this.errorlogService.createLog('sendLastDonorNotification cron', {
        run_time: startTime,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-sendLastDonorNotification',
      );
    }
  }

  // cron for every 2 hour
  @Cron('0 */2 * * *')
  async sendLastUserNotification() {
    try {
      const object = {
        run_time: new Date(),
      };
      let startTime = new Date();
      this.errorlogService.createLog('sendLastUserNotification cron', object);
      // const expiry_days = await this.getSetting('extend-expiry-date');
      // if (expiry_days) {
      // const adddays = new Date(moment().add(expiry_days, 'days').format());
      const query = {
        $and: [
          {
            status: 'approve',
            'form_data.remaining_amount': {
              $exists: true,
            },
            'form_data.reminder_date': {
              $gte: new Date(moment().subtract(2, 'hour').format()),
              $lte: new Date(),
            },
          },
        ],
      };
      const requests = await this.causeRequestModel
        .find(query)
        .select({
          _id: 1,
          category_slug: 1,
          category_name: 1,
          'form_data.remaining_amount': 1,
          user_id: 1,
          'form_data.expiry_date': 1,
          'form_data.reminder_date': 1,
          active_type: 1,
          reference_id: 1,
        })
        .lean();
      if (!_.isEmpty(requests)) {
        //Send notification regard reminder of expiry date
        for (let i = 0; i < requests.length; i++) {
          let reqData: any = requests[i];
          const lastTransaction = await this.transactionModel
            .findOne({ request_id: ObjectID(reqData._id) })
            .sort({ createdAt: -1 });
          if (!_.isEmpty(lastTransaction)) {
            const user = await this.userModel
              .findOne({
                _id: lastTransaction.donor_id,
                is_deleted: false,
              })
              .count();
            if (user > 0) {
              const input: any = {
                title: 'Request remaining amount',
                type: 'remaining_amount',
                requestId: reqData._id,
                categorySlug: reqData.category_slug,
                message: `${reqData.category_name} request ${
                  reqData._id
                } will expire in few days, Only ${Number(
                  reqData.form_data.remaining_amount,
                ).toFixed(2)} amount is remaining to complete the request`,
                userId: lastTransaction.donor_id,
              };
              this.commonService.notification(input);
            }
            const input2: any = {
              title: 'Extend request expiry date reminder',
              type: 'extend_date',
              requestId: reqData._id,
              categorySlug: reqData.category_slug,
              message: `Your ${reqData.category_name} request ${reqData._id} will expire in few days, You can extend your date to complete the request`,
              userId: reqData.user_id,
              additionalData: reqData,
            };
            this.commonService.notification(input2);
          }
          if (i === Number(requests.length - 1)) {
            await this.errorlogService.createLog(
              'sendLastUserNotification cron',
              { run_time: startTime },
            );
          }
        }
      } else {
        await this.errorlogService.createLog('sendLastUserNotification cron', {
          run_time: startTime,
        });
      }
      // }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-sendLastUserNotification',
      );
      return [];
    }
  }

  /**
   * Cron function to remove uploaded images in temp folder every 30 minutes
   */
  @Cron('*/30 * * * *')
  async deleteTempFiles() {
    // return true;
    try {
      let startTime = new Date();

      const tempFolder = 'uploads/temp/';
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      await fs.readdir(tempFolder, async (err, files) => {
        if (!_.isEmpty(files)) {
          await files.forEach((file) => {
            const currentTime = parseInt(
              moment().subtract(1, 'hours').format('X'),
            );
            const input = file;
            const fields = input.split('-');
            const op = fields[0].split('.');
            const fileTimestamp = op[0];
            if (Number(fileTimestamp) < currentTime) {
              // delete file if expired
              fs.unlinkSync(tempFolder + file);
            }
          });
        }
        await this.errorlogService.createLog('deleteTempFiles cron', {
          run_time: startTime,
        });
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-deleteTempFiles',
      );
      return [];
    }
  }

  /**
   * Cron function to execute food request to find donor
   */
  @Cron('*/5 * * * *')
  async findDonorForFood() {
    // return true;
    try {
      let startTime = new Date();

      const date = new Date();
      const query: any = {
        type: 'donor',
        cron_time: {
          $lte: date,
        },
      };
      const queueData = await this.queueModel.find(query).lean();

      if (!_.isEmpty(queueData)) {
        await queueData.map(async (item: any) => {
          const order = {
            request_id: item.request_id,
            radius_km: item.radius,
            max_radius_km: item.max_radius_km,
            accept_time_out: item.accept_time_out,
            limit: item.total_attempt,
            attempt: item.attempt,
          };
          //find donor for food request
          this.manageFoodRequest(order);
        });
      }
      await this.errorlogService.createLog('findDonorForFood cron', {
        run_time: startTime,
      });

      return true;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-findDonorForFood',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Cron function to execute food request to find volunteer
   */
  @Cron('*/5 * * * *')
  async findVolunteerForFood() {
    // return true;
    try {
      let startTime = new Date();
      const date = new Date();
      const query: any = {
        type: 'volunteer',
        cron_time: {
          $lte: date,
        },
      };
      const queueData = await this.queueModel.find(query).lean();

      if (!_.isEmpty(queueData)) {
        await queueData.map(async (item: any) => {
          const order = {
            request_id: item.request_id,
            radius_km: item.radius,
            max_radius_km: item.max_radius_km,
            accept_time_out: item.accept_time_out,
            limit: item.total_attempt,
            attempt: item.attempt,
          };
          this.manageFoodRequestForVolunteer(order);
        });
      }
      await this.errorlogService.createLog('findVolunteerForFood cron', {
        run_time: startTime,
      });

      return true;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-findVolunteerForFood',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Cron function to find volunteer for help request
   */
  @Cron('* * * * *')
  async findVolunteerForHelpRequest() {
    // return true;
    try {
      let startTime = new Date();
      const query: any = {
        type: 'help_request',
      };
      const queueData = await this.queueModel.find(query).lean();

      if (!_.isEmpty(queueData)) {
        await queueData.map(async (item: any) => {
          this.manageHelpRequestForVolunteer(item);
        });
      }
      await this.errorlogService.createLog('findVolunteerForFood cron', {
        run_time: startTime,
      });
      return true;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-findVolunteerForFood',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Cron function to find volunteer for fundraiser request
   */
  @Cron('* * * * *')
  async findVolunteerForFundraiserRequest() {
    // return true;
    try {
      let startTime = new Date();

      const query: any = {
        type: 'fundraiser_request',
      };
      const queueData = await this.queueModel.find(query).lean();

      if (!_.isEmpty(queueData)) {
        await queueData.map(async (item: any) => {
          this.manageFundraiserRequestForVolunteer(item);
        });
      }
      await this.errorlogService.createLog(
        'findVolunteerForFundraiserRequest cron',
        { run_time: startTime },
      );

      return true;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-findVolunteerForFundraiserRequest',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Function to get record from setting using key value
   * @param key
   * @returns
   */
  async getSetting(key) {
    try {
      const data = await this.settingModel
        .findOne({ slug: key })
        .select({ value: 1 })
        .lean();
      let resp: any = '';
      if (!_.isEmpty(data)) {
        resp = data.value;
      }
      return resp;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-getSetting',
      );
      return [];
    }
  }

  /**
   * Function to get request setting data
   * @param key
   * @returns
   */
  async getRequestSetting(country) {
    try {
      const result = await this.commonService.getCommonSetting(country);

      let radiusKm = 1.5;
      let maxRadiusKm = 9;
      let acceptTimeOut = 2;
      if (!_.isEmpty(result) && !_.isEmpty(result.form_data)) {
        const formData = result.form_data;
        radiusKm = formData.radius_in_kilometer;
        maxRadiusKm = formData.max_radius_in_kilometer;
        acceptTimeOut = formData.accept_time_out_in_minute;
      }
      const limit = Math.floor(maxRadiusKm / radiusKm);

      return { radiusKm, maxRadiusKm, acceptTimeOut, limit };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-getRequestSetting',
      );
      return [];
    }
  }

  /**
   * Queue function for get donors based on location
   * @param requestData
   * @param radius
   * @returns Array
   */
  async getDonors(requestData, radius) {
    try {
      let donors = [];
      let ngoDonors = [];
      let exceptIds = [];
      let ngoExceptIds = [];
      if (!_.isEmpty(requestData.donor_id)) {
        exceptIds = _.flattenDeep(requestData.donor_id);
      }
      if (!_.isEmpty(requestData.ngo_donor_ids)) {
        ngoExceptIds = _.flattenDeep(requestData.ngo_donor_ids);
      }
      if (requestData.form_data.food_for_myself) {
        exceptIds.push(requestData.user_id);
        ngoExceptIds.push(requestData.user_id);
      }

      const match: any = {
        is_deleted: false,
        $or: [
          { is_user: true },
          { is_volunteer: true },
          { is_donor: true, my_causes: { $in: [requestData.category_slug] } },
        ],
        _id: { $nin: exceptIds },
        // 'country_data.country': requestData.country_data.country,
      };

      // Check and get Donar who didn't have a restaurant
      let donorDetails = await this.userModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: requestData.location.coordinates,
            },
            distanceField: 'distance',
            maxDistance: radius * 1000,
            distanceMultiplier: 0.001,
            key: 'location',
            query: match,
            spherical: true,
          },
        },
      ]);
      donorDetails.map(async (item) => {
        donors.push(item._id);
      });

      const match1: any = {
        is_deleted: false,
        is_ngo: true,
        'ngo_data.ngo_causes': { $in: [requestData.category_slug] },
        'ngo_data.ngo_status': 'approve',
        _id: { $nin: ngoExceptIds },
        // 'country_data.country': requestData?.country_data?.country,
      };

      donorDetails = await this.userModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: requestData?.location?.coordinates,
            },
            distanceField: 'distance',
            maxDistance: radius * 1000,
            distanceMultiplier: 0.001,
            key: 'ngo_data.ngo_location',
            query: match1,
            spherical: true,
          },
        },
      ]);
      donorDetails.map(async (item) => {
        ngoDonors.push(item._id);
      });
      const finalDonors = donors.map((x) => x.toString());
      const finalNgoDonors = ngoDonors.map((x) => x.toString());
      const newDonors = [...new Set([...finalDonors, ...finalNgoDonors])];

      if (requestData && !_.isEmpty(requestData.donor_id)) {
        donors = requestData.donor_id.concat(donors);
      }
      if (requestData && !_.isEmpty(requestData.ngo_donor_ids)) {
        ngoDonors = requestData.ngo_donor_ids.concat(ngoDonors);
      }
      //In newDonors send merge id and remove duplicate
      const data = {
        newDonors,
        donors,
        ngoDonors,
      };

      return data;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-getDonors',
      );
      return [];
    }
  }

  /**
   * Queue function to execute food request to find donors
   * @param order
   * @param queueData
   * @returns Array
   */
  async manageFoodRequest(order) {
    try {
      const requestId = order.request_id;
      let attempt = 1;
      let donorData: any = [];
      let dowhileExicute = false;
      let haveError = false;
      let removeJob = false;

      const requestData: any = await this.foodRequestModel
        .findOne({ _id: requestId, is_deleted: { $ne: true } })
        .lean();
      if (!_.isEmpty(requestData) && requestData.status === 'pending') {
        if (!_.isEmpty(requestData.accept_donor_ids)) {
          const sortArray = requestData.accept_donor_ids.sort(function (a, b) {
            return a.distance - b.distance;
          });
          //Assigning donor which location is near of food request
          const smallestData = sortArray[0];
          const smallestId = smallestData._id;
          await this.autoAssignDonor(
            requestData,
            smallestData.active_type,
            smallestId,
          );
        } else {
          const categorySlug = requestData.category_slug;

          // Do while start
          do {
            if (dowhileExicute) {
              attempt++;
            } else if (order.attempt) {
              attempt = order.attempt + 1;
            }

            dowhileExicute = true;
            if (attempt <= order.limit) {
              const radius = order.radius_km * attempt;
              donorData = await this.getDonors(requestData, radius);

              const addQueueData: any = {
                request_id: requestId,
                users: donorData.donors,
                ngoUsers: donorData.ngoDonors,
                attempt,
                total_attempt: order.limit,
                radius,
                max_radius_km: order.max_radius_km,
                cron_time: moment().add(order.accept_time_out, 'm'),
                type: 'donor',
                accept_time_out: order.accept_time_out,
              };

              await this.queueModel.updateOne(
                { request_id: requestId },
                addQueueData,
                {
                  upsert: true,
                },
              );
            } else {
              haveError = true;
            }
          } while (attempt <= order.limit && donorData.newDonors.length <= 0);
          // Do while end
          if (attempt <= order.limit && donorData.newDonors.length > 0) {
            await this.foodRequestModel.updateOne(
              { _id: requestId },
              {
                donor_id: donorData.donors,
                ngo_donor_ids: donorData.ngoDonors,
              },
            );

            const msg = await this.commonService.changeString(
              mConfig.noti_msg_request_arrive_for_food,
              {
                '{{category}}': requestData.category_name,
                '{{refId}}': requestData.reference_id,
                '{{persons}}': requestData.form_data.how_many_persons,
              },
            );
            //send push notification to nearby donors and ngos
            const input = {
              message: msg,
              title: mConfig.noti_title_request_arrive,
              type: 'food',
              categorySlug,
              requestId,
              requestUserId: requestData.user_id,
            };

            //Remove user_id from donors array
            let requestUserIds = [];
            if (requestData.user_ngo_id) {
              requestUserIds = await this.commonService.getNgoUserIds(
                requestData.user_ngo_id,
              );
            } else {
              requestUserIds.push(requestData.user_id);
            }
            const notiUserIds = await this.commonService.removeIdFromArray(
              donorData.newDonors,
              requestUserIds,
            );
            //send notification to all user
            if (!_.isEmpty(notiUserIds)) {
              await this.commonService.sendAllNotification(notiUserIds, input);
            }
            return { status: true, attempt };
          } else if (
            attempt > order.limit &&
            requestData.status === 'pending'
          ) {
            let expiretime: any = '';
            const deleteTime = await this.getSetting('request-delete-time');
            if (!_.isEmpty(deleteTime)) {
              expiretime = new Date(moment().add(deleteTime, 'hours').format());
            }

            const msg = await this.commonService.changeString(
              mConfig.noti_msg_no_donor_has_accepted,
              { '{{refId}}': requestData.reference_id },
            );
            // send notification to user if no donors are accepted request. if ngo then send to another user
            const input: any = {
              message: msg,
              title: mConfig.noti_title_request_cancel,
              type: 'food',
              categorySlug,
              requestId,
              requestUserId: requestData.user_id,
            };
            // this.commonService.sendAdminNotification(input);

            //send notification to request user
            let requestUserIds = [];
            if (requestData.user_ngo_id) {
              requestUserIds = await this.commonService.getNgoUserIds(
                requestData.user_ngo_id,
              );
              await this.commonService.sendAllNotification(
                requestUserIds,
                input,
              );
            } else {
              input.userId = requestData.user_id;
              requestUserIds.push(requestData.user_id);
              await this.commonService.notification(input);
            }

            //merge both array
            const finalDonors = requestData.donor_id.map((x) => x.toString());
            const finalNgoDonors = requestData.ngo_donor_ids.map((x) =>
              x.toString(),
            );
            const newDonors = [...new Set([...finalDonors, ...finalNgoDonors])];

            const notiUserIds = await this.commonService.removeIdFromArray(
              newDonors,
              requestUserIds,
            );
            if (!_.isEmpty(notiUserIds)) {
              //send notification to donors
              this.commonService.sendAllNotification(notiUserIds, input);
            }
            //update request collection
            const updateData = {
              $set: {
                ngo_donor_ids: null,
                donor_id: null,
                status: 'cancelled',
                cancelled_by: 'auto',
                cancelled_at: new Date(),
                delete_time: expiretime ? expiretime : new Date(),
              },
            };
            await this.foodRequestModel.updateOne(
              { _id: requestId },
              updateData,
            );

            removeJob = true;
          }
          if (haveError) {
            removeJob = true;
          }
        }
      } else {
        removeJob = true;
      }
      if (removeJob) {
        await this.queueModel.deleteOne({
          request_id: requestId,
          type: 'donor',
        });
        return { removeJob: true };
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-manageFoodRequest',
      );
      return { status: true };
    }
  }

  /**
   * Queue function for get volunteers based on location
   * @param requestData
   * @param radius
   * @returns Array
   */
  async getVolunteer(requestData, radius) {
    try {
      let volunteers = [];
      let ngoVolunteers = [];
      const exceptIds: any = [requestData.donor_id];
      const ngoExceptIds: any = [requestData.donor_id];
      exceptIds.push(...requestData.volunteer_id);
      ngoExceptIds.push(...requestData.ngo_volunteer_ids);

      let volunteerDetails = await this.userModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [
                requestData.donor_accept.lng,
                requestData.donor_accept.lat,
              ],
            },
            key: 'current_location',
            distanceField: 'distance',
            maxDistance: radius * 1000,
            distanceMultiplier: 0.001,
            query: {
              $or: [
                { is_user: true },
                { is_volunteer: true },
                {
                  is_donor: true,
                  my_causes: { $in: [requestData.category_slug] },
                },
              ],
              _id: { $nin: exceptIds },
              is_deleted: false,
              // 'country_data.country': requestData?.country_data?.country,
            },
            spherical: true,
          },
        },
      ]);

      volunteerDetails.map(async (item) => {
        volunteers.push(item._id);
      });

      const match1 = {
        is_ngo: true,
        'ngo_data.ngo_causes': { $in: [requestData.category_slug] },
        'ngo_data.ngo_status': 'approve',
        _id: { $nin: ngoExceptIds },
        is_deleted: false,
        // 'country_data.country': requestData?.country_data?.country,
      };
      volunteerDetails = await this.userModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [
                requestData.donor_accept.lng,
                requestData.donor_accept.lat,
              ],
            },
            distanceField: 'distance',
            maxDistance: radius * 1000,
            distanceMultiplier: 0.001,
            key: 'ngo_data.ngo_location',
            query: match1,
            spherical: true,
          },
        },
      ]);
      volunteerDetails.map(async (item) => {
        ngoVolunteers.push(item._id);
      });

      const finalVolunteers = volunteers.map((x) => x.toString());
      const finalNgoVolunteers = ngoVolunteers.map((x) => x.toString());
      const newVolunteers = [
        ...new Set([...finalVolunteers, ...finalNgoVolunteers]),
      ];
      volunteers = requestData.volunteer_id.concat(volunteers);
      ngoVolunteers = requestData.ngo_volunteer_ids.concat(ngoVolunteers);
      const data = {
        newVolunteers,
        volunteers,
        ngoVolunteers,
      };

      return data;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-getVolunteer',
      );
      return [];
    }
  }

  async getHelpRequestVolunteer(requestData, radius) {
    try {
      const volunteers = [];
      // const exceptIds: any = [];

      const volunteerDetails = await this.userModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [
                requestData.location.coordinates[0],
                requestData.location.coordinates[1],
              ],
            },
            key: 'location',
            distanceField: 'distance',
            maxDistance: radius * 1000,
            distanceMultiplier: 0.001,
            query: {
              is_volunteer: true,
              is_ngo: { $ne: true },
              is_deleted: false,
              // _id: { $nin: exceptIds },
              is_guest: { $ne: true },
            },
            spherical: true,
          },
        },
      ]);
      volunteerDetails.map(async (item) => {
        volunteers.push(item._id);
      });

      return volunteers;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-getHelpRequestVolunteer',
      );
      return [];
    }
  }

  /**
   * Queue function to execute food request to find volunteers
   * @param order
   * @param queueData
   * @returns Array
   */
  async manageFoodRequestForVolunteer(order) {
    try {
      const requestId = order.request_id;

      let attempt = 1;
      let dowhileExicute = false;

      /* call getDonors function */
      let volunteerData: any = [];
      let haveError = false;
      let removeJob = false;
      const requestData = await this.foodRequestModel
        .findOne({ _id: requestId, is_deleted: { $ne: true } })
        .lean();

      if (
        !_.isEmpty(requestData) &&
        (requestData.status == 'waiting_for_volunteer' ||
          requestData.status == 'donor_accept')
      ) {
        if (!_.isEmpty(requestData.accept_volunteer_ids)) {
          //Automatic assigned volnteer for food request
          await this.autoAssignVolunteer(requestData, null, null);
        } else {
          const categorySlug = requestData.category_slug;

          // Do while start
          do {
            if (dowhileExicute) {
              attempt++;
            } else if (order.attempt) {
              attempt = order.attempt + 1;
            }
            dowhileExicute = true;

            if (attempt <= order.limit) {
              const radius = order.radius_km * attempt;
              volunteerData = await this.getVolunteer(requestData, radius);

              const addQueueData: any = {
                request_id: requestId,
                users: volunteerData.volunteers,
                ngoUsers: volunteerData.ngoVolunteers,
                attempt,
                total_attempt: order.limit,
                radius,
                max_radius_km: order.max_radius_km,
                cron_time: moment().add(order.accept_time_out, 'm'),
                type: 'volunteer',
                accept_time_out: order.accept_time_out,
              };

              await this.queueModel.updateOne(
                { request_id: requestId },
                addQueueData,
                {
                  upsert: true,
                },
              );
            } else {
              haveError = true;
            }
          } while (
            attempt <= order.limit &&
            volunteerData.newVolunteers.length <= 0
          );

          if (
            attempt <= order.limit &&
            volunteerData.newVolunteers.length > 0
          ) {
            const query: any = {
              volunteer_id: volunteerData.volunteers,
              ngo_volunteer_ids: volunteerData.ngoVolunteers,
            };

            if ((attempt = 1)) {
              query.status = 'waiting_for_volunteer';

              const msg = await this.commonService.changeString(
                mConfig.noti_msg_donor_waiting_for_volunteer,
                {
                  '{{donor_name}}': requestData.donor_accept.user_name,
                  // '{{refId}}': requestData.reference_id,
                },
              );
              //send push notification to user
              const input: any = {
                message: msg,
                title: mConfig.noti_title_waiting_for_volunteer,
                type: 'food',
                categorySlug,
                requestId,
                requestUserId: requestData.user_id,
              };
              const removeNotiIds = [requestData.donor_id];
              //send notification to user
              if (
                requestData.user_id.toString() !==
                requestData.donor_id.toString()
              ) {
                input.userId = requestData.user_id;
                await this.commonService.notification(input);
                removeNotiIds.push(requestData.user_id);
              }

              //send notification to trustee of user ngo
              if (requestData.user_ngo_id) {
                const ngoUser = await this.commonService.getNgoUserIds(
                  requestData.user_ngo_id,
                  requestData.user_id,
                );
                if (
                  ngoUser &&
                  ngoUser.toString() !== requestData.donor_id.toString()
                ) {
                  removeNotiIds.push(ngoUser);
                  input.userId = ngoUser;
                  await this.commonService.notification(input);
                }
              }
              //send notification to trustee of donor ngo
              if (requestData.donor_ngo_id) {
                const ngoUser = await this.commonService.getNgoUserIds(
                  requestData.donor_ngo_id,
                  requestData.donor_id,
                );

                if (
                  ngoUser &&
                  !removeNotiIds
                    .map((s) => s.toString())
                    .includes(ngoUser.toString())
                ) {
                  removeNotiIds.push(ngoUser);
                  const msg2 = await this.commonService.changeString(
                    mConfig.noti_msg_donor_waiting_for_volunteer2,
                    {
                      '{{donor_name}}': requestData.donor_accept.user_name,
                      // '{{refId}}': requestData.reference_id,
                    },
                  );

                  input.message = msg2;
                  input.userId = ngoUser;
                  await this.commonService.notification(input);
                }
              }
              //send notification to admin
              // this.commonService.sendAdminNotification(input);
            }

            await this.foodRequestModel.findOneAndUpdate(
              { _id: requestId },
              query,
              {
                new: true,
              },
            );

            //send push notification to all volunteers
            const deliverMsg = await this.commonService.changeString(
              mConfig.noti_msg_food_deliver_request,
              {
                '{{donor_name}}': requestData.donor_accept
                  ? requestData.donor_accept.user_name
                  : 'Donor',
              },
            );
            const input1 = {
              message: deliverMsg,
              title: mConfig.noti_title_delivery_request,
              type: 'food',
              categorySlug,
              requestId,
            };

            //merge both array
            const finalVolunteers = volunteerData.volunteers.map((x) =>
              x.toString(),
            );
            const finalNgoVolunteers = volunteerData.ngoVolunteers.map((x) =>
              x.toString(),
            );
            const newVolunteers = [
              ...new Set([...finalVolunteers, ...finalNgoVolunteers]),
            ];

            this.commonService.sendAllNotification(newVolunteers, input1);
            return { status: true, attempt };
          } else if (
            (attempt =
              order.limit + 1 &&
              requestData.status == 'waiting_for_volunteer' &&
              _.isUndefined(requestData.noVolunteer))
          ) {
            await this.queueModel.deleteOne({
              request_id: requestId,
              type: 'volunteer',
            });

            const msg2 = await this.commonService.changeString(
              mConfig.noti_msg_no_volunteer_available,
              { '{{refId}}': requestData.reference_id },
            );
            // send notification to user if no donors are accepted request.
            let notiUser1 = [];
            const input = {
              message: msg2,
              title: mConfig.noti_title_no_volunteer_available,
              type: 'food',
              categorySlug,
              requestId,
            };
            //send notification to user and trustee of user ngo
            if (requestData.user_ngo_id) {
              notiUser1 = await this.commonService.getNgoUserIds(
                requestData.user_ngo_id,
              );
            } else {
              notiUser1.push(requestData.user_id);
            }
            //send notification to trustee of donor ngo
            if (requestData && requestData.donor_ngo_id) {
              const notiId = await this.commonService.getNgoUserIds(
                requestData.donor_ngo_id,
                requestData.donor_id,
              );
              if (
                notiId &&
                !notiUser1.map((s) => s.toString()).includes(notiId.toString())
              ) {
                notiUser1.push(notiId);
              }
            }
            //send notification to donor
            if (
              !notiUser1
                .map((s) => s.toString())
                .includes(requestData.donor_id.toString())
            ) {
              notiUser1.push(requestData.donor_id);
            }
            this.commonService.sendAllNotification(notiUser1, input);
            // this.commonService.sendAdminNotification(input);

            const msg3 = await this.commonService.changeString(
              mConfig.noti_msg_no_volunteer_has_accepted,
              { '{{refId}}': requestData.reference_id },
            );

            //send notification to all volunteers
            const allInput = {
              message: msg3,
              title: mConfig.noti_title_no_volunteer_available,
              type: 'food',
              categorySlug,
              requestId,
            };

            const finalVolunteers = requestData.volunteer_id.map((x) =>
              x.toString(),
            );
            const finalNgoVolunteers = requestData.ngo_volunteer_ids.map((x) =>
              x.toString(),
            );
            const newVolunteers = [
              ...new Set([...finalVolunteers, ...finalNgoVolunteers]),
            ];

            const volunteerIds = await this.commonService.removeIdFromArray(
              newVolunteers,
              notiUser1,
            );
            this.commonService.sendAllNotification(volunteerIds, allInput);
            //update request collection
            const updateData = {
              $set: {
                noVolunteer: true,
                ngo_volunteer_ids: null,
                volunteer_id: null,
              },
            };
            await this.foodRequestModel.updateOne(
              { _id: requestId },
              updateData,
              {
                new: true,
              },
            );
            removeJob = true;
          }

          if (haveError) {
            removeJob = true;
          }
        }
      } else {
        removeJob = true;
      }
      if (removeJob) {
        await this.queueModel.deleteOne({
          request_id: requestId,
          type: 'volunteer',
        });
        return { removeJob: true };
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-manageFoodRequestForVolunteer',
      );
      return { status: true };
    }
  }

  async manageHelpRequestForVolunteer(item) {
    try {
      // call getDonors function
      let updateData;
      const requestData: any = await this.helpRequestModel
        .findOne({ _id: item.request_id })
        .lean();
      if (!_.isEmpty(requestData)) {
        // Do while start

        const volunteerData: any = await this.getHelpRequestVolunteer(
          requestData,
          item.max_radius_km,
        );

        if (_.isEmpty(volunteerData)) {
          updateData = {
            noVolunteer: true,
            status: 'pending',
          };

          await this.helpRequestModel
            .findOneAndUpdate(
              { _id: requestData._id },
              { $set: updateData },
              {
                new: true,
              },
            )
            .lean();
          //send notification to admin
          const input: any = {
            title: mConfig.noti_msg_admin_volunteer_not_found,
            type: 'help-request',
            requestId: requestData._id,
            message: mConfig.noti_title_admin_volunteer_not_found,
          };
          await this.commonService.sendAdminNotification(input);
        } else {
          updateData = {
            volunteer_id: volunteerData,
          };

          await this.helpRequestModel
            .findOneAndUpdate(
              { _id: requestData._id },
              { $set: updateData },
              {
                new: true,
              },
            )
            .lean();

          //send notification to all volunteers
          const input1 = {
            message: mConfig.noti_msg_new_help_request,
            title: mConfig.noti_title_new_help_request,
            type: 'help_volunteer_assign',
            categorySlug: 'help-request',
            requestId: requestData._id,
          };
          await this.commonService.sendAllNotification(volunteerData, input1);
        }
        await this.queueModel.deleteOne({
          request_id: requestData._id,
          type: 'help_request',
        });

        return { status: true };
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-manageHelpRequestForVolunteer',
      );
      return { status: true };
    }
  }

  async manageFundraiserRequestForVolunteer(item) {
    try {
      // call getDonors function
      let updateData;
      const requestData: any = await this.causeRequestModel
        .findOne({ _id: item.request_id })
        .lean();
      if (!_.isEmpty(requestData)) {
        // Do while start

        const volunteerData: any = await this.getHelpRequestVolunteer(
          requestData,
          item.max_radius_km,
        );

        if (_.isEmpty(volunteerData)) {
          updateData = {
            noVolunteer: true,
            status: 'pending',
          };

          await this.causeRequestModel
            .findOneAndUpdate(
              { _id: requestData._id },
              { $set: updateData },
              {
                new: true,
              },
            )
            .lean();
          //send notification to admin
          const input: any = {
            title: mConfig.noti_msg_volunteer_not_found,
            type: 'fundraiser-request',
            requestId: requestData._id,
            message: mConfig.noti_title_admin_volunteer_not_found,
          };
          await this.commonService.sendAdminNotification(input);
        } else {
          updateData = {
            volunteer_id: volunteerData,
          };

          await this.causeRequestModel
            .findOneAndUpdate(
              { _id: requestData._id },
              { $set: updateData },
              {
                new: true,
              },
            )
            .lean();

          //send notification to all volunteers
          const input1 = {
            message: mConfig.noti_msg_new_fundraiser_request,
            title: mConfig.noti_title_new_fundraiser_request,
            type: 'fundraiser_volunteer_assign',
            categorySlug: 'fundraiser-request',
            requestId: requestData._id,
          };
          await this.commonService.sendAllNotification(volunteerData, input1);
        }
        await this.queueModel.deleteOne({
          request_id: requestData._id,
          type: 'fundraiser_request',
        });

        return { status: true };
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-manageFundraiserRequestForVolunteer',
      );
      return { status: true };
    }
  }

  /**
   * Find nearest donor and auto assign request
   *
   */
  async autoAssignDonor(data, activeType, smallestId) {
    try {
      const userDetail: any = await this.userModel
        .findById(smallestId, {
          first_name: 1,
          display_name: 1,
          last_name: 1,
          _id: 1,
          is_restaurant: 1,
          restaurant_location: 1,
          restaurant_name: 1,
          location: 1,
          ngo_data: 1,
          country_data: 1,
          phone: 1,
          phone_code: 1,
          image: 1,
        })
        .lean();

      const userName = userDetail.display_name
        ? userDetail.display_name
        : userDetail.first_name + ' ' + userDetail.last_name;
      let address = '';
      let lat = '';
      let lng = '';
      let restaurant_name = '';
      if (activeType === 'ngo') {
        address = userDetail.ngo_data.ngo_location.city
          ? userDetail.ngo_data.ngo_location.city
          : null;
        lat = userDetail.ngo_data.ngo_location.coordinates[1]
          ? userDetail.ngo_data.ngo_location.coordinates[1]
          : null;
        lng = userDetail.ngo_data.ngo_location.coordinates[0]
          ? userDetail.ngo_data.ngo_location.coordinates[0]
          : null;
      } else {
        if (userDetail && userDetail.is_restaurant) {
          address =
            userDetail.restaurant_location &&
            userDetail.restaurant_location.city
              ? userDetail.restaurant_location.city
              : '';
          lat =
            userDetail.restaurant_location &&
            userDetail.restaurant_location.coordinates[1]
              ? userDetail.restaurant_location.coordinates[1]
              : '';
          lng =
            userDetail.restaurant_location &&
            userDetail.restaurant_location.coordinates[0]
              ? userDetail.restaurant_location.coordinates[0]
              : '';
          restaurant_name =
            userDetail.restaurant_name && userDetail.restaurant_name
              ? userDetail.restaurant_name
              : '';
        } else if (userDetail && userDetail.location) {
          address = userDetail.location.city ? userDetail.location.city : '';
          lat =
            userDetail.location && userDetail.location.coordinates[1]
              ? userDetail.location.coordinates[1]
              : '';
          lng =
            userDetail.location && userDetail.location.coordinates[0]
              ? userDetail.location.coordinates[0]
              : '';
        }
      }

      const details: any = {
        donor_id: ObjectID(smallestId),
        delete_time: new Date(moment().add(1, 'day').format()),
        status: 'donor_accept',
        donor_accept: {
          user_name: userName,
          country_code: userDetail.country_data.country_code,
          phone: userDetail.phone_code + userDetail.phone,
          image: _.isNull(userDetail.image)
            ? userDetail.image
            : authConfig.imageUrl + 'user/' + userDetail.image,
          address,
          lat,
          lng,
          restaurant_name,
          accept_time: new Date(),
        },
        accept_donor_ids: null,
        ngo_donor_ids: null,
        ngo_ids: null,
      };

      activeType === 'ngo'
        ? (details.donor_ngo_id = userDetail.ngo_data._id)
        : false;

      const requestData = await this.foodRequestModel
        .findByIdAndUpdate({ _id: data._id }, details, { new: true })
        .select({
          _id: 1,
          user_id: 1,
          user_ngo_id: 1,
          donor_id: 1,
          category_slug: 1,
          reference_id: 1,
          'donor_accept.user_name': 1,
          donor_ngo_id: 1,
        })
        .lean();

      const removeUserIds = [requestData.user_id];
      const updateData1 = {
        '{{refId}}': requestData.reference_id,
        '{{donor_name}}': requestData.donor_accept.user_name,
      };
      const msg1 = await this.commonService.changeString(
        mConfig.noti_msg_req_assign_to_donor,
        updateData1,
      );
      //send push notification to user
      const input: any = {
        message: msg1,
        title: mConfig.noti_title_request_assigned,
        type: 'food',
        requestId: requestData._id,
        categorySlug: requestData.category_slug,
        userId: requestData.user_id,
        requestUserId: requestData.user_id,
      };

      //send notification to user
      if (requestData.user_id.toString() !== requestData.donor_id.toString()) {
        await this.commonService.notification(input);
      }
      //send notification to trustee of user ngo
      if (requestData.user_ngo_id) {
        const notiId = await this.commonService.getNgoUserIds(
          requestData.user_ngo_id,
          requestData.user_id,
        );
        if (notiId) {
          if (notiId.toString() === requestData.donor_id.toString()) {
            const msg2 = await this.commonService.changeString(
              mConfig.noti_msg_food_req_assign,
              updateData1,
            );
            input.message = msg2;
          } else {
            const msg3 = await this.commonService.changeString(
              mConfig.noti_msg_req_assign_donor,
              updateData1,
            );
            input.message = msg3;
          }
          removeUserIds.push(notiId);
          input.userId = notiId;
          await this.commonService.notification(input);
        }
      }

      //send notification to trustee of donor ngo
      if (requestData.donor_ngo_id) {
        const notiId = await this.commonService.getNgoUserIds(
          requestData.donor_ngo_id,
          requestData.donor_id,
        );
        if (
          notiId &&
          !removeUserIds.map((s) => s.toString()).includes(notiId.toString())
        ) {
          const msg4 = await this.commonService.changeString(
            mConfig.noti_msg_req_assign_my_ngo,
            updateData1,
          );
          input.message = msg4;
          input.userId = notiId;
          removeUserIds.push(notiId);
          await this.commonService.notification(input);
        }
      }
      //send notification to donor of request
      if (
        !removeUserIds
          .map((s) => s.toString())
          .includes(requestData.donor_id.toString())
      ) {
        const msg5 = await this.commonService.changeString(
          mConfig.noti_msg_food_req_assign_user,
          updateData1,
        );

        input.message = msg5;
        input.userId = requestData.donor_id;
        removeUserIds.push(requestData.donor_id);
        await this.commonService.notification(input);
      }

      const msg6 = await this.commonService.changeString(
        mConfig.noti_msg_req_assign_another,
        updateData1,
      );
      //send push notification to other donors and Ngos
      const allInput = {
        message: msg6,
        title: mConfig.noti_title_req_assign_another,
        type: 'food',
        requestId: data._id,
        categorySlug: data.category_slug,
        requestUserId: data.user_id,
      };

      //send request assign notification to all remain donors
      if (data.accept_donor_ids && data.accept_donor_ids.length > 0) {
        const findDonorIds = data.accept_donor_ids.map((d) => {
          return d._id;
        });
        // const finalDonors = data.donor_id.map((x) => x.toString());
        // const finalNgoDonors = data.ngo_donor_ids.map((x) => x.toString());
        // const findDonorIds = [...new Set([...finalDonors, ...finalNgoDonors])];

        const notiUserIds = await this.commonService.removeIdFromArray(
          findDonorIds,
          removeUserIds,
        );
        if (notiUserIds.length > 0) {
          this.commonService.sendAllNotification(notiUserIds, allInput);
        }
      }

      await this.queueModel.deleteOne({
        request_id: data._id,
        type: 'donor',
      });

      return {
        success: true,
      };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-autoAssignDonor',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Find nearest volunteer and auto assign request
   *
   */
  async autoAssignVolunteer(data, activeType, smallestId) {
    try {
      if (!activeType && !smallestId) {
        const volunteerIds = data.accept_volunteer_ids;
        await Promise.all(
          volunteerIds.map(async (item) => {
            const match: any = {
              _id: ObjectID(item._id),
              is_deleted: { $ne: true },
            };
            // find distance between volunteer current location and donor location
            const volunteerData: any = await this.userModel.aggregate([
              {
                $geoNear: {
                  near: {
                    type: 'Point',
                    coordinates: [data.donor_accept.lng, data.donor_accept.lat],
                  },
                  distanceField: 'distance',
                  key: 'current_location',
                  distanceMultiplier: 0.001,
                  query: match,
                  spherical: true,
                },
              },
            ]);
            item.distance = volunteerData[0]?.distance;
          }),
        );

        //Find nearest voluteer from donor location
        const sortArray = volunteerIds.sort(function (a, b) {
          return a.distance - b.distance;
        });
        const smallestData = sortArray[0];
        smallestId = smallestData._id;
        activeType = smallestData.active_type;
      }
      const userDetail: any = await this.userModel.findById(smallestId, {
        first_name: 1,
        display_name: 1,
        last_name: 1,
        _id: 1,
        location: 1,
        current_location: 1,
        ngo_data: 1,
        country_data: 1,
        phone: 1,
        phone_code: 1,
        image: 1,
      });
      const userId: any = userDetail._id.toString();
      const userName = userDetail.display_name
        ? userDetail.display_name
        : userDetail.first_name + ' ' + userDetail.last_name;

      let address = '';
      let lat = '';
      let lng = '';
      if (activeType === 'ngo') {
        address =
          userDetail.ngo_data &&
          userDetail.ngo_data.ngo_location &&
          userDetail.ngo_data.ngo_location.city
            ? userDetail.ngo_data.ngo_location.city
            : '';
      } else {
        address = userDetail.location.city ? userDetail.location.city : '';
      }
      if (userDetail && userDetail.current_location) {
        lat =
          userDetail.current_location && userDetail.current_location[1]
            ? userDetail.current_location[1]
            : '';
        lng =
          userDetail.current_location && userDetail.current_location[0]
            ? userDetail.current_location[0]
            : '';
      }

      const details: any = {
        volunteer_id: ObjectID(userId),
        status:
          data.donor_id.toString() === smallestId
            ? 'pickup'
            : 'volunteer_accept',
        volunteer_accept: {
          user_name: userName,
          country_code: userDetail.country_data.country_code,
          phone: userDetail.phone_code + userDetail.phone,
          image: userDetail.image,
          address,
          lat,
          lng,
          accept_time: new Date(),
        },
        accept_volunteer_ids: null,
        ngo_volunteer_ids: null,
        ngo_ids: null,
      };

      const updatedData = await this.foodRequestModel
        .findByIdAndUpdate({ _id: data._id }, details, { new: true })
        .exec();

      await this.queueModel.deleteOne({
        request_id: data._id,
        type: 'volunteer',
      });
      const updateData = {
        '{{refId}}': updatedData.reference_id,
        '{{volunteer_name}}': updatedData.volunteer_accept.user_name,
      };
      const msg1 = await this.commonService.changeString(
        mConfig.noti_msg_req_assign_to_volunteer,
        updateData,
      );
      const removeNotiIds = [];
      const input: any = {
        message: msg1,
        title: mConfig.noti_title_request_assigned,
        type: 'food',
        requestId: updatedData._id,
        categorySlug: updatedData.category_slug,
        requestUserId: updatedData.user_id,
      };
      //send push notification to user
      if (
        updatedData.user_id.toString() === updatedData.volunteer_id.toString()
      ) {
        const msg2 = await this.commonService.changeString(
          mConfig.noti_msg_food_req_assign_me,
          updateData,
        );
        input.message = msg2;
      }
      input.userId = updatedData.user_id;
      removeNotiIds.push(updatedData.user_id);
      await this.commonService.notification(input);

      //send push notification to trustee of user ngo
      if (updatedData.user_ngo_id) {
        const notiId = await this.commonService.getNgoUserIds(
          updatedData.user_ngo_id,
          updatedData.user_id,
        );
        if (notiId) {
          if (notiId.toString() === updatedData.volunteer_id.toString()) {
            const msg3 = await this.commonService.changeString(
              mConfig.noti_msg_food_req_assign,
              updateData,
            );
            input.message = msg3;
          } else {
            const msg4 = await this.commonService.changeString(
              mConfig.noti_msg_food_req_assign_volunteer,
              updateData,
            );
            input.message = msg4;
          }
          input.userId = notiId;
          removeNotiIds.push(notiId);
          await this.commonService.notification(input);
        }
      }

      //send notification to trustee of donor ngo
      if (updatedData.donor_ngo_id) {
        const notiId = await this.commonService.getNgoUserIds(
          updatedData.donor_ngo_id,
          updatedData.donor_id,
        );
        if (
          notiId &&
          !removeNotiIds.map((s) => s.toString()).includes(notiId.toString())
        ) {
          if (notiId.toString() === updatedData.volunteer_id.toString()) {
            const msg4 = await this.commonService.changeString(
              mConfig.noti_msg_food_req_assign_user,
              updateData,
            );

            input.message = msg4;
          } else {
            const msg4 = await this.commonService.changeString(
              mConfig.noti_msg_req_assign_another_volunteer,
              updateData,
            );

            input.message = msg4;
          }
          input.userId = notiId;
          removeNotiIds.push(notiId);
          await this.commonService.notification(input);
        }
      }
      //send notification to donor
      if (
        !removeNotiIds
          .map((s) => s.toString())
          .includes(updatedData.donor_id.toString())
      ) {
        if (
          updatedData.donor_id.toString() ===
          updatedData.volunteer_id.toString()
        ) {
          const msg4 = await this.commonService.changeString(
            mConfig.noti_msg_food_req_assign_user,
            updateData,
          );
          input.message = msg4;
        } else {
          const msg4 = await this.commonService.changeString(
            mConfig.noti_msg_req_assign_another_volunteer,
            updateData,
          );
          input.message = msg4;
        }
        input.userId = updatedData.donor_id;
        removeNotiIds.push(updatedData.donor_id);
        await this.commonService.notification(input);
      }
      //send notification to trustee of volunteer volunteer
      if (updatedData.volunteer_ngo_id) {
        const notiId = await this.commonService.getNgoUserIds(
          updatedData.volunteer_ngo_id,
          updatedData.volunteer_id,
        );
        if (
          notiId &&
          !removeNotiIds.map((s) => s.toString()).includes(notiId.toString())
        ) {
          const msg4 = await this.commonService.changeString(
            mConfig.noti_msg_food_req_assign_ngo,
            updateData,
          );
          input.message = msg4;
          input.userId = notiId;
          removeNotiIds.push(notiId);
          await this.commonService.notification(input);
        }
      }
      //send notification to volunteer
      if (
        !removeNotiIds
          .map((s) => s.toString())
          .includes(updatedData.volunteer_id.toString())
      ) {
        const msg4 = await this.commonService.changeString(
          mConfig.noti_msg_food_req_assign_user,
          updateData,
        );
        input.message = msg4;
        input.userId = updatedData.volunteer_id;
        removeNotiIds.push(updatedData.volunteer_id);
        await this.commonService.notification(input);
      }

      const updateData3 = {
        '{{refId}}': data.reference_id,
      };
      const msg6 = await this.commonService.changeString(
        mConfig.noti_msg_food_req_assign_another_volunteer,
        updateData3,
      );

      //send push notification to other volunteers
      const allInput = {
        message: msg6,
        title: mConfig.noti_title_request_accepted,
        type: 'food',
        requestId: data._id,
        categorySlug: data.category_slug,
        requestUserId: data.user_id,
      };

      if (data.accept_volunteer_ids && data.accept_volunteer_ids.length > 0) {
        const findVolunteerIds = data.accept_volunteer_ids.map((d) => {
          return d._id;
        });

        const notiUserIds = await this.commonService.removeIdFromArray(
          findVolunteerIds,
          removeNotiIds,
        );
        //send notification to all user
        if (notiUserIds.length > 0) {
          this.commonService.sendAllNotification(notiUserIds, allInput);
        }
      }

      const requestData = await this.commonService.getFoodRequest(data._id);
      return {
        success: true,
        data: requestData,
      };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-autoAssignVolunteer',
        data,
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Common function for get details of user(return when user data updated)
   * @param userId
   * @returns
   */
  async getUserDetail(userId, platform = null) {
    try {
      let userData: any = await this.userModel
        .aggregate([
          {
            $match: { _id: ObjectID(userId) },
          },
          {
            $project: {
              _id: 1,
              is_deleted: 1,
              blocked: 1,
              my_request: 1,
              default_country: 1,
              country_data: 1,
              time_zone: 1,
              my_causes: 1,
              is_veg: 1,
              restaurant_location: 1,
              restaurant_name: 1,
              is_restaurant: 1,
              location: 1,
              is_volunteer: 1,
              is_donor: 1,
              is_user: 1,
              image: {
                $ifNull: [
                  { $concat: [authConfig.imageUrl, 'user/', '$image'] },
                  null,
                ],
              },
              email: 1,
              phone_country_short_name: 1,
              phone_country_full_name: 1,
              phone: 1,
              phone_code: 1,
              display_name: 1,
              last_name: 1,
              first_name: 1,
              createdAt: 1,
              dob: 1,
              blood_group: 1,
              gender: 1,
              race: 1,
              religion: 1,
              is_ngo: 1,
              ngo_id: 1,
              is_corporate: 1,
              is_corporate_user: 1,
              corporate_id: 1,
            },
          },
        ])
        .exec();

      if (!_.isEmpty(userData) && !_.isEmpty(userData[0])) {
        userData = userData[0];
        const badge: any = await this.commonService.badgeCount(userData._id);
        userData.badge = badge;

        //if user has NGO then return NGO data in profile
        let ngoData: any = {};
        if (userData.is_ngo) {
          ngoData = await this.commonService.getNGODetailForApp(
            userData.ngo_id,
          );

          userData.ngo_detail = ngoData;
          ngoData = {
            ngo_causes: ngoData.ngo_causes,
            is_enable: ngoData.is_enable,
            ngo_status: ngoData.ngo_status,
            is_expired: ngoData.is_expired,
          };
        }

        //if user has corporate account then return corporate data in profile
        let corporateData: any = {};
        if (userData.is_corporate || userData.is_corporate_user) {
          corporateData = await this.commonService.getCorporateDetail(
            userData.corporate_id,
            'app',
            userData._id,
          );
          userData.corporate_data = corporateData;
          corporateData = {
            is_corporate: userData.is_corporate,
            corporate_causes: corporateData.causes,
          };
        }

        const userD = {
          is_donor: userData.is_donor,
          is_user: userData.is_user,
          is_volunteer: userData.is_volunteer,
          my_causes: userData.my_causes,
        };
        const {
          userCauses,
          ngoCauses,
          corporateCauses,
          createType,
          allowDonationType,
        } = await this.userCauses(userD, ngoData, corporateData);

        userData.user = userCauses;
        userData.ngo = ngoCauses;
        userData.corporate = corporateCauses;
        userData.create_type = createType;
        userData.allowDonationType = allowDonationType;

        const totalDonation = await this.transactionModel
          .count({
            donor_id: ObjectID(userData._id),
            saayam_community: { $ne: true },
            transaction_type: {
              $in: ['ngo-donation', 'donation', 'fund-donated'],
            },
          })
          .lean();

        const foodDonated = await this.foodRequestModel
          .count({
            category_slug: 'hunger',
            donor_id: ObjectID(userData._id),
            status: 'delivered',
            is_deleted: { $exists: false },
          })
          .lean();

        const query = {
          category_slug: { $ne: 'hunger' },
          active_type: { $ne: 'ngo' },
          user_id: ObjectID(userData._id),
          status: { $ne: 'draft' },
          is_deleted: { $ne: true },
        };

        const fundraiser = await this.causeRequestModel.count(query).lean();
        query['form_data.request_for_self'] = true;
        const myFundraiser = await this.causeRequestModel.count(query).lean();

        userData.totalDonation = totalDonation;
        userData.my_fundraiser = myFundraiser;
        userData.fundraiser = fundraiser;
        userData.food_donated = foodDonated;

        const userReqData: any = await this.findUserRequestData(userId);
        userData.request_data = userReqData;
        return userData;
      }
      return [];
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-getUserDetail',
        userId,
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Find all requests of user (manage multiple request handling)
   *
   */
  async findUserRequestData(userId) {
    try {
      userId = ObjectID(userId);
      const match = {
        $or: [
          { donor_id: userId, status: { $nin: ['pending'] } },
          {
            volunteer_id: userId,
            status: { $in: ['volunteer_accept', 'pickup'] },
          },
          { user_id: userId },
        ],
        status: { $nin: ['cancelled', 'delivered'] },
        category_slug: 'hunger',
        is_deleted: { $exists: false },
      };

      const causeData = await this.foodRequestModel.aggregate([
        { $match: match },
        {
          $project: {
            _id: 1,
            reference_id: 1,
            category_slug: 1,
            active_type: 1,
            category_name: 1,
            user_id: 1,
            uname: 1,
            location: 1,
            'form_data.how_many_persons': 1,
            'form_data.deliver_before': 1,
            'form_data.vegetarian': 1,
            upload_cover_photo: {
              $map: {
                input: '$form_data.files.upload_cover_photo',
                as: 'request_cover_photo',
                in: {
                  $concat: [
                    authConfig.imageUrl,
                    'request/',
                    '$$request_cover_photo',
                  ],
                },
              },
            },
            status: 1,
            country_data: 1,
            createdAt: 1,
            updatedAt: 1,
            volunteer_id: 1,
            ngo_volunteer_ids: 1,
            user_ngo_id: 1,
            donor_ngo_id: 1,
            volunteer_ngo_id: 1,
            donor_id: 1,
            ngo_donor_ids: 1,
            ngo_ids: 1,
            accept_volunteer_ids: 1,
            image_url: authConfig.imageUrl + 'request/',
          },
        },
      ]);

      if (!_.isEmpty(causeData)) {
        await Promise.all(
          causeData.map(async (cause: any) => {
            if (
              cause.donor_id &&
              cause.donor_id.toString() === userId.toString()
            ) {
              cause.current_type = 'Donor';
            }
            if (
              cause.volunteer_id &&
              cause.volunteer_id.toString() === userId.toString()
            ) {
              cause.current_type = 'Volunteer';
            }
            if (
              cause.user_id &&
              cause.user_id.toString() === userId.toString()
            ) {
              cause.current_type = 'Benificiary';
            }
          }),
        );
      }
      return causeData;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-findUserRequestData',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Cron function to send notifications to ngo if expiring
   */
  @Cron('0 9 * * *')
  async sendNgoExpiryNotification() {
    try {
      let startTime = new Date();
      const after30Days = moment().tz('UTC').add(30, 'd').format('YYYY-MM-DD');
      const after15Days = moment().tz('UTC').add(15, 'd').format('YYYY-MM-DD');
      const after7Days = moment().tz('UTC').add(7, 'd').format('YYYY-MM-DD');
      const today = moment().tz('UTC').format('YYYY-MM-DD');
      const yesterday = moment()
        .tz('UTC')
        .subtract(1, 'd')
        .format('YYYY-MM-DD');

      const ngoList = await this.ngoModel
        .aggregate([
          {
            $addFields: {
              expiryDate: {
                $dateToString: {
                  date: {
                    $dateFromString: {
                      dateString: '$form_data.expiry_date',
                    },
                  },
                  format: '%Y-%m-%d',
                },
              },
            },
          },
          {
            $match: {
              expiryDate: {
                $in: [today, after7Days, after15Days, after30Days, yesterday],
              },
              is_expired: { $ne: true },
            },
          },
          {
            $project: {
              _id: 1,
              expiry_date: '$form_data.expiry_date',
              trustees_name: 1,
              expiryDate: 1,
              ngo_email: '$form_data.ngo_email',
            },
          },
        ])
        .exec();

      if (!_.isEmpty(ngoList)) {
        await Promise.all(
          ngoList.map(async (item: any) => {
            let expiry_date = item.expiryDate;
            var msg = '';
            let title = 'NGO expiring';
            if (expiry_date == after30Days) {
              msg = 'Your NGO is expiring in 30 days.';
            } else if (expiry_date == after15Days) {
              msg = 'Your NGO is expiring in 15 days.';
            } else if (expiry_date == after7Days) {
              msg = 'Your NGO is expiring in 7 days.';
            } else if (expiry_date == today) {
              msg = 'Your NGO is expiring today.';
            } else if (expiry_date == yesterday) {
              title = 'NGO expired';
              msg = 'Your NGO is expired.';
              let ngoId = item._id;
              await this.ngoModel
                .findByIdAndUpdate(
                  { _id: ngoId },
                  { ngo_status: 'expired', is_expired: true },
                  { new: true },
                )
                .lean();

              await this.userModel
                .updateMany(
                  { 'ngo_data._id': ngoId, is_deleted: false },
                  { $set: { 'ngo_data.ngo_status': 'expired' } },
                )
                .lean();
            }

            const users = item.trustees_name;
            await users.map(async (user: any) => {
              if (!_.isEmpty(user)) {
                const input: any = {
                  title: title,
                  type: 'ngo',
                  message: msg,
                  ngoId: item._id,
                  userId: user._id,
                };
                await this.commonService.notification(input);
              }
            });

            const mailData: any = {
              to: item.ngo_email,
              subject: title,
              message: msg,
            };
            await this.commonService.sendMail(mailData);
          }),
        );
      }
      await this.errorlogService.createLog('sendNgoExpiryNotification cron', {
        run_time: startTime,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-sendNgoExpiryNotification',
      );
      return [];
    }
  }

  // /**
  //  * Cron function to change ngo status to expired
  //  */
  // @Cron('*/15 * * * *')
  // async changeNgoStatus() {
  //   try {
  //     const today = moment().tz('UTC').toISOString();

  //     const ngoList = await this.ngoModel
  //       .find(
  //         {
  //           expiry_date: { $lte: new Date(today) },
  //           $or: [{ is_expired: { $exists: false } }, { is_expired: false }],
  //         },
  //         { _id: 1, expiry_date: 1 },
  //       )
  //       .lean();

  //     if (!_.isEmpty(ngoList)) {
  //       Promise.all(
  //         ngoList.map(async (item: any) => {
  //           let ngoId = item._id;
  //           await this.ngoModel
  //             .findByIdAndUpdate(
  //               { _id: ngoId },
  //               { ngo_status: 'expired', is_expired: true },
  //               { new: true },
  //             )
  //             .lean();
  //         }),
  //       );
  //     }
  //   } catch (error) {
  //     this.errorlogService.errorLog(
  //       error,
  //       'src/common/queue.service.ts-changeNgoStatus',
  //     );
  //     return [];
  //   }
  // }

  /**
   * Cron function to import csv files
   */
  @Cron('*/10 * * * *')
  async importCsvFiles() {
    let startTime = new Date();
    await this.commonService.importCsv();
    this.errorlogService.createLog('importCsvFiles cron', {
      run_time: startTime,
    });
  }

  /**
   * function for transfer expired ngo donation to saayam
   * @param user_id
   * @param ngoData
   * @returns
   */

  public async transferNgoFund(user_id, ngoData) {
    try {
      const userData: any = await this.userModel
        .findById(user_id)
        .select({
          _id: 1,
          display_name: 1,
          first_name: 1,
          last_name: 1,
          country_data: 1,
          stripe_customer_id: 1,
          email: 1,
          phone: 1,
        })
        .lean();

      const ngoTotalDonation = await this.ngoModel.aggregate([
        { $match: { _id: ObjectID(ngoData._id) } },
        {
          $lookup: {
            from: 'transactions',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user_id', '$$id'] },
                      { $eq: ['$transaction_type', 'ngo-donation'] },
                      { $ne: ['$saayam_community', true] },
                    ],
                  },
                },
              },
            ],
            as: 'transactionData',
          },
        },
        { $unwind: '$transactionData' },
        {
          $group: {
            _id: '$transactionData.user_id',
            total_amount: {
              $sum: '$transactionData.converted_amt',
            },
          },
        },
      ]);

      if (!_.isEmpty(ngoTotalDonation)) {
        const fixedAmount = Number(
          ngoTotalDonation[0].total_amount.toFixed(10),
        );
        const countryData = {
          country: userData.country_data.country,
          country_code: userData.country_data.country_code,
          currency: userData.country_data.currency[0].symbol,
          currency_code: userData.country_data.currency[0].name,
        };
        if (fixedAmount > 0) {
          const insertData: any = {
            amount: fixedAmount,
            campaign_name: ngoData.ngo_name,
            is_contribute_anonymously: false,
            is_tax_benefit: false,
            tax_number: '',
            active_type: 'donor',
            country_data: countryData,
            tip_included: false,
            tip_charge: 0,
            tip_amount: 0,
            transaction_charge: 0,
            transaction_amount: 0,
            total_amount: fixedAmount,
            note: '',
            manage_fees: 'include',
            status: 'complete',
            payment_status: 'completed',
            currency: countryData.currency,
            paymentMethod: 'card',
            donor_id: ngoData._id,
            donor_user_id: ngoData._id,
            user_name: ngoData.ngo_name,
            donor_name: ngoData.ngo_name,
            receipt_number: await this.commonService.nextReceiptNum(
              userData._id,
            ),
            is_donor_ngo: true,
            is_user_ngo: false,
            transaction_type: 'ngo-donation',
            saayam_community: true,
            converted_amt: fixedAmount,
            converted_total_amt: fixedAmount,
            currency_code: countryData.currency_code,
          };

          const usdAmount = await this.commonService.getExchangeRate(
            countryData.currency_code,
            'usd',
            fixedAmount,
          );
          if (usdAmount['status'] == true) {
            insertData.amount_usd = usdAmount['amount'];
            insertData.exchange_rate = usdAmount['rate'];
          }

          const createDonateData = await new this.transactionModel(insertData);
          await createDonateData.save();
        }
      }
      return true;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-transferNgoFund',
      );
    }
  }

  public async userCauses(userData, ngoData, corporateData = null) {
    try {
      let myCauses = [];
      let causes = [];
      const categoryData = await this.categoryModel
        .find(
          { is_category_active: 'active', is_fundraiser: true },
          { category_slug: 1, who_can_access: 1 },
        )
        .lean();
      const catCauses = categoryData.map((cat) => {
        return cat.category_slug;
      });

      if (userData.is_donor && !userData.is_user && !userData.is_volunteer) {
        myCauses = userData.my_causes;
      } else {
        myCauses = catCauses;
      }
      causes = myCauses;

      if (ngoData && !_.isEmpty(ngoData) && !_.isEmpty(ngoData?.ngo_causes)) {
        causes = causes.concat(
          ngoData.ngo_causes.filter((item) => causes.indexOf(item) < 0),
        );
      }
      if (
        corporateData &&
        !_.isEmpty(corporateData) &&
        !_.isEmpty(corporateData?.corporate_causes)
      ) {
        causes = causes.concat(
          corporateData.corporate_causes.filter(
            (item) => causes.indexOf(item) < 0,
          ),
        );
      }

      const createType = [];
      const userCauses = [];
      const ngoCauses = [];
      const corporateCauses = [];
      const allowDonationType = [];
      if (userData.is_volunteer) allowDonationType.push('volunteer');
      if (userData.is_user) allowDonationType.push('user');
      if (userData.is_donor) allowDonationType.push('donor');
      if (
        corporateData &&
        (corporateData.is_corporate || corporateData.is_corporate_user)
      )
        allowDonationType.push('corporate');
      if (ngoData && ngoData.is_enable && ngoData.ngo_status === 'approve')
        allowDonationType.push('ngo');

      for (let i = 0; i < causes.length; i++) {
        const obj = {};
        const causeName = causes[i];
        const result = categoryData.filter(
          (cat) => cat.category_slug === causes[i],
        );
        const whoCanAccess: any = result?.[0]?.who_can_access || [];
        if (myCauses.includes(causes[i])) {
          if (userData.is_user && whoCanAccess?.includes('user')) {
            if (!userCauses.includes(causes[i])) userCauses.push(causes[i]);
            obj[causeName] = 'user';
          }
          if (userData.is_volunteer && whoCanAccess?.includes('volunteer')) {
            if (!userCauses.includes(causes[i])) userCauses.push(causes[i]);
            if (_.isEmpty(obj[causeName])) obj[causeName] = 'volunteer';
          }
          if (userData.is_donor && whoCanAccess?.includes('donor')) {
            if (!userCauses.includes(causes[i])) userCauses.push(causes[i]);
            if (_.isEmpty(obj[causeName])) obj[causeName] = 'donor';
          }
        }

        if (
          ngoData &&
          ngoData.ngo_causes &&
          ngoData.ngo_causes.includes(causes[i])
        ) {
          if (
            ngoData.is_enable &&
            ngoData.ngo_status === 'approve' &&
            !ngoData.is_expired &&
            whoCanAccess?.includes('ngo')
          ) {
            //For donation type popup
            //ngo status pending but allow it's true so he can create fundraiser
            ngoCauses.push(causes[i]);
            if (_.isEmpty(obj[causeName])) obj[causeName] = 'ngo';
          }
        }

        if (
          corporateData &&
          corporateData.corporate_causes &&
          corporateData.corporate_causes.includes(causes[i]) &&
          whoCanAccess?.includes('corporate')
        ) {
          corporateCauses.push(causes[i]);
          if (_.isEmpty(obj[causeName])) obj[causeName] = 'corporate';
        }
        if (!_.isEmpty(obj)) createType.push(obj);
      }
      return {
        userCauses,
        ngoCauses,
        corporateCauses,
        createType,
        allowDonationType,
      };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/common/queue.service.ts-userCauses',
      );
    }
  }

  /**
   * Cron function to sync currency exchange rates
   */
  @Cron('0 0 * * *') //every day 12AM
  async syncCurrencyRates() {
    let startTime = new Date();
    await this.commonService.getLatestExchangeRates();
    this.errorlogService.createLog('syncCurrencyRates cron', {
      run_time: startTime,
    });
  }

  /**
   * Cron function to delete expired access tokens from table
   */
  @Cron('0 1 * * *')
  async deleteExpiredAccessTokens() {
    let startTime = new Date();
    // return true;
    await this.userTokenModel
      .deleteMany({
        expiry_date: { $lte: new Date() },
      })
      .lean();
    this.errorlogService.createLog('deleteExpiredAccessTokens cron', {
      run_time: startTime,
    });
  }

  /**
   * Cron function to send notification if drive is already started
   */
  @Cron('* * * * *')
  async driveStarted() {
    const date = new Date();
    let startTime = new Date();
    const findDrive = await this.driveModel
      .aggregate([
        {
          $addFields: {
            startedDate: { $toDate: '$form_data.start_date_time' },
            expiryDate: { $toDate: '$form_data.end_date_time' },
          },
        },
        {
          $match: {
            is_deleted: { $ne: true },
            $or: [
              {
                startedDate: {
                  $lte: date,
                },
                status: 'approve',
                is_started: { $ne: true },
              },
              {
                expiryDate: {
                  $lte: date,
                },
                status: 'ongoing',
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            'form_data.start_date_time': 1,
            'form_data.end_date_time': 1,
            'form_data.title_of_fundraiser': 1,
            status: 1,
            startedDate: 1,
            expiryDate: 1,
            volunteers: 1,
            user_id: 1,
            reference_id: 1,
          },
        },
      ])
      .exec();

    if (!_.isEmpty(findDrive)) {
      await findDrive.map(async (item: any) => {
        let updateData;
        let title;
        let type;
        let msg;

        if (item.startedDate < date && item.status == 'approve') {
          updateData = {
            is_started: true,
            status: 'ongoing',
          };
          type = 'drive-started';
          title = mConfig.noti_title_drive_started;
          msg = await this.commonService.changeString(
            mConfig.noti_msg_drive_started,
            {
              '{{drive_name}}': item.form_data.title_of_fundraiser,
              '{{refId}}': item.reference_id,
            },
          );
        } else if (item.expiryDate < date && item.status == 'ongoing') {
          updateData = { status: 'complete', $unset: { is_started: 1 } };
          type = 'drive-completed';
          title = mConfig.noti_title_drive_completed;
          msg = await this.commonService.changeString(
            mConfig.noti_msg_drive_complete,
            {
              '{{drive_name}}': item.form_data.title_of_fundraiser,
              '{{refId}}': item.reference_id,
            },
          );
        }

        await this.driveModel
          .findByIdAndUpdate({ _id: item._id }, updateData)
          .lean();

        const input: any = {
          title: title,
          type: type,
          categorySlug: 'drive',
          requestId: item._id,
          requestUserId: item.user_id,
          message: msg,
        };

        //send notification to volunteers
        const volunteers = await item.volunteers.map(function (obj) {
          return obj.user_id;
        });
        await this.commonService.sendAllNotification(volunteers, input);

        //if drive completed
        await this.commonService.sendAdminNotification(input);
      });
    }
    await this.errorlogService.createLog('driveStarted cron', {
      run_time: startTime,
    });
  }

  /**
   * Cron function for send notification to users
   */
  @Cron('* * * * *')
  async sendNotification() {
    try {
      let startTime = new Date();
      //find notification from db which is not send yet
      const notification = await this.notificationModel.find({
        is_send: false,
      });
      const _this = this;
      await Promise.all(
        notification.map(async (item: any) => {
          const uuid: any = await this.commonService.getUuid(item.user_id);

          let message: any = {
            notification: {
              title: item.title,
              body: item.message,
            },
            contentAvailable: 1,
            data: {
              type: item.type,
            },
          };
          if (Array.isArray(uuid)) {
            message.registration_ids = uuid;
          } else {
            message.to = uuid;
          }

          fcm.send(message, async function (err, response) {
            await _this.notificationModel
              .updateOne({ _id: item._id }, { is_send: true })
              .exec();
            return response;
          });
        }),
      );
      await this.errorlogService.createLog('sendNotification cron', {
        run_time: startTime,
      });
    } catch (error) {
      return [];
    }
  }
  /*
   * Cron function to import today's exchange rates
   */
  // @Cron('0 0 * * *') //every day 12AM
  // async getLatestCurrencyRates() {
  //   await this.commonService.getCurrencyRates();
  // }
}
