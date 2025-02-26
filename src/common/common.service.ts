/* eslint-disable prettier/prettier */
import fs from 'fs';
import ip from 'ip';
const fsPromise = require('fs/promises');
import _ from 'lodash';
import FCM from 'fcm-node';
import { REQUEST } from '@nestjs/core';
import moment from 'moment-timezone';
import request from 'request';
import { Model } from 'mongoose';
import { createWriteStream } from 'fs';
import { code, flag } from 'country-emoji';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from '../config/auth.config';
import { ToWords } from 'to-words';
import nodemailer from 'nodemailer';
import {
  Admin,
  AdminDocument,
} from '../controller/admin/entities/admin.entity';
import mConfig from '../config/message.config.json';
import {
  RequestDocument,
  RequestModel,
} from '../controller/request/entities/request.entity';
import {
  adminToken,
  adminTokenDocument,
} from '../controller/admin/entities/adminToken.entity';
import {
  CurrencyModel,
  CurrencyDocument,
} from '../controller/currency/entities/currency.entity';
import {
  NgoUpdated,
  NgoUpdatedDocument,
} from '../controller/ngo/entities/ngo_updated_data.entity';
import {
  TransactionDocument,
  TransactionModel,
} from '../controller/donation/entities/transaction.entity';
import {
  Notification,
  NotificationDocument,
} from '../controller/notification/entities/notification.entity';
import {
  EmailTemplate,
  EmailTemplateDocument,
} from '../controller/email-template/entities/email-template.entity';
import {
  AdminNotification,
  AdminNotificationDocument,
} from '../controller/notification/entities/admin-notification.entity';
import { Ngo, NgoDocument } from '../controller/ngo/entities/ngo.entity';
import { User, UserDocument } from '../controller/users/entities/user.entity';
import {
  CsvUploadModel,
  CsvUploadDocument,
} from '../controller/csv-upload/entities/csv-upload.entity';
import {
  HospitalImport,
  HospitalImportDocument,
} from '../controller/hospital-school/entities/hospital-import.entity';
import {
  SchoolImport,
  SchoolImportDocument,
} from '../controller/hospital-school/entities/school-import.entity';
import { Fund, FundDocument } from '../controller/fund/entities/fund.entity';
import {
  Setting,
  SettingDocument,
} from '../controller/setting/entities/setting.entity';
import {
  LastDonorNotificationDocument,
  LastDonorNotificationModel,
} from 'src/controller/donation/entities/notify-last-donor.entity';
import {
  CommonSetting,
  CommonSettingDocument,
} from 'src/controller/setting/entities/common-setting.entity';
import {
  ExchangeRates,
  ExchangeRatesDocument,
} from '../controller/fund/entities/exchange-rates.entity';
import {
  CurrencyRates,
  CurrencyRatesDocument,
} from '../controller/fund/entities/currency_rates.entity';
import {
  RequestLog,
  RequestLogDocument,
} from '../controller/request/entities/request-log.entity';
import {
  Corporate,
  CorporateDocument,
} from 'src/controller/corporate/entities/corporate.entity';
import {
  CorporateNotification,
  CorporateNotificationDocument,
} from '../controller/notification/entities/corporate-notification.entity';
import {
  CorporateInvite,
  CorporateInviteDocument,
} from 'src/controller/corporate/entities/corporate-invite.entity';
import {
  OtpVerifyDocument,
  OtpVerifyModel,
} from 'src/controller/users/entities/otp-verify';
import { OtpLog, OtpLogDocument } from './entities/otp-log.entity';
import { SmtpLog, SmtpLogDocument } from './entities/smtp-log.entity';
import {
  NotificationLog,
  NotificationLogDocument,
} from './entities/notification-log.entity';

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import {
  UserToken,
  UserTokenDocument,
} from 'src/controller/users/entities/user-token.entity';

const ObjectID = require('mongodb').ObjectID;
const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
const fcm = new FCM(process.env.serverKey);
const mime = require('mime');
const AWS = require('aws-sdk');
const messagingApi = require('@cmdotcom/text-sdk');
const axios = require('axios');
const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const axiosInstance = axios.create({
  httpAgent,
  httpsAgent,
});

@Injectable()
export class CommonService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    @InjectModel(Admin.name)
    private adminModel: Model<AdminDocument>,
    @InjectModel(Corporate.name)
    private corporateModel: Model<CorporateDocument>,
    @InjectModel(RequestLog.name)
    private requestLog: Model<RequestLogDocument>,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
    @InjectModel(adminToken.name)
    private adminTokenModel: Model<adminTokenDocument>,
    @InjectModel(NgoUpdated.name)
    private ngoUpdatedModel: Model<NgoUpdatedDocument>,
    @InjectModel(CommonSetting.name)
    private commonSettingModel: Model<CommonSettingDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(EmailTemplate.name)
    private EmailTemplateModel: Model<EmailTemplateDocument>,
    @InjectModel(Ngo.name) private ngoModel: Model<NgoDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AdminNotification.name)
    private adminNotificationModel: Model<AdminNotificationDocument>,
    @InjectModel(CsvUploadModel.name)
    private csvUploadModel: Model<CsvUploadDocument>,
    @InjectModel(HospitalImport.name)
    private hospitalImportModel: Model<HospitalImportDocument>,
    @InjectModel(LastDonorNotificationModel.name)
    private lastDonorNotificationModel: Model<LastDonorNotificationDocument>,
    @InjectModel(SchoolImport.name)
    private schoolImportModel: Model<SchoolImportDocument>,
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
    @InjectModel(Fund.name)
    private fundModel: Model<FundDocument>,
    @InjectModel(ExchangeRates.name)
    private exchangeRatesModel: Model<ExchangeRatesDocument>,
    @InjectModel(CorporateNotification.name)
    private corporateNotification: Model<CorporateNotificationDocument>,
    @InjectModel(CorporateInvite.name)
    private corporateInviteModel: Model<CorporateInviteDocument>,
    @InjectModel(OtpVerifyModel.name)
    private otpVerifyModel: Model<OtpVerifyDocument>,
    @InjectModel(OtpLog.name)
    private otpLog: Model<OtpLogDocument>,
    @InjectModel(SmtpLog.name)
    private smtpLog: Model<SmtpLogDocument>,
    @InjectModel(NotificationLog.name)
    private notificationLog: Model<NotificationLogDocument>,
    @InjectModel(CurrencyRates.name)
    private currencyRatesModel: Model<CurrencyRatesDocument>,
    @InjectModel(UserToken.name)
    private userTokenModel: Model<UserTokenDocument>,
    @InjectModel(CorporateNotification.name)
    private corporateNotificationModel: Model<CorporateNotificationDocument>,
  ) {}

  /**
   * Function for Generate slug
   * @param string
   * @returns
   */
  async slug(string) {
    return string
      .toString()
      .trim()
      .toLowerCase()
      .replace('&', 'and')
      .replace(/[&_\/\\#,+()$~%.'":*?<>{}]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Function for check and create directory
   * @param dir
   * @returns
   */
  async checkAndCreateDirectory(dir) {
    return new Promise(async (resolve, reject) => {
      if (dir != undefined && dir != '') {
        if (fs.existsSync(dir)) {
          resolve([]);
        } else {
          fs.mkdir(dir, 777, function (err) {
            fs.chmod(dir, '755', () => {
              resolve([]);
            });
          });
        }
      } else {
        resolve([]);
      }
    });
  }

  /**
   * Function for insert new image and remove old image
   * @param dir
   * @returns
   */
  async uploadFileOnS3(imagName = '', folder = '', oldImage = '') {
    try {
      return new Promise(async (resolve, reject) => {
        const filePath = './uploads/temp/' + imagName;

        if (!_.isEmpty(filePath) && !_.isEmpty(imagName)) {
          if (fs.existsSync(filePath)) {
            const azureRes = await this.imageUploadService(
              imagName,
              folder,
              oldImage,
            );
            resolve(azureRes);
          } else {
            resolve({ status: false, error: 'No image found' });
          }
        } else {
          resolve({ status: false, error: 'No image found' });
        }
      });
    } catch (err) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Common function for upload file
   * @param files
   * @param folder
   * @param oldImage
   * @returns
   */
  async uploadFileFunction(files) {
    return new Promise(async (resolve) => {
      try {
        if (!files) {
          resolve({
            success: false,
            error: mConfig.No_file_upload,
          });
        } else {
          // const byteCount = files.size;
          let validated = true;
          let errorMessages = '';

          //set file types
          const allowedTypes = [
            'text/plain',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'application/pdf',
            'image/jpg',
            'video/mp4',
            'application/mp4',
            'video/mp3',
            'image/heic',
            'audio/x-m4a',
          ];
          //set default file size
          // let maxBytes = 8 * 1024 * 1024;
          // let fileSize = 'The file is too large. Allow maximum size is 2 MB';

          // Check file type
          if (_.indexOf(allowedTypes, files.mimetype) === -1) {
            validated = false;
            errorMessages = mConfig.Please_upload_valid_file;
          }
          // Check file size
          // if (files.mimetype == 'video/mp4' || files.mimetype == 'video/mp3') {
          //     maxBytes = 10 * 1024 * 1024;
          //     fileSize = 'The file is too large. Allow maximum size is 10 MB';
          // }
          // if (byteCount > maxBytes) {
          //     validated = false;
          //     errorMessages = fileSize;
          // }
          if (validated) {
            const filename =
              parseInt(moment().format('X')) +
              '-' +
              files.originalname.replace(/\s/g, '');

            const webPath = './uploads/temp/';
            await this.checkAndCreateDirectory(webPath);

            const fdir = webPath + filename;
            const fileStream = createWriteStream(fdir);
            fileStream.write(files.buffer);
            fileStream.end();

            //Remove old image

            // if (oldImage && oldImage !== null) {
            //   await this.unlinkFileFunction(folder, oldImage);
            // }
            resolve({
              file_name: filename,
              success: true,
            });
          } else {
            resolve({
              success: false,
              error: errorMessages,
            });
          }
        }
      } catch (error) {
        resolve({
          success: false,
          error: mConfig.Something_went_wrong,
        });
      }
    });
  }

  /**
   * Common function for upload file
   * @param files
   * @param folder
   * @param oldImage
   * @returns
   */
  async uploadCsv(files, folder = null) {
    return new Promise(async (resolve) => {
      try {
        if (!files) {
          resolve({
            success: false,
            error: mConfig.No_file_upload,
          });
        } else {
          const byteCount = files.size;
          let validated = true;
          let errorMessages = '';

          //set file types
          const allowedTypes = ['text/csv'];
          //set default file size
          const maxBytes = 10 * 1024 * 1024;

          // Check file type
          if (_.indexOf(allowedTypes, files.mimetype) === -1) {
            validated = false;
            errorMessages = mConfig.Please_upload_valid_file;
          }
          // Check file size
          if (byteCount > maxBytes) {
            validated = false;
            errorMessages = mConfig.Allow_maximum_10_MB;
          }
          if (validated) {
            const filename =
              parseInt(moment().format('X')) +
              '-' +
              files.originalname.replace(/\s/g, '');

            let webPath = './uploads/csv/';
            if (folder && !_.isUndefined(folder)) {
              webPath = `./uploads/csv/${folder}/`;
            }
            await this.checkAndCreateDirectory(webPath);

            const fdir = webPath + filename;
            const fileStream = createWriteStream(fdir);
            fileStream.write(files.buffer);
            fileStream.end();
            resolve({
              file_name: filename,
              success: true,
            });
          } else {
            resolve({
              success: false,
              error: errorMessages,
            });
          }
        }
      } catch (error) {
        resolve({
          success: false,
          error: mConfig.Something_went_wrong,
        });
      }
    });
  }

  /**
   * Common function for check and load files
   */
  public async checkAndLoadImage(file: object, folder: string, oldImage = '') {
    try {
      if (!_.isEmpty(file)) {
        const imageId: any = await this.uploadFileFunction(file);

        if (imageId && imageId.error) {
          return {
            message: imageId.error,
            success: false,
          };
        }

        setTimeout(async () => {
          await this.uploadFileOnS3(imageId.file_name, folder, oldImage);
        }, 500);
        return imageId;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Function for move image to main folder
   * @param image
   * @param folder
   * @returns
   */
  async moveImageIntoSitefolder(image, folder) {
    return new Promise(async (resolve, reject) => {
      try {
        const tmp = './uploads/temp/' + image;
        const filePath = './uploads/';
        await this.checkAndCreateDirectory(filePath);
        const fdir = filePath + folder;

        await this.checkAndCreateDirectory(fdir);

        return fs.exists(tmp, async function (exists) {
          if (exists) {
            // get image size

            const mainFile = fdir + '/' + image;
            //moves the $file to $dir2
            fs.rename(tmp, mainFile, async (err) => {
              if (err) {
                resolve({
                  error:
                    'There is a problem with the image process. Please try again.',
                });
              }
              // copy file into .tmp
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              fs.copyFile(tmp, mainFile, (e) => {});

              resolve(image);
            });
          } else {
            resolve(image);
          }
        });
      } catch (error) {
        return error;
      }
    });
  }

  /**
   * Function for remove file
   * @param folder
   * @param file_name
   * @returns
   */
  async unlinkFileFunction(folder, file_name) {
    try {
      const file = `${folder ? folder + '/' : ''}${file_name}`;
      const filePath = './uploads/' + file;

      // remove uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (error) => {
          if (error) {
            return error;
          }
        });
      } else {
        return {
          success: false,
          message: mConfig.File_not_exist,
        };
      }
    } catch (error) {
      return error;
    }
  }

  /**
   * remove image from S3
   * @function removeImagefileFromS3
   * @param {string} file filename
   * @returns {boolean}
   */
  async s3ImageRemove(folder, filename) {
    try {
      return new Promise((resolve, reject) => {
        if (!_.isEmpty(filename)) {
          this.deleteBlobFromAzureStorage(folder, filename);
          resolve({ success: true });
        }
      });
    } catch (err) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * This function used for move file into origional folder
   *
   */
  async moveImage(files, folder) {
    try {
      if (!_.isEmpty(files) && files) {
        await Promise.all(
          files.map(async (item: any) => {
            await this.uploadFileOnS3(item, folder);
          }),
        );
      }
    } catch (error) {
      return error;
    }
  }

  /**
   * Common function for add pagination, sorting in list api
   * @param currentPage
   * @param perPage
   * @param total_record
   * @param sortData
   * @param sortBy
   * @param sortType
   * @returns
   */
  async sortFilterPagination(
    currentPage,
    perPage,
    total_record,
    sortData,
    sortBy,
    sortType,
  ) {
    try {
      const per_page: any = perPage ? parseInt(perPage) : 20;
      const page: any = currentPage ? parseInt(currentPage) : 1;

      const total_pages = Math.ceil(total_record / per_page);
      const prev_enable = parseInt(page) - 1;
      const next_enable = total_pages <= page ? 0 : 1;

      const start_from: any = (page - 1) * per_page;
      let last_to = parseInt(start_from) + parseInt(per_page);
      last_to = last_to > total_record ? total_record : last_to;

      const sort = {};
      let sort_type = '_id';
      let sort_by = -1;

      //Sort data
      if (
        !_.isUndefined(sortType) &&
        sortType !== '' &&
        !_.isEmpty(sortData) &&
        Object.keys(sortData).includes(sortType)
        // _.includes(sortData, sortType)
      ) {
        sort_type = sortData[sortType];
      }
      if (
        !_.isUndefined(sortBy) &&
        sortBy !== '' &&
        (sortBy == -1 || sortBy == 1)
      ) {
        sort_by = parseInt(sortBy);
      }
      sort[sort_type] = sort_by;

      return {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
        sort_by,
      };
    } catch (err) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Function for increase request count in userData
   * @param userId
   * @param categoryId
   * @returns
   */
  async setRequestCount(requestData, requestForMyself) {
    let query;
    let query1;
    let modelName;
    if (requestData.active_type === 'ngo') {
      query = {
        category_slug: requestData.category_slug,
        user_ngo_id: ObjectID(requestData.user_ngo_id),
        active_type: 'ngo',
      };
      query1 = { _id: requestData.user_ngo_id };
      modelName = this.ngoModel;
    } else {
      query = {
        category_slug: requestData.category_slug,
        user_id: ObjectID(requestData.user_id),
        active_type: { $ne: 'ngo' },
      };
      query1 = { _id: requestData.user_id };
      modelName = this.userModel;
    }
    const count = await this.requestModel.count(query).lean();
    const userData: any = await modelName.findById(query1);
    if (_.isEmpty(userData)) {
      return [];
    }
    const uData = {
      my_request:
        userData.my_request && !_.isEmpty(userData.my_request)
          ? userData.my_request
          : {},
    };

    uData.my_request[requestData.category_slug] = count;
    userData.my_request = uData.my_request;

    await modelName.updateOne(query1, { $set: uData });
    return userData;
  }

  /**
   * Common function for send notification to user and admin
   * @param input
   * @returns
   */
  async notification(input, hidden = false, corporate = false) {
    try {
      return new Promise(async (resolve, reject) => {
        // await this.notificationModel.deleteMany({
        //   request_id: input.requestId,
        //   user_id: ObjectID(input.userId),
        //   type: 'food',
        // });

        const notification: any = {
          user_id: input.userId,
          title: input.title,
          type: input.type,
          hidden,
        };

        const propertyMappings = {
          requestId: 'request_id',
          categorySlug: 'category_slug',
          requestUserId: 'request_user_id',
          ngoId: 'ngo_id',
          fundId: 'fund_id',
          bankId: 'bank_id',
          corporateId: 'corporate_id',
          additionalData: 'additional_data',
          referenceId: 'reference_id',
        };

        Object.entries(propertyMappings).forEach(
          ([inputKey, notificationKey]) => {
            if (input[inputKey]) {
              notification[notificationKey] = input[inputKey];
            }
          },
        );

        notification.message = !hidden ? input.message : undefined;

        const data = {
          user_id: notification.user_id,
          title: notification.title,
          type: notification.type,
          fund_id: notification.fund_id,
          bank_id: notification.bank_id,
          request_id: notification.request_id,
          corporate_id: notification.corporate_id,
          request_user_id: notification.request_user_id,
          category_slug: notification.category_slug,
          ngo_id: notification.ngo_id,
          reference_id: notification.reference_id,
          additional_data: notification.additional_data,
        };

        if (!hidden) {
          const modelName = corporate
            ? this.corporateNotification
            : this.notificationModel;

          const createNotification = new modelName(notification);
          await createNotification.save();
        }

        const activeRole = input.forCorporate ? 'corporate' : 'user';
        const uuid: any = await this.getUuid(input.userId, activeRole);
        if (!_.isEmpty(uuid) || !_.isUndefined(uuid)) {
          const badge: any = await this.badgeCount(input.userId, activeRole);
          let message: any = {};

          if (hidden) {
            message = {
              contentAvailable: 1,
              data: {
                //you can send only notification or only data(or include both)
                ...data,
                is_read: true,
                badge: badge,
              },
            };
          } else {
            message = {
              notification: {
                title: notification.title,
                body: notification.message,
              },
              data: {
                //you can send only notification or only data(or include both)
                ...data,
                badge: badge + 1,
              },
              priority: 'high',
            };
          }

          if (Array.isArray(uuid)) {
            message.registration_ids = uuid;
          } else {
            message.to = uuid;
          }

          const _this = this;
          fcm.send(message, async function (err, response) {
            if (err) {
              await _this.addNotificationLog(message, err, false);
              return err;
            } else {
              await _this.addNotificationLog(message, response, true);
              return response;
            }
          });
          resolve(true);
        } else {
          resolve(true);
        }
      });
    } catch (error) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   *Api for get admin notifications badge count
   *
   */
  public async badgeCount(userId, activeRole = 'user') {
    try {
      return new Promise(async (resolve, reject) => {
        const query = {
          user_id: userId,
          is_read: false,
          hidden: false,
          is_deleted: { $ne: true },
        };
        const modelName =
          activeRole === 'corporate'
            ? this.corporateNotificationModel
            : this.notificationModel;
        const badge: any = await modelName.count(query).lean();
        resolve(badge);
      });
    } catch (err) {
      return 1;
    }
  }

  /**
   * Common function for send notification to multiple users
   * @param userIds
   * @param input
   * @returns
   */
  async sendAllNotification(userIds, input, hidden = false, corporate = false) {
    try {
      if (!_.isEmpty(userIds)) {
        for await (const userId of userIds) {
          input.userId = userId;
          await this.notification(input, hidden, corporate);
        }
      }
    } catch (error) {
      return error;
    }
  }

  /**
   * Common function for send hidden notification to multiple users
   * @param userIds
   * @param input
   * @returns
   */
  async sendAllUserHiddenNotification(type) {
    try {
      const userIds = await this.userModel
        .aggregate([
          {
            $match: {
              uuid: { $exists: true },
              is_deleted: false,
              is_guest: { $ne: true },
            },
          },
          {
            $lookup: {
              from: 'notifications',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$user_id', '$$id'] },
                        { $eq: ['$is_read', false] },
                        { $ne: ['$hidden', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'notifi_data',
            },
          },
          {
            $project: {
              _id: 1,
              uuid: 1,
              badge: { $size: { $ifNull: ['$notifi_data', []] } },
            },
          },
        ])
        .exec();
      const input: any = {
        // notification:{
        //   title: "Temp hidden",
        //   body: "Temp hidden notification"
        // },
        priority: 'high',
        content_available: true,
        data: {
          type: type,
        },
      };
      if (!_.isEmpty(userIds)) {
        for (let i = 0; i < userIds.length; i++) {
          const id = userIds[i]._id;
          const uuid = userIds[i].uuid;
          const badge = userIds[i].badge;
          input.data.badge = badge;
          if (uuid) {
            if (Array.isArray(uuid)) {
              input.registration_ids = uuid;
            } else {
              input.to = uuid;
            }
            input.userId = id;
            fcm.send(input, async function (err, response) {});
          }
        }
      }
    } catch (error) {
      return error;
    }
  }

  /**
   * Common function for get all uuids of user
   * @param userId
   * @returns
   */
  public async getUuid(userId, activeRole = 'user') {
    try {
      const query: any = {
        _id: ObjectID(userId),
        active_role: activeRole,
      };
      return new Promise(async (resolve, reject) => {
        const data: any = await this.userTokenModel
          .distinct('uuid', query)
          .lean();
        if (!_.isEmpty(data)) {
          resolve(data);
        }
        resolve([]);
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Common function for get details of food request
   * @param requestId
   * @returns
   */
  async getFoodRequest(reqId, listType = null, param = null) {
    try {
      const userId = param.user_id ? ObjectID(param.user_id) : '';
      const query: any = {
        _id: ObjectID(reqId),
        is_deleted: { $ne: true },
      };

      // Define the lookup pipeline stages
      const lookup = [
        {
          $graphLookup: {
            from: 'transactions',
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'request_id',
            maxDepth: 10,
            depthField: 'depth',
            restrictSearchWithMatch: {
              transaction_type: 'donation',
              saayam_community: { $ne: true },
            },
            as: 'donations',
          },
        },
        {
          $lookup: {
            from: 'ngo',
            localField: 'donor_ngo_id',
            foreignField: '_id',
            as: 'donorNGO',
          },
        },
        {
          $lookup: {
            from: 'ngo',
            localField: 'volunteer_ngo_id',
            foreignField: '_id',
            as: 'volunteerNGO',
          },
        },
        {
          $lookup: {
            from: 'user',
            let: { id: '$volunteer_id', status: '$status' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$id'] },
                      {
                        $not: [
                          {
                            $in: [
                              '$$status',
                              ['pending', 'waiting_for_volunteer'],
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'volunteerD',
          },
        },
        {
          $unwind: {
            path: '$volunteerD',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'manage_volunteer',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$status', 'approve'] },
                      { $eq: ['$request_id', '$$id'] },
                    ],
                  },
                },
              },
              { $sort: { createdAt: 1 } },
            ],
            as: 'manageVolunteers',
          },
        },
        {
          $lookup: {
            from: 'user',
            let: { volunteers: '$manageVolunteers.volunteer_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$_id', '$$volunteers'],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  phone: 1,
                  phone_code: 1,
                  image: {
                    $ifNull: [
                      {
                        $concat: [authConfig.imageUrl, 'user/', '$image'],
                      },
                      null,
                    ],
                  },
                },
              },
              { $limit: 5 },
            ],
            as: 'going_volunteer_data',
          },
        },
        {
          $lookup: {
            from: 'user',
            localField: 'user_id',
            foreignField: '_id',
            as: 'userData',
          },
        },
        { $unwind: { path: '$userData', preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'bookmark_items',
            let: { id: '$_id', category_slug: '$category_slug' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ['$category_slug', '$$category_slug'],
                      },
                      {
                        $eq: ['$user_id', userId],
                      },
                      { $eq: ['$request_id', '$$id'] },
                    ],
                  },
                },
              },
            ],
            as: 'bookmarkData',
          },
        },
      ];

      const set = {
        $set: {
          donor_ngo_name: { $arrayElemAt: ['$donorNGO.form_data.ngo_name', 0] },
          volunteer_ngo_name: {
            $arrayElemAt: ['$volunteerNGO.form_data.ngo_name', 0],
          },
          total_anonymous: {
            $filter: {
              input: '$donations',
              as: 'd',
              cond: {
                $eq: ['$$d.is_contribute_anonymously', true],
              },
            },
          },
          total_no_anonymous: {
            $filter: {
              input: '$donations',
              as: 'd',
              cond: {
                $eq: ['$$d.is_contribute_anonymously', false],
              },
            },
          },
          contacts_data: {
            $map: {
              input: '$volunteers',
              in: {
                $mergeObjects: [
                  '$$this',
                  {
                    user: {
                      $arrayElemAt: [
                        '$contactsData',
                        {
                          $indexOfArray: [
                            '$contactsData._id',
                            '$$this.user_id',
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      };

      // Define the $project projection stage
      const project: any = {
        _id: 1,
        reference_id: 1,
        corporate_id: 1,
        donor_id: 1,
        volunteer_id: 1,
        volunteer_accept_time: 1,
        volunteer_name: {
          $concat: ['$volunteerD.first_name', ' ', '$volunteerD.last_name'],
        },
        ngo_volunteer_ids: 1,
        user_ngo_id: 1,
        donor_ngo_id: 1,
        volunteer_ngo_id: 1,
        accept_donor_ids: 1,
        accept_volunteer_ids: 1,
        ngo_donor_ids: 1,
        ngo_ids: 1,
        delete_request: 1,
        location: 1,
        deliver_time: 1,
        category_slug: 1,
        category_name: 1,
        transaction_time: 1,
        last_transaction: 1,
        total_transfer: 1,
        remaining_transfer: 1,
        active_type: 1,
        transfer_amount: 1,
        reject_reason: 1,
        reject_time: 1,
        allow_edit_request: 1,
        allow_for_reverify: 1,
        donationCount: 1,
        myDonation: 1,
        ngoDonation: 1,
        donor_ngo_name: 1,
        volunteer_ngo_name: 1,
        status: 1,
        testimonial_video: '$testimonial_id',
        allow_testimonial: 1,
        reject_testimonial_reason: 1,
        testimonial_status: 1,
        title_of_fundraiser: '$form_data.title_of_fundraiser',
        createdAt: 1,
        disaster_links: '$disaster_links',
        add_location_for_food_donation: '$add_location_for_food_donation',
        avg_donation: {
          $cond: {
            if: { $eq: [{ $size: '$donations' }, 0] },
            then: 0,
            else: {
              $cond: {
                if: {
                  $gte: [
                    { $sum: '$donations.converted_amt' },
                    { $toInt: '$form_data.goal_amount' },
                  ],
                },
                then: 100,
                else: {
                  $multiply: [
                    {
                      $divide: [
                        { $toInt: { $sum: '$donations.converted_amt' } },
                        { $toInt: '$form_data.goal_amount' },
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },
        },
        country_data: 1,
        user_image: {
          $ifNull: [
            { $concat: [authConfig.imageUrl, 'user/', '$user_image'] },
            null,
          ],
        },
        approve_time: 1,
        total_donation: { $sum: '$donations.converted_amt' },
        uname: 1,
        user_id: 1,
        form_data: 1,
        donor_accept: 1,
        volunteer_accept: 1,
        hasDonation: 1,
        prepare_time: 1,
        is_featured: 1,
        fundraiser_status: 1,
        cancelled_by: 1,
        cancelled_at: 1,
        cancel_request_for_delete_request_reason: 1,
        send_request_for_delete_request_reason: 1,
        plan_expired_date: 1,
        bank_id: 1,
        image_url: authConfig.imageUrl + 'request/',
        comment_enabled: 1,
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
        photos: {
          $map: {
            input: '$form_data.files.photos',
            as: 'photo',
            in: {
              $concat: [authConfig.imageUrl, 'request/', '$$photo'],
            },
          },
        },
        goverment_doc: {
          $map: {
            input: '$form_data.files.upload_govt_documents',
            as: 'goverment_doc',
            in: {
              $concat: [authConfig.imageUrl, 'request/', '$$goverment_doc'],
            },
          },
        },
        total_donors: {
          $add: [
            { $size: '$total_anonymous' },
            { $size: { $setUnion: ['$total_no_anonymous.donor_id', []] } },
          ],
        },
        userDtl: {
          email: '$userData.email',
          phone_code: '$userData.phone_code',
          phone: '$userData.phone',
          display_name: '$userData.display_name',
          first_name: '$userData.first_name',
          last_name: '$userData.last_name',
          phone_country_short_name: '$userData.phone_country_short_name',
          'location.city': '$userData.location.city',
          image: {
            $ifNull: [
              { $concat: [authConfig.imageUrl, 'user/', '$userData.image'] },
              null,
            ],
          },
        },
        manage_volunteers_count: { $size: '$manageVolunteers' },
      };

      if (param && param.user_id && listType === 'app') {
        project['is_joined'] = {
          $cond: {
            if: {
              $in: [ObjectID(param?.user_id), '$manageVolunteers.volunteer_id'],
            },
            then: true,
            else: {
              $cond: {
                if: {
                  $and: [
                    { $gt: ['$admins', null] },
                    { $in: [ObjectID(param?.user_id), '$admins.user_id'] },
                  ],
                },
                then: true,
                else: false,
              },
            },
          },
        };
        project['going_volunteer_data'] = 1;
        project['report_benificiary_count'] = {
          $sum: {
            $map: {
              input: '$report_benificiary',
              as: 'report',
              in: {
                $cond: [
                  {
                    $eq: ['$$report.user_id', ObjectID(param?.user_id)],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        };
        project['is_bookmark'] = {
          $cond: {
            if: { $gt: [{ $size: '$bookmarkData' }, 0] }, // Check if bookmarks array is not empty
            then: true, // Bookmarks exist
            else: false, // No bookmarks
          },
        };
      }

      if (
        !_.isEmpty(param) &&
        !_.isEmpty(param.category_slug) &&
        !_.isUndefined(param.category_slug)
      ) {
        query.category_slug = param.category_slug;
      }

      // Run the aggregation pipeline
      const data = await this.requestModel.aggregate([
        { $match: query },
        ...lookup,
        set,
        {
          $project: project,
        },
      ]);

      const requestDetail: any = data[0];
      if (!_.isEmpty(requestDetail)) {
        if (
          listType === 'app' &&
          requestDetail?.form_data &&
          requestDetail?.form_data?.files
        ) {
          const files = requestDetail.form_data.files;
          const userDoc = [];

          for (const key in files) {
            if (
              key !== 'video' &&
              key !== 'upload_cover_photo' &&
              key !== 'upload_govt_documents'
            ) {
              userDoc.push(
                ...files[key].map(
                  (item) => authConfig.imageUrl + 'request/' + item,
                ),
              );
            }
          }

          requestDetail.user_doc = userDoc;
        }

        if (requestDetail.fundraiser_status) {
          requestDetail.fundraiser_status =
            requestDetail.fundraiser_status.sort(function (a, b) {
              const date1: any = new Date(a.date);
              const date2: any = new Date(b.date);
              return date2.getTime() - date1.getTime();
            });
        }

        if (requestDetail.report_benificiary) {
          requestDetail.report_benificiary =
            requestDetail.report_benificiary.sort(function (a, b) {
              const date1: any = new Date(a.added_time);
              const date2: any = new Date(b.added_time);
              return date2.getTime() - date1.getTime();
            });
        }

        if (
          requestDetail.category_slug &&
          requestDetail.category_slug !== 'hunger'
        ) {
          const today: any = new Date().getTime();
          const startDate: any = requestDetail.createdAt.getTime();
          const endDate: any = today;
          const diffInMs: any = endDate - startDate;

          const diffInDays: any = parseInt(diffInMs) / (1000 * 60 * 60 * 24);
          requestDetail.funded_in_days =
            parseInt(diffInDays) > 0 ? parseInt(diffInDays) + 1 : 1;
        }

        if (
          requestDetail.user_ngo_id &&
          !_.isUndefined(requestDetail.user_ngo_id)
        ) {
          let ngoData;
          if (listType === 'admin') {
            ngoData = await this.getNGODetailForAdmin(
              requestDetail.user_ngo_id,
            );
          } else if (listType === 'app') {
            ngoData = await this.getNGODetailForApp(requestDetail.user_ngo_id);
          }
          requestDetail.ngo_detail = ngoData;
        }

        return requestDetail;
      } else {
        return [];
      }
    } catch (error) {
      return error;
    }
  }

  /**
   * Common function for remove user_id from ids array
   * @param idArray
   * @param userId
   * @returns
   */
  async removeIdFromArray(idArray, userIds) {
    const stringArray = idArray.map((s) => s.toString());
    await Promise.all(
      userIds.map(async (userId) => {
        const stringUserId = userId.toString();
        if (_.includes(stringArray, stringUserId)) {
          const index = stringArray.indexOf(stringUserId);
          if (index > -1) {
            stringArray.splice(index, 1);
          }
        }
      }),
    );

    return stringArray;
  }

  /**
   * Function to get users of ngo
   * @param ngoId
   * @returns
   */
  async getNgoUserIds(ngoId, userId = null) {
    if (!ngoId) {
      return [];
    }
    const ngo: any = await this.ngoModel
      .findById({ _id: ngoId })
      .distinct('trustees_name._id')
      .lean();

    if (_.isEmpty(ngo)) {
      return [];
    } else {
      if (userId) {
        return ngo.filter(
          (element) => element.toString() !== userId.toString(),
        );
      } else {
        return ngo;
      }
    }
  }

  /**
   * Function for generate random token
   * @param length
   * @returns
   */
  async randomTokenGenerator(length) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = '';
        const characters =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * charactersLength),
          );
        }
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          error,
        });
      }
    });
  }
  /**
   * Common function for get ngo data
   * @param id
   */
  async getNGODetail(id, loginType = null) {
    try {
      let match: any = {
        _id: ObjectID(id),
      };
      if (loginType == 'app') {
        match = {
          _id: ObjectID(id),
          is_deleted: { $ne: true },
        };
      }
      const lookup = [
        {
          $lookup: {
            from: 'user',
            localField: 'trustees_name._id',
            foreignField: '_id',
            as: 'tUserData',
          },
        },
      ];
      const set: any = [
        {
          $set: {
            trustees_name: {
              $map: {
                input: '$trustees_name',
                in: {
                  $mergeObjects: [
                    '$$this',
                    {
                      user: {
                        $arrayElemAt: [
                          '$tUserData',
                          { $indexOfArray: ['$tUserData._id', '$$this._id'] },
                        ],
                      },
                    },
                  ],
                },
              },
            },
            currency: { $first: '$country_data.currency' },
          },
        },
      ];
      let project = {
        _id: 1,
        ngo_cover_image: 1,
        ngo_deed: 1,
        ngo_certificate: 1,
        ngo_registration_number: '$ngo.ngo_registration_number',
        ngo_name: '$ngo.ngo_name',
        first_name: '$ngo.first_name',
        last_name: '$ngo.last_name',
        ngo_causes: '$ngo.ngo_causes',
        ngo_location: '$ngo.ngo_location',
        ngo_phone: '$ngo.ngo_phone',
        ngo_phone_code: '$ngo.ngo_phone_code',
        ngo_email: '$ngo.ngo_email',
        about_us: '$ngo.about_us',
        secondary_phone: '$ngo.secondary_phone',
        secondary_phone_code: '$ngo.secondary_phone_code',
        ngo_12A_certificate: 1,
        ngo_80G_certificate: 1,
        ngo_FCRA_certificate: 1,
        upload_FCRA_certificate: '$ngo.upload_FCRA_certificate',
        upload_12A_80G_certificate: '$ngo.upload_12A_80G_certificate',
        trustees_name: {
          $map: {
            input: '$ngo.trustees_name',
            as: 'trustee',
            in: {
              _id: '$$trustee._id',
              first_name: '$$trustee.user.first_name',
              last_name: '$$trustee.user.last_name',
              email: '$$trustee.user.email',
              image: {
                $ifNull: [
                  {
                    $concat: [
                      authConfig.imageUrl,
                      'user/',
                      '$$trustee.user.image',
                    ],
                  },
                  null,
                ],
              },
              phone_code: '$$trustee.user.phone_code',
              phone: '$$trustee.user.phone',
              country_code: '$$trustee.country_code',
              added_time: '$$trustee.added_time',
              removed_time: '$$trustee.removed_time',
              is_owner: '$$trustee.is_owner',
              verified: '$$trustee.verified',
              flag: '$$trustee.user.phone_country_short_name',
            },
          },
        },
        expiry_date: '$ngo.expiry_date',
        display_name: '$ngo.display_name',
        report_ngo: '$ngo.report_ngo',
        is_enable: '$ngo.is_enable',
        ngo: '$ngo.website_link',
        ngo_status: '$ngo.ngo_status',
        createdAt: '$ngo.createdAt',
        updatedAt: '$ngo.updatedAt',
        transfer_account: '$ngo.transfer_account',
        block_reason: '$ngo.block_reason',
        country_data: {
          country: '$ngo.country_data.country',
          country_code: '$ngo.country_data.country_code',
          currency: '$ngo.currency.symbol',
          currency_code: '$ngo.currency.name',
        },
        transfer_documents: {
          $map: {
            input: '$ngo.transfer_documents',
            as: 'transferDoc',
            in: {
              $concat: [
                authConfig.imageUrl,
                'transfer-ownership/',
                '$$transferDoc',
              ],
            },
          },
        },
        transfer_reason: '$ngo.transfer_reason',
        reject_reason: '$ngo.reject_reason',
        deletedAt: '$ngo.deletedAt',
        delete_account_reason: '$ngo.delete_account_reason',
        phone_country_full_name: '$ngo.phone_country_full_name',
        phone_country_short_name: '$ngo.phone_country_short_name',
        secondary_country_full_name: '$ngo.secondary_country_full_name',
        secondary_country_short_name: '$ngo.secondary_country_short_name',
        is_expired: '$ngo.is_expired',
        website_link: '$ngo.website_link',
      };
      if (loginType == 'admin') {
        const lookup2 = {
          $lookup: {
            from: 'user',
            localField: 'removed_trustee._id',
            foreignField: '_id',
            as: 'rUserData',
          },
        };
        lookup.push(lookup2);

        const set2 = {
          $set: {
            removed_trustee: {
              $map: {
                input: '$removed_trustee',
                in: {
                  $mergeObjects: [
                    '$$this',
                    {
                      user: {
                        $arrayElemAt: [
                          '$rUserData',
                          { $indexOfArray: ['$rUserData._id', '$$this._id'] },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        set.push(set2);

        project['removed_trustee'] = {
          $map: {
            input: '$ngo.removed_trustee',
            as: 'trustee',
            in: {
              _id: '$$trustee._id',
              first_name: '$$trustee.user.first_name',
              last_name: '$$trustee.user.last_name',
              email: '$$trustee.user.email',
              image: {
                $ifNull: [
                  {
                    $concat: [
                      authConfig.imageUrl,
                      'user/',
                      '$$trustee.user.image',
                    ],
                  },
                  null,
                ],
              },
              phone_code: '$$trustee.user.phone_code',
              phone: '$$trustee.user.phone',
              country_code: '$$trustee.country_code',
              added_time: '$$trustee.added_time',
              removed_time: '$$trustee.removed_time',
              flag: '$$trustee.user.phone_country_short_name',
              documents: {
                $map: {
                  input: '$$trustee.documents',
                  as: 'd',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'ngo/',
                      { $toString: '$_id' },
                      '/remove-trustee/',
                      '$$d',
                    ],
                  },
                },
              },
            },
          },
        };
      }
      const data = await this.ngoModel.aggregate([
        { $match: match },
        ...lookup,
        ...set,
        {
          $group: {
            _id: '$_id',
            ngo: { $first: '$$ROOT' },
          },
        },
        {
          $addFields: {
            ngo_cover_image: {
              $cond: {
                if: { $ne: ['$ngo.ngo_cover_image', ''] },
                then: {
                  $concat: [
                    authConfig.imageUrl,
                    'ngo/',
                    { $toString: '$_id' },
                    '/cover-image/',
                    '$ngo.ngo_cover_image',
                  ],
                },
                else: null,
              },
            },
            ngo_deed: {
              $cond: {
                if: { $ne: ['$ngo.ngo_deed', ''] },
                then: {
                  $concat: [
                    authConfig.imageUrl,
                    'ngo/',
                    { $toString: '$_id' },
                    '/deed/',
                    '$ngo.ngo_deed',
                  ],
                },
                else: null,
              },
            },
            ngo_certificate: {
              $cond: {
                if: { $ne: ['$ngo.ngo_certificate', ''] },
                then: {
                  $concat: [
                    authConfig.imageUrl,
                    'ngo/',
                    { $toString: '$_id' },
                    '/certificate/',
                    '$ngo.ngo_certificate',
                  ],
                },
                else: null,
              },
            },
            ngo_12A_certificate: {
              $cond: {
                if: { $ne: ['$ngo.ngo_12A_certificate', ''] },
                then: {
                  $concat: [
                    authConfig.imageUrl,
                    'ngo/',
                    { $toString: '$_id' },
                    '/ngo-12A-certificate/',
                    '$ngo.ngo_12A_certificate',
                  ],
                },
                else: null,
              },
            },
            ngo_80G_certificate: {
              $cond: {
                if: { $ne: ['$ngo.ngo_80G_certificate', ''] },
                then: {
                  $concat: [
                    authConfig.imageUrl,
                    'ngo/',
                    { $toString: '$_id' },
                    '/ngo-80G-certificate/',
                    '$ngo.ngo_80G_certificate',
                  ],
                },
                else: null,
              },
            },
            ngo_FCRA_certificate: {
              $cond: {
                if: { $ne: ['$ngo.ngo_FCRA_certificate', ''] },
                then: {
                  $concat: [
                    authConfig.imageUrl,
                    'ngo/',
                    { $toString: '$_id' },
                    '/ngo-FCRA-certificate/',
                    '$ngo.ngo_FCRA_certificate',
                  ],
                },
                else: null,
              },
            },
          },
        },
        {
          $project: project,
        },
      ]);
      if (!_.isEmpty(data)) {
        const ngoUpdatedData = await this.ngoUpdatedModel.aggregate([
          { $match: { ngo_id: data[0]._id } },
          ...lookup,
          ...set,
          {
            $group: {
              _id: '$_id',
              ngo: { $first: '$$ROOT' },
            },
          },
          {
            $addFields: {
              ngo_cover_image: {
                $cond: {
                  if: { $ne: ['$ngo.ngo_cover_image', ''] },
                  then: {
                    $concat: [
                      authConfig.imageUrl,
                      'ngo/',
                      { $toString: '$ngo.ngo_id' },
                      '/cover-image/',
                      '$ngo.ngo_cover_image',
                    ],
                  },
                  else: null,
                },
              },
              ngo_deed: {
                $cond: {
                  if: { $ne: ['$ngo.ngo_deed', ''] },
                  then: {
                    $concat: [
                      authConfig.imageUrl,
                      'ngo/',
                      { $toString: '$ngo.ngo_id' },
                      '/deed/',
                      '$ngo.ngo_deed',
                    ],
                  },
                  else: null,
                },
              },
              ngo_certificate: {
                $cond: {
                  if: { $ne: ['$ngo.ngo_certificate', ''] },
                  then: {
                    $concat: [
                      authConfig.imageUrl,
                      'ngo/',
                      { $toString: '$ngo.ngo_id' },
                      '/certificate/',
                      '$ngo.ngo_certificate',
                    ],
                  },
                  else: null,
                },
              },
              ngo_12A_certificate: {
                $cond: {
                  if: { $ne: ['$ngo.ngo_12A_certificate', ''] },
                  then: {
                    $concat: [
                      authConfig.imageUrl,
                      'ngo/',
                      { $toString: '$ngo.ngo_id' },
                      '/ngo-12A-certificate/',
                      '$ngo.ngo_12A_certificate',
                    ],
                  },
                  else: null,
                },
              },
              ngo_80G_certificate: {
                $cond: {
                  if: { $ne: ['$ngo.ngo_80G_certificate', ''] },
                  then: {
                    $concat: [
                      authConfig.imageUrl,
                      'ngo/',
                      { $toString: '$ngo.ngo_id' },
                      '/ngo-80G-certificate/',
                      '$ngo.ngo_80G_certificate',
                    ],
                  },
                  else: null,
                },
              },
              ngo_FCRA_certificate: {
                $cond: {
                  if: { $ne: ['$ngo.ngo_FCRA_certificate', ''] },
                  then: {
                    $concat: [
                      authConfig.imageUrl,
                      'ngo/',
                      { $toString: '$ngo.ngo_id' },
                      '/ngo-FCRA-certificate/',
                      '$ngo.ngo_FCRA_certificate',
                    ],
                  },
                  else: null,
                },
              },
            },
          },
          {
            $project: project,
          },
        ]);
        if (!_.isEmpty(ngoUpdatedData)) {
          data[0].updated_data = ngoUpdatedData[0];
        }
        return data[0];
      }
      return [];
    } catch (err) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Common function for get all request data
   * @param id
   */
  async getAllRequestListWithUrl(query, sort, start_from, per_page) {
    const data = await this.requestModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'bookmark_items',
          let: { id: '$_id', category_slug: '$category_slug' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$category_slug', '$$category_slug'],
                    },
                    {
                      $eq: ['$user_id', ObjectID(query?.user_id)],
                    },
                    { $eq: ['$request_id', '$$id'] },
                  ],
                },
              },
            },
          ],
          as: 'bookmarkData',
        },
      },
      {
        $unwind: {
          path: '$bookmarkData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          reference_id: 1,
          corporate_id: 1,
          user_ngo_id: 1,
          form_data: 1,
          category_slug: 1,
          category_name: 1,
          active_type: 1,
          total_donors: 1,
          allow_edit_request: 1,
          allow_for_reverify: 1,
          donationCount: 1,
          myDonation: 1,
          ngoDonation: 1,
          status: 1,
          title_of_fundraiser: '$form_data.title_of_fundraiser',
          createdAt: 1,
          avg_donation: 1,
          country_data: 1,
          allow_testimonial: 1,
          reject_testimonial_reason: 1,
          testimonial_status: 1,
          testimonial_video: '$testimonial_id',
          approve_time: 1,
          total_donation: 1,
          uname: 1,
          user_id: 1,
          user_image: {
            $ifNull: [
              {
                $concat: [authConfig.imageUrl, 'user/', '$user_image'],
              },
              null,
            ],
          },
          hasDonation: 1,
          is_featured: 1,
          plan_expired_date: 1,
          bank_id: 1,
          image_url: authConfig.imageUrl + 'request/',
          comment_enabled: 1,
          disaster_links: '$disaster_links',
          add_location_for_food_donation: '$add_location_for_food_donation',
          is_bookmark: {
            $cond: {
              if: { $gt: ['$bookmarkData', null] },
              then: true,
              else: false,
            },
          },
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
          sort: {
            $cond: {
              if: {
                $eq: ['$status', 'approve'],
              },
              then: 0,
              else: {
                $cond: {
                  if: {
                    $eq: ['$status', 'complete'],
                  },
                  then: 1,
                  else: 2,
                },
              },
            },
          },
        },
      },
      { $sort: sort },
      { $skip: start_from },
      { $limit: per_page },
    ]);

    return data;
  }

  /**
   * Common function for get all request data with transaction details
   * @param id
   */
  async getAllRequestListWithTransaction(
    query,
    sort,
    start_from,
    per_page,
    userData,
    includeBlocked = false,
  ) {
    try {
      const userId = ObjectID(userData?._id);
      const imageUrl = authConfig.imageUrl;

      const lookup = [
        {
          $lookup: {
            from: 'transactions',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$request_id', '$$id'] },
                      { $eq: ['$transaction_type', 'donation'] },
                      { $ne: ['$saayam_community', true] },
                    ],
                  },
                },
              },
            ],
            as: 'tData',
          },
        },
        {
          $lookup: {
            from: 'bookmark_items',
            let: { id: '$_id', category_slug: '$category_slug' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ['$category_slug', '$$category_slug'],
                      },
                      {
                        $eq: ['$user_id', userId],
                      },
                      { $eq: ['$request_id', '$$id'] },
                    ],
                  },
                },
              },
            ],
            as: 'bookmarkData',
          },
        },
        {
          $lookup: {
            from: 'ngo', // collection name in db
            localField: 'user_ngo_id',
            foreignField: '_id',
            as: 'ngoData',
          },
        },
        {
          $lookup: {
            from: 'fundraiser_verify',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$request_id', '$$id'] }],
                  },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: 'lastStatus',
          },
        },
        {
          $lookup: {
            from: 'manage_volunteer',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$status', 'approve'] },
                      { $eq: ['$request_id', '$$id'] },
                    ],
                  },
                },
              },
              { $sort: { createdAt: 1 } },
            ],
            as: 'manageVolunteers',
          },
        },
        {
          $lookup: {
            from: 'user',
            let: { volunteers: '$manageVolunteers.volunteer_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$_id', '$$volunteers'],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  email: 1,
                  phone: 1,
                  phone_code: 1,
                  image: {
                    $ifNull: [
                      {
                        $concat: [authConfig.imageUrl, 'user/', '$image'],
                      },
                      null,
                    ],
                  },
                },
              },
              { $limit: 5 },
            ],
            as: 'going_volunteer_data',
          },
        },
      ];

      const unwind = [
        {
          $unwind: {
            path: '$tData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$ngoData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$bookmarkData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$lastStatus',
            preserveNullAndEmptyArrays: true,
          },
        },
      ];

      const group = {
        $group: {
          _id: '$_id',
          request_data: { $first: '$$ROOT' },
          total_donation: { $sum: '$tData.converted_amt' },
          myDonation: {
            $sum: {
              $cond: {
                if: { $eq: ['$tData.donor_id', userId] },
                then: '$tData.converted_amt',
                else: 0,
              },
            },
          },
          ngoDonation: {
            $sum: {
              $cond: {
                if: { $eq: ['$tData.donor_id', ObjectID(userData?.ngo_id)] },
                then: '$tData.converted_amt',
                else: 0,
              },
            },
          },
          total_donors: { $first: '$totalDonors' },
        },
      };

      let geoNear = [];
      if (
        !_.isUndefined(userData.user_lat) &&
        userData.user_lat != '' &&
        !_.isUndefined(userData.user_long) &&
        userData.user_long != ''
      ) {
        const coord = [userData.user_long, userData.user_lat];
        geoNear = [
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: coord,
              },
              distanceField: 'distance',
              distanceMultiplier: 0.001,
              key: 'location',
              maxDistance: userData.maximum_radius * 1000,
              minDistance: 0,
              spherical: true,
            },
          },
        ];
        delete query.user_lat;
        delete query.user_long;
      }

      const data = await this.requestModel.aggregate(
        [
          ...geoNear,
          ...lookup,
          {
            $set: {
              totalDonors: { $size: { $setUnion: ['$tData.donor_id', []] } },
              manage_permission: {
                $filter: {
                  input: '$admins',
                  as: 'admin',
                  cond: {
                    $and: [
                      { $eq: ['$$admin.user_id', userId] },
                      { $eq: ['$$admin.status', 'approve'] },
                    ],
                  },
                },
              },
            },
          },
          ...unwind,
          {
            $match: { $and: [query, { 'ngoData.is_deleted': { $ne: true } }] },
          },
          group,
          {
            $project: {
              _id: '$request_data._id',
              distance: '$request_data.distance',
              deliver_time: '$request_data.deliver_time',
              donor_id: '$request_data.donor_id',
              volunteer_id: '$request_data.volunteer_id',
              ngo_volunteer_ids: '$request_data.ngo_volunteer_ids',
              user_ngo_id: '$request_data.user_ngo_id',
              donor_ngo_id: '$request_data.donor_ngo_id',
              volunteer_ngo_id: '$request_data.volunteer_ngo_id',
              ngo_donor_ids: '$request_data.ngo_donor_ids',
              ngo_ids: '$request_data.ngo_ids',
              location: '$request_data.location',
              reference_id: '$request_data.reference_id',
              corporate_id: '$request_data.corporate_id',
              category_slug: '$request_data.category_slug',
              category_name: '$request_data.category_name',
              reject_reason: '$request_data.reject_reason',
              active_type: '$request_data.active_type',
              form_data: '$request_data.form_data',
              disaster_links: '$request_data.disaster_links',
              add_location_for_food_donation:
                '$request_data.add_location_for_food_donation',
              view_reasons: '$request_data.lastStatus.form_settings',
              other_reason: '$request_data.lastStatus.other_reason',
              total_donation: 1,
              total_donors: 1,
              fundraiser_status: '$request_data.fundraiser_status',
              avg_donation: {
                $cond: {
                  if: { $eq: ['$total_donation', 0] },
                  then: 0,
                  else: {
                    $cond: {
                      if: {
                        $gte: [
                          '$total_donation',
                          { $toInt: '$request_data.form_data.goal_amount' },
                        ],
                      },
                      then: 100,
                      else: {
                        $multiply: [
                          {
                            $divide: [
                              { $toInt: '$total_donation' },
                              { $toInt: '$request_data.form_data.goal_amount' },
                            ],
                          },
                          100,
                        ],
                      },
                    },
                  },
                },
              },
              allow_edit_request: '$request_data.allow_edit_request',
              allow_for_reverify: '$request_data.allow_for_reverify',
              donationCount: 1,
              myDonation: 1,
              ngoDonation: 1,
              status: '$request_data.status',
              title_of_fundraiser:
                '$request_data.form_data.title_of_fundraiser',
              createdAt: '$request_data.createdAt',
              country_data: '$request_data.country_data',
              approve_time: '$request_data.approve_time',
              uname: '$request_data.uname',
              user_image: {
                $ifNull: [
                  {
                    $concat: [imageUrl, 'user/', '$request_data.user_image'],
                  },
                  null,
                ],
              },
              user_id: '$request_data.user_id',
              hasDonation: 1,
              is_featured: '$request_data.is_featured',
              plan_expired_date: '$request_data.plan_expired_date',
              bank_id: '$request_data.bank_id',
              delete_request: '$request_data.delete_request',
              image_url: imageUrl + 'request/',
              comment_enabled: '$request_data.comment_enabled',
              ngo_status: '$request_data.ngoData.ngo_status',
              allow_testimonial: '$request_data.allow_testimonial',
              reject_testimonial_reason: 1,
              testimonial_status: '$request_data.testimonial_status',
              testimonial_video: '$request_data.testimonial_id',
              is_bookmark: {
                $cond: {
                  if: { $gt: ['$request_data.bookmarkData', null] },
                  then: true,
                  else: false,
                },
              },
              manage_permission: {
                $cond: {
                  if: {
                    $ne: ['$request_data.manage_permission', null],
                  },
                  then: '$request_data.manage_permission',
                  else: [],
                },
              },
              manage_volunteers_count: {
                $size: '$request_data.manageVolunteers',
              },
              is_joined: {
                $in: [
                  ObjectID(userData?._id),
                  '$request_data.manageVolunteers.volunteer_id',
                ],
              },
              going_volunteer_data: '$request_data.going_volunteer_data',
              pending_admins: {
                $sum: {
                  $map: {
                    input: '$request_data.admins',
                    as: 'admin',
                    in: {
                      $cond: [
                        {
                          $eq: ['$$admin.status', 'pending'],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              approve_admins: {
                $sum: {
                  $map: {
                    input: '$request_data.admins',
                    as: 'admin',
                    in: {
                      $cond: [
                        {
                          $eq: ['$$admin.status', 'approve'],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              reject_admins: {
                $sum: {
                  $map: {
                    input: '$request_data.admins',
                    as: 'admin',
                    in: {
                      $cond: [
                        {
                          $eq: ['$$admin.status', 'reject'],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              remove_admins: {
                $sum: {
                  $map: {
                    input: '$request_data.admins',
                    as: 'admin',
                    in: {
                      $cond: [
                        {
                          $eq: ['$$admin.status', 'remove'],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              ngo_Data: {
                $cond: {
                  if: {
                    $or: [
                      { $eq: ['$request_data.ngoData', []] },
                      {
                        $and: [
                          {
                            $ne: [
                              '$request_data.ngoData.ngo_status',
                              'blocked',
                            ],
                          },
                          {
                            $ne: ['$request_data.ngoData.ngo_status', 'reject'],
                          },
                          { $ne: ['$request_data.ngoData.is_expired', true] },
                        ],
                      },
                    ],
                  },
                  then: 1,
                  else: [],
                },
              },
              upload_cover_photo: {
                $map: {
                  input: '$request_data.form_data.files.upload_cover_photo',
                  as: 'request_cover_photo',
                  in: {
                    $concat: [imageUrl, 'request/', '$$request_cover_photo'],
                  },
                },
              },
              community_sort: {
                $cond: {
                  if: {
                    $eq: [
                      '$request_data.form_data.urgent_help_status',
                      'approve',
                    ],
                  },
                  then: 1,
                  else: 2,
                },
              },
              sort: {
                $cond: {
                  if: {
                    $eq: ['$request_data.status', 'expired'],
                  },
                  then: 2,
                  else: {
                    $cond: {
                      if: {
                        $eq: ['$request_data.status', 'approve'],
                      },
                      then: 0,
                      else: 1,
                    },
                  },
                },
              },
            },
          },
          {
            $unwind: {
              path: '$ngo_Data',
              preserveNullAndEmptyArrays: includeBlocked,
            },
          },
          { $sort: sort },
          { $skip: start_from },
          { $limit: per_page },
        ],
        { collation: authConfig.collation },
      );
      return data;
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Function for get add requests with additional data
   * @param causeData
   * @param transactionData
   * @param userData
   * @returns
   */
  async getAllRequestAllDetail(causeData) {
    const data = [];
    if (!_.isEmpty(causeData)) {
      const allData = causeData.map(async (cause: any) => {
        return new Promise(async (resolve) => {
          if (cause.category_slug && cause.category_slug !== 'hunger') {
            let endDate = cause?.form_data?.expiry_date;
            const today: any = new Date().toISOString().slice(0, 10);
            const startDate: any = new Date(today);
            if (startDate && endDate) {
              endDate = new Date(endDate.toISOString().slice(0, 10));
              const diffInMs: any = endDate - startDate;
              const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
              const Days = moment
                .duration(diffInDays, 'days')
                .humanize()
                .split(' ');

              for (let i = 0; i < Days.length; i++) {
                Days[i] = Days[i].charAt(0).toUpperCase() + Days[i].slice(1);
              }

              cause.days_left =
                diffInDays > 0
                  ? Days.join(' ') + ' Left'
                  : diffInDays == 0
                  ? 'Expires Today'
                  : 'Expired';
            }
          }

          resolve(cause);
        });
      });

      return Promise.all(allData).then((data) => {
        return data;
      });
    } else {
      return data;
    }
  }

  /**
   * Function to get transacted user detail
   * @param transactiondetail
   * @param userId
   * @param isNgo
   * @returns
   */
  async getTransactionUser(transactiondetail, userId, isNgo) {
    try {
      const userData: any = {};
      if (!_.isEmpty(transactiondetail)) {
        if (isNgo) {
          const ngo = await this.ngoModel
            .findById({ _id: userId })
            .select({
              _id: 1,
              ngo_name: '$form_data.ngo_name',
              ngo_phone_code: '$form_data.ngo_mobile_number.countryCodeD',
              ngo_phone: '$form_data.ngo_mobile_number.phoneNumber',
              ngo_location: '$ngo_address',
              ngo_email: '$form_data.ngo_email',
              ngo_cover_image: {
                $concat: [
                  authConfig.imageUrl,
                  'ngo/',
                  { $toString: '$_id' },
                  '/',
                  {
                    $arrayElemAt: ['$form_data.files.ngo_cover_photo', 0],
                  },
                ],
              },
              is_deleted: 1,
              phone_country_short_name:
                '$form_data.ngo_mobile_number.short_name',
              ngo_status: 1,
            })
            .lean();
          if (!_.isEmpty(ngo)) {
            userData._id = ngo._id;
            userData.user_name = ngo.ngo_name;
            userData.phone = ngo.ngo_phone;
            userData.phone_code = ngo.ngo_phone_code;
            userData.location = ngo.ngo_location;
            userData.email = ngo?.ngo_email || null;
            userData.image = _.isNull(ngo.ngo_cover_image)
              ? null
              : ngo.ngo_cover_image;
            userData.is_deleted = ngo.is_deleted ? ngo.is_deleted : false;
            userData.phone_country_short_name = ngo?.phone_country_short_name;
            userData.ngo_status = ngo.ngo_status;
          }
        } else {
          const user = await this.userModel
            .findById({ _id: userId })
            .select({
              _id: 1,
              first_name: 1,
              last_name: 1,
              display_name: 1,
              phone: 1,
              phone_code: 1,
              location: 1,
              email: 1,
              image: 1,
              is_deleted: 1,
              is_guest: 1,
              phone_country_short_name: 1,
            })
            .lean();
          if (!_.isEmpty(user)) {
            userData._id = user._id;
            userData.first_name = user.first_name;
            userData.last_name = user.last_name;
            userData.user_name = user.display_name
              ? user.display_name
              : user.first_name + ' ' + user.last_name;
            userData.phone = user.phone;
            userData.phone_code = user.phone_code;
            userData.location = user.location;
            userData.email = user.email;
            userData.image = _.isNull(user.image)
              ? null
              : authConfig.imageUrl + 'user/' + user.image;
            userData.is_deleted = user.is_deleted ? user.is_deleted : false;
            userData.is_guest = user.is_guest ? user.is_guest : false;
            userData.phone_country_short_name = user?.phone_country_short_name;
          }
        }
      }
      return userData;
    } catch (e) {
      return e;
    }
  }

  /**
   * Function for send notification to admin
   *
   */
  async sendAdminNotification(input, hidden = false) {
    return new Promise(async (resolve, reject) => {
      try {
        const adminData = await this.adminModel.find().lean();
        if (!_.isEmpty(adminData)) {
          for (let i = 0; i < adminData.length; i++) {
            let item = adminData[i];
            const adminTokens = await this.adminTokenModel
              .find({ admin_id: ObjectID(item._id) })
              .lean();
            if (!_.isEmpty(adminTokens)) {
              const tokens = [];
              adminTokens.map(async (token) => {
                tokens.push(token.fcm_token);
              });
              const notification: any = {
                user_id: item._id,
                title: input.title,
                message: input.message,
                type: input.type,
                // is_send: false,
                uuid: tokens,
              };
              if (input.requestId) {
                notification.request_id = input.requestId;
              }
              if (input.categorySlug) {
                notification.category_slug = input.categorySlug;
              }
              if (input.ngoId) {
                notification.ngo_id = input.ngoId;
              }
              if (input.corporateId) {
                notification.corporate_id = input.corporateId;
              }
              if (input.fundId) {
                notification.fund_id = input.fundId;
              }
              if (input.additionalData) {
                notification.additional_data = input.additionalData;
              }
              if (!_.isEmpty(tokens)) {
                let message;
                if (hidden) {
                  message = {
                    registration_ids: notification.uuid,
                    contentAvailable: 1,
                    data: {
                      //you can send only notification or only data(or include both)
                      type: notification.type,
                      request_id: notification.request_id,
                      fund_id: notification.fund_id,
                      corporate_id: notification.corporate_id,
                      category_slug: notification.categorySlug,
                      ngo_id: notification.ngoId,
                      additional_data: notification.additionalData,
                    },
                  };
                } else {
                  message = {
                    registration_ids: notification.uuid,
                    notification: {
                      title: notification.title,
                      body: notification.message,
                    },
                    data: {
                      //you can send only notification or only data(or include both)
                      type: notification.type,
                      request_id: notification.request_id,
                      fund_id: notification.fund_id,
                      corporate_id: notification.corporate_id,
                      category_slug: notification.categorySlug,
                      ngo_id: notification.ngoId,
                      additional_data: notification.additionalData,
                    },
                  };
                }
                const createNotification = new this.adminNotificationModel(
                  notification,
                );
                await createNotification.save();
                fcm.send(message, async function (err, response) {
                  if (err) {
                    return err;
                  } else {
                    return response;
                  }
                });
              }
            }
          }
          resolve(true);
        }
      } catch (error) {
        return {
          success: false,
          message: mConfig.Something_went_wrong,
        };
      }
    });
  }

  /**
   * Function to get template from transaction type
   * @param type
   * @param changeArray
   * @returns
   */
  async getDownloadTemplate(transactionType: string) {
    try {
      let templateName;
      if (transactionType === 'ngo-donation') {
        templateName = 'ngo-donation-receipt';
      } else if (transactionType === 'featured-transaction') {
        templateName = 'invoice-receipt';
      } else if (transactionType === 'admin-transaction') {
        templateName = 'admin-transaction-receipt';
      } else {
        templateName = 'single-receipt-template';
      }

      const data = await this.EmailTemplateModel.findOne({
        email_slug: templateName,
        email_status: 'Active',
      })
        .select({ email_content: 1 })
        .lean();

      return data;
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Function to replace email template data
   * @param type
   * @param changeArray
   * @returns
   */
  async getPDFHtml(transactionType: string, changeArray: any) {
    try {
      const data: any = await this.getDownloadTemplate(transactionType);

      let html: any = '';
      if (_.isEmpty(data)) {
        return {
          success: false,
        };
      }
      html =
        "<html><head> <title>SHAAYAM</title> <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"> <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin> <style>/* devanagari */ @font-face{font-family: 'Poppins'; font-style: normal; font-weight: 500; font-display: swap; src: url(https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z11lFc-K.woff2) format('woff2'); unicode-range: U+0900-097F, U+1CD0-1CF6, U+1CF8-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FB;}/* latin-ext */ @font-face{font-family: 'Poppins'; font-style: normal; font-weight: 500; font-display: swap; src: url(https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1JlFc-K.woff2) format('woff2'); unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;}/* latin */ @font-face{font-family: 'Poppins'; font-style: normal; font-weight: 500; font-display: swap; src: url(https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;}h1{color: #0bbced; border-radius: 4px; padding: 5px; padding-left: 2px; text-align: \"right\"}table{border-collapse: collapse; width: 100%}.pTitle{margin: 0; font-size: 12px}p{font-weight: 400}body{font-family: sans-serif; padding: 20px 50px; margin: 0 auto; letter-spacing: .2;line-height: 1.2}.head-align-center{display: flex; justify-content: space-between; margin-top: 40px}.align-center{display: flex; justify-content: space-between; align-items: center}.tdClass{width: auto}.tdClass td{font-size: 12px; width: 140px}.spacingClass{letter-spacing: 1px; margin: 0}.innerSection{background-color: #e2f9ff; padding: 15; margin-top: 30; font-size: 14px}.innerSection h3{letter-spacing: 1px; margin: 0}footer{text-align: center; width: auto}@media print{footer{position: fixed; left: 50px; right: 50px; bottom: 0; text-align: center}}.h5{font-weight: 400; margin-top: 30; margin-bottom: 30}.addDiv{display: flex; flex-direction: column; margin-top: 5; margin-bottom: 15; font-size: 12px; letter-spacing: 0.5px; font-weight: 600; width: 300px}</style></head><body>" +
        data.email_content +
        '</body></html>';

      if (!_.isEmpty(changeArray)) {
        Object.keys(changeArray).forEach((key) => {
          // html = html.replace(key, changeArray[key]);
          html = _.replace(html, new RegExp(key, 'g'), changeArray[key]);
        });
      }
      return html;
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Common function to get detail of particular country
   * @param type
   * @param changeArray
   * @returns
   */
  async getCountry(country) {
    try {
      const countryCode = code(country);
      let countryData: any = await this.currencyModel
        .findOne(
          { country_code: countryCode },
          { country: 1, currency: 1, emoji: 1, country_code: 1 },
        )
        .lean();

      // Add code for no country found.
      if (!countryData) {
        const addData = {
          country: country,
          country_code: countryCode,
          currency: [
            {
              name: 'USD',
              symbol: '$',
            },
          ],
          emoji: flag(country),
          createdBy: 'auto',
          updatedBy: 'auto',
          status: 'Active',
        };
        const createCurrency = new this.currencyModel(addData);
        const newCountry = await createCurrency.save();
        countryData = {
          country: newCountry.country,
          country_code: newCountry.country_code,
          currency: newCountry.currency,
          emoji: newCountry.emoji,
        };
      }
      return countryData;
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Common function to replace specific key for any string
   * @param type
   * @param changeArray
   * @returns
   */
  async changeString(stringData, changeWith) {
    let data: any = stringData;
    if (!_.isEmpty(changeWith)) {
      Object.keys(changeWith).forEach((key) => {
        data = _.replace(data, new RegExp(key, 'g'), changeWith[key]);
        // data = data.replace(key, changeWith[key]);
      });
    }
    return data;
  }

  /**
   * Common function to get distance and time
   * @param type
   * @param changeArray
   * @returns
   */
  async getDistanceTime(lat1, lng1, lat2, lng2) {
    return new Promise(async (resolve) => {
      try {
        request(
          {
            method: 'GET',
            url: `https://maps.googleapis.com/maps/api/directions/json?destination=${lat2},${lng2}&origin=${lat1},${lng1}&key=${process.env.GOOGLE_API_KEY}`,
            headers: {},
          },
          (error, response) => {
            if (error) {
              resolve(false);
            }

            if (response && response.statusCode === 200) {
              const res = JSON.parse(response.body);
              if (res && res.routes[0] && res.routes[0].legs[0]) {
                const geoDistance = {
                  distance: res?.routes[0]?.legs[0]?.distance?.text,
                  time: res?.routes[0]?.legs[0]?.duration?.text,
                };
                resolve(geoDistance);
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          },
        );
      } catch (error) {
        resolve([]);
      }
    });
  }

  /**
   * Common function to send notification to all user
   * @param type
   * @param changeArray
   * @returns
   */
  async sendAllUsersNotification(
    userId = [],
    input,
    country = null,
    hidden = false,
  ) {
    try {
      const query = {
        _id: { $nin: userId },
        // 'country_data.country': country,
        is_deleted: false,
        is_guest: { $ne: true },
      };
      if (country && !_.isUndefined(country) && !_.isEmpty(country)) {
        query['country_data.country'] = country;
      }

      const users = await this.userModel.find(query).select({ _id: 1 }).lean();
      for await (const user of users) {
        input.userId = user._id;
        await this.notification(input, hidden);
      }
    } catch (error) {
      return error;
    }
  }

  /**
   * Function for generate short and unique reference id
   * @param countryCode
   * @returns
   */
  async generateUniqueId(countryCode) {
    const currentTime = parseInt(moment().format('X'));
    const seq = (Math.floor(Math.random() * 10000) + 10000)
      .toString()
      .substring(1);
    const uniqueId = countryCode + '-' + currentTime + '-' + seq;
    return uniqueId;
  }

  /**
   * Common function to get mongooes filter object
   * @param type
   * @param changeArray
   * @returns
   */
  async filter(operator, value, field) {
    const obj = {};
    try {
      value = JSON.parse(value).trim();
    } catch (e) {}
    // value = (JSON.parse(value)).trim();

    if (operator === 'contains') {
      obj[field] = new RegExp(
        value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
        'i',
      );
    } else if (operator === '=' && value) {
      obj[field] = Number(value);
    } else if (operator === 'is') {
      obj[field] = value;
    } else if (operator === 'date' && value) {
      value = new Date(Date.parse(value));
      const tomorrow = new Date(value);
      tomorrow.setDate(value.getDate() + 1);
      tomorrow.toLocaleDateString();
      obj[field] = { $gte: value, $lt: tomorrow };
    } else if (operator === 'boolean') {
      value = value == 'true' || value == true ? true : false;
      obj[field] = value;
    } else if (operator === 'objectId' && value.length === 24) {
      obj[field] = ObjectID(value);
    }
    return obj;
  }

  /**
   * Common function to get converted number
   * @param type
   * @param changeArray
   * @returns
   */
  async convertNumberToWords(amount) {
    const words = [];
    words[0] = '';
    words[1] = 'One';
    words[2] = 'Two';
    words[3] = 'Three';
    words[4] = 'Four';
    words[5] = 'Five';
    words[6] = 'Six';
    words[7] = 'Seven';
    words[8] = 'Eight';
    words[9] = 'Nine';
    words[10] = 'Ten';
    words[11] = 'Eleven';
    words[12] = 'Twelve';
    words[13] = 'Thirteen';
    words[14] = 'Fourteen';
    words[15] = 'Fifteen';
    words[16] = 'Sixteen';
    words[17] = 'Seventeen';
    words[18] = 'Eighteen';
    words[19] = 'Nineteen';
    words[20] = 'Twenty';
    words[30] = 'Thirty';
    words[40] = 'Forty';
    words[50] = 'Fifty';
    words[60] = 'Sixty';
    words[70] = 'Seventy';
    words[80] = 'Eighty';
    words[90] = 'Ninety';
    amount = amount.toString();
    const atemp = amount.split('.');
    const number = atemp[0].split(',').join('');
    const n_length = number.length;
    let words_string = '';
    if (n_length <= 9) {
      const n_array: any = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      const received_n_array = [];
      for (let i = 0; i < n_length; i++) {
        received_n_array[i] = number.substr(i, 1);
      }
      for (let i = 9 - n_length, j = 0; i < 9; i++, j++) {
        n_array[i] = received_n_array[j];
      }
      for (let i = 0, j = 1; i < 9; i++, j++) {
        if (i == 0 || i == 2 || i == 4 || i == 7) {
          if (n_array[i] == 1) {
            n_array[j] = 10 + parseInt(n_array[j]);
            n_array[i] = 0;
          }
        }
      }
      let value: any = '';
      for (let i = 0; i < 9; i++) {
        if (i == 0 || i == 2 || i == 4 || i == 7) {
          value = n_array[i] * 10;
        } else {
          value = n_array[i];
        }
        if (value != 0) {
          words_string += words[value] + ' ';
        }
        if (
          (i == 1 && value != 0) ||
          (i == 0 && value != 0 && n_array[i + 1] == 0)
        ) {
          words_string += 'Crores ';
        }
        if (
          (i == 3 && value != 0) ||
          (i == 2 && value != 0 && n_array[i + 1] == 0)
        ) {
          words_string += 'Lakhs ';
        }
        if (
          (i == 5 && value != 0) ||
          (i == 4 && value != 0 && n_array[i + 1] == 0)
        ) {
          words_string += 'Thousand ';
        }
        if (
          i == 6 &&
          value != 0 &&
          n_array[i + 1] != 0 &&
          n_array[i + 2] != 0
        ) {
          words_string += 'Hundred and ';
        } else if (i == 6 && value != 0) {
          words_string += 'Hundred ';
        }
      }
      words_string = words_string.split('  ').join(' ');
    }
    return words_string;
  }

  /**
   *Converts a numeric value with a decimal point into words.
   * @param type
   * @param changeArray
   * @returns
   */
  async withDecimal(n) {
    const nums = n.toString().split('.');
    const whole = await this.convertNumberToWords(nums[0]);
    if (nums.length == 2) {
      let addExtra = 'tenths';
      if (nums[1] > 9) {
        if (nums[1] % 10 == 0) {
          addExtra = 'tenths';
        } else {
          addExtra = 'hundredths';
        }
      }
      if (nums[1] !== '00') {
        const fraction = await this.convertNumberToWords(nums[1]);
        return whole + 'and ' + fraction + addExtra;
      } else {
        return whole;
      }
    } else {
      return whole;
    }
  }

  /**
   *Converts a numerical amount to its textual representation in a specified currency.
   * @param type
   * @param changeArray
   * @returns
   */
  async withDecimalNew(n, currency = 'USD') {
    const worldCurrencies = require('world-currencies');
    const currencyObj = worldCurrencies[currency];
    if (!_.isUndefined(currencyObj)) {
      const majorCur = currencyObj?.units?.major?.name;
      const formatMajorCur =
        majorCur.charAt(0).toUpperCase() + majorCur.slice(1) + 's';

      const minCur = currencyObj?.units?.minor?.name;
      const formatMinCur =
        minCur.charAt(0).toUpperCase() + minCur.slice(1) + 's';

      const toWords = new ToWords({
        localeCode: 'en-IN',
        converterOptions: {
          currency: true,
          ignoreDecimal: false,
          ignoreZeroCurrency: false,
          doNotAddOnly: false,
          currencyOptions: {
            // can be used to override defaults for the selected locale
            name: formatMajorCur,
            plural: formatMajorCur,
            symbol: '',
            fractionalUnit: {
              name: formatMinCur,
              plural: formatMinCur,
              symbol: '',
            },
          },
        },
      });

      const words = toWords.convert(n);
      return words + '.';
    } else {
      this.withDecimal(n);
    }
  }

  /**
   *Generates the next receipt number based on user data and previous transactions.
   * @param type
   * @param changeArray
   * @returns
   */
  async nextReceiptNum(userId) {
    // const user = user;
    const user = await this.userModel
      .findOne({ _id: userId })
      .select({ _id: 1, country_data: 1 });
    const country_code = user.country_data.country_code;
    const date = new Date();
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    const transaction = await this.transactionModel
      .findOne({}, { _id: 1, receipt_number: 1 })
      .sort({ _id: -1 })
      .limit(1);

    if (!_.isEmpty(transaction)) {
      const oldNum = transaction.receipt_number;
      const arr = oldNum.split('/');
      const num = arr[2];
      const numWithoutDate = num.slice(8);
      const nextNum = parseInt(numWithoutDate) + 1;
      var nextNumStr = nextNum.toString();
      if (nextNumStr.length < 6) {
        nextNumStr = ('000000' + nextNum).slice(-6);
      }
    } else {
      const nextNum = 1;
      nextNumStr = ('000000' + nextNum).slice(-6);
    }

    const newRefNum =
      country_code +
      '/' +
      'M/' +
      year +
      '' +
      month +
      '' +
      day +
      '' +
      nextNumStr;
    return newRefNum;
  }

  /**
   *Common function for send email
   * @param type
   * @param changeArray
   * @returns
   */
  async sendMail(data, apiUrl = null) {
    const transporter = nodemailer.createTransport({
      // service: 'gmail',
      host: 'us2.smtp.mailhostbox.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'info@saayam.com',
        pass: 'hB$)jXv6',
      },
    });

    const mailMsg = data.message;

    const mailOptions = {
      from: {
        name: 'Saayam Team',
        address: 'info@saayam.com',
      },
      to: data.to,
      subject: data.subject,
      text: mailMsg,
      // html: EmailMsg
    };

    const _this = this;
    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        await _this.addSmtpLog(mailOptions, error, apiUrl, false);
        return false;
      } else {
        await _this.addSmtpLog(mailOptions, info, apiUrl, true);
        return true;
      }
    });
  }

  /**
   *Common function for get timezone
   * @param type
   * @param changeArray
   * @returns
   */
  async getTimezoneFromLatLon(lat, lon) {
    const { find } = require('geo-tz');

    const timezone = find(lat, lon);

    return timezone[0];
  }

  /**
   *Converts a given date from a specified timezone to its equivalent UTC representation.
   * @param type
   * @param changeArray
   * @returns
   */
  async convertDateToUTC(date, timezone) {
    const endDate = new Date(moment(date).tz(timezone).endOf('day').format());
    // let endDate = moment.tz(date, timezone).endOf('day').utc();

    return endDate;
  }

  /**
   *Get latitude and longitude coordinates from an address using the NodeGeocoder library.
   * @param type
   * @param changeArray
   * @returns
   */
  async getLatLongFromAddress(address) {
    const NodeGeocoder = require('node-geocoder');

    const options = {
      provider: 'google',

      // Optional depending on the providers
      // fetch: customFetchImplementation,
      apiKey: process.env.GOOGLE_MAP_API_KEY, // for Mapquest, OpenCage, Google Premier
      formatter: null, // 'gpx', 'string', ...
    };

    const geocoder = NodeGeocoder(options);

    const res = await geocoder.geocode(address);

    let result = [];
    if (res.length) {
      result['latitude'] = res[0].latitude ? res[0].latitude : 0;
      result['longitude'] = res[0].longitude ? res[0].longitude : 0;
      result['address'] = res[0].formattedAddress ? res[0].formattedAddress : 0;
    } else {
      result['latitude'] = 0;
      result['longitude'] = 0;
      result['address'] = address;
    }

    return result;
  }

  /**
   *Common function for import csv
   * @param type
   * @param changeArray
   * @returns
   */
  public async importCsv() {
    try {
      const result = await this.csvUploadModel
        .find({
          imported: { $ne: true },
        })
        .limit(10);

      if (!_.isEmpty(result)) {
        await Promise.all(
          result.map(async (file: any) => {
            if (file.type == 'corporate') {
              this.importCorporateCsv(file);
            } else {
              this.importSchoolHospitalCsv(file);
            }
          }),
        );
      }
    } catch (error) {}
  }

  /**
   *Common function for import school and hospital detail csv
   * @param type
   * @param changeArray
   * @returns
   */
  public async importSchoolHospitalCsv(file) {
    try {
      const csv = require('csvtojson');
      const commonService = this;
      const _hospitalModel = this.hospitalImportModel;
      const _schoolModel = this.schoolImportModel;

      const file_name = file.file_name;
      const filepath = __dirname + `/../../uploads/csv/${file_name}`;
      const jsonArray = await csv().fromFile(filepath);

      const failedRows = [];
      if (!_.isEmpty(jsonArray)) {
        let rows = 2;
        let addData = [];

        for (let i = 0; i < jsonArray.length; i++) {
          addData = [];
          const data = jsonArray[i];

          await Promise.all(
            Object.keys(data).map(async function (key) {
              let val = data[key];
              if (
                key === 'areas_served' ||
                key === 'courses_or_diseases' ||
                key === 'departments' ||
                key === 'academic'
              ) {
                val = data[key].split(',');
              } else if (key === 'address' && data[key] != '') {
                const latLongaddress =
                  await commonService.getLatLongFromAddress(data[key]);
                val = {
                  type: 'Point',
                  coordinates: [
                    latLongaddress['longitude'],
                    latLongaddress['latitude'],
                  ],
                  city: latLongaddress['address'],
                };
                key = 'location';
              } else if (key === 'emergency_department') {
                val = data[key].toLowerCase() == 'yes' ? true : false;
              }

              addData[key] = val;
            }),
          );
          addData['type'] =
            file.type.charAt(0).toUpperCase() + file.type.slice(1);
          addData['createdBy'] = file.uploadedBy;
          addData['updatedBy'] = file.uploadedBy;

          try {
            if (addData['type'] == 'Hospital') {
              const createHospital = new _hospitalModel(addData);
              await createHospital.save();
            } else {
              const createSchool = new _schoolModel(addData);
              await createSchool.save();
            }
          } catch (error) {
            failedRows.push({ row: rows, message: error.message });
          }
          rows++;
        }

        const body: any = {};
        body.failed_rows = failedRows;
        body.imported = true;
        body.status = 'Success';

        await this.csvUploadModel
          .findByIdAndUpdate(file._id, body, { new: true })
          .select({ _id: 1 })
          .lean();
      }
      return true;
    } catch (error) {}
  }

  /**
   *Common function for import corporate detail csv
   * @param type
   * @param changeArray
   * @returns
   */
  public async importCorporateCsv(file) {
    try {
      const csv = require('csvtojson');
      const _inviteModel = this.corporateInviteModel;

      const file_name = file.file_name;
      const filepath = __dirname + `/../../uploads/csv/corporate/${file_name}`;
      const jsonArray = await csv().fromFile(filepath);

      const failedRows = [];
      if (!_.isEmpty(jsonArray)) {
        let rows = 2;
        let addData: any = [];

        for (let i = 0; i < jsonArray.length; i++) {
          addData = [];
          const data = jsonArray[i];
          await Promise.all(
            Object.keys(data).map(async function (key) {
              const val = data[key];
              addData[key] = val;
            }),
          );

          try {
            addData.type = 'upload_csv';
            addData.corporate_id = file.entity_id;
            const createData = new _inviteModel(addData);
            const result = await createData.save();

            const message = await this.changeString(mConfig.send_invite_msg, {
              '{{uname}}': result.first_name + ' ' + result.last_name,
              '{{link}}': process.env.CORPORATE_INVITE_LINK,
            });
            if (result.email) {
              //send email to users
              const input = {
                to: result.email,
                subject: 'Corporate Invitations',
                message: message,
              };
              await this.sendMail(input);
            }
            if (result.phone_code && result.phone) {
              //send SMS to users
              const text = {
                phone: [result.phone_code + ' ' + result.phone],
                message: message,
              };
              await this.sendTextMessage(text, 'importCorporateCsv');
            }
            //send mail to user
          } catch (error) {
            failedRows.push({ row: rows, message: error.message });
          }
          rows++;
        }

        const body: any = {};
        body.failed_rows = failedRows;
        body.imported = true;
        body.status = 'Success';

        await this.csvUploadModel
          .findByIdAndUpdate(file._id, body, { new: true })
          .select({ _id: 1 })
          .lean();
      }
    } catch (error) {}
  }

  /**
   *This function constructs a MongoDB query for global filtering based on the given fieldsArray and value.
   * @param type
   * @param changeArray
   * @returns
   */
  async getGlobalFilter(fieldsArray, value) {
    try {
      let query = fieldsArray.map(function (key) {
        const obj = {};
        if (
          key === 'createdAt' ||
          key === 'form_data.expiry_date' ||
          key === 'updatedAt' ||
          key === 'approve_time' ||
          key === 'deletedAt' ||
          key === 'expiry_date'
        ) {
          const temp_value = new Date(Date.parse(value));
          const tomorrow = new Date(temp_value);
          tomorrow.setDate(temp_value.getDate() + 1);
          tomorrow.toLocaleDateString();
          if (temp_value.toString() != 'Invalid Date') {
            obj[key] = { $gte: temp_value, $lt: tomorrow };
          }
        } else if (key === '_id' && value.length == 24) {
          obj[key] = ObjectID(value);
        } else if (key === 'status') {
          obj[key] = new RegExp('^' + value, 'i');
        } else if (key != '_id') {
          obj[key] = new RegExp(
            value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
            'i',
          );
        }
        return obj;
      });
      query = query.filter((value) => Object.keys(value).length !== 0);
      return query;
    } catch (error) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   *Get a filter query for matching numeric values in an array of fields.
   * @param type
   * @param changeArray
   * @returns
   */
  async getNumberFilter(fieldsArray, value) {
    try {
      let query = fieldsArray.map(function (key) {
        const obj = {};
        obj[key] = Number(value);
        return obj;
      });
      query = query.filter((value) => Object.keys(value).length !== 0);
      return query;
    } catch (error) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   *Retrieve an array of filter objects based on specified fields and a value.
   * @param type
   * @param changeArray
   * @returns
   */
  async getObjectFilter(fieldsArray, value) {
    try {
      let query = fieldsArray.map(function (key) {
        const obj = {};
        if (value.length == 24) {
          obj[key] = ObjectID(value);
        }
        return obj;
      });
      query = query.filter((value) => Object.keys(value).length !== 0);
      return query;
    } catch (error) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Retrieve an array of filter objects based on specified fields and a value.
   *
   */
  async getBooleanFilter(fieldsArray, value) {
    try {
      let query = fieldsArray.map(function (key) {
        const obj = {};
        if (value.toLowerCase() == 'yes' || value.toLowerCase() == 'no') {
          const temp = value.toLowerCase() == 'yes' ? true : false;
          obj[key] = temp;
        }
        return obj;
      });
      query = query.filter((value) => Object.keys(value).length !== 0);
      return query;
    } catch (error) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Get common settings data for a specific country.
   *
   */
  async getCommonSetting(country) {
    try {
      let findSetting: any = await this.commonSettingModel
        .findOne({ country: country, status: 'active' })
        .select({ form_data: 1 })
        .lean();

      if (_.isEmpty(findSetting)) {
        findSetting = await this.commonSettingModel
          .findOne({ country: 'global', status: 'active' })
          .select({ form_data: 1 })
          .lean();
      }
      return findSetting;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get the region from a country code.
   *
   */
  async getRegionFromCountryCode(countryCode) {
    let countryData: any = await this.currencyModel
      .findOne(
        { $or: [{ country_code: countryCode }, { country: countryCode }] },
        { region: 1 },
      )
      .lean();

    if (!_.isEmpty(countryData)) {
      return countryData.region;
    }
    return '';
  }

  /**
   * Get fund data based on a fund ID.
   *
   *
   */
  async getFundData(fund_id) {
    const transactions = await this.transactionModel
      .aggregate([
        {
          $match: {
            fund_id: ObjectID(fund_id),
          },
        },
        {
          $group: {
            _id: '$fund_id',
            received: {
              $sum: {
                $cond: [
                  { $eq: ['$transaction_type', 'fund-received'] },
                  '$converted_amt',
                  0,
                ],
              },
            },
            donated: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$transaction_type', 'fund-donated'] },
                      { $ne: ['$saayam_community', true] },
                    ],
                  },
                  '$converted_amt',
                  0,
                ],
              },
            },
          },
        },
      ])
      .exec();

    let res = [];
    if (!_.isEmpty(transactions)) {
      res['received'] = transactions[0].received;
      res['donated'] = transactions[0].donated;
      res['left'] = transactions[0].received - transactions[0].donated;
    } else {
      res['received'] = 0;
      res['donated'] = 0;
      res['left'] = 0;
    }
    return res;
  }

  /**
   * Get the fund balance for a specific fund.
   *
   */
  async getFundBalance(fund_id) {
    const funddata = await this.getFundData(fund_id);
    return funddata['received'] - funddata['donated'];
  }

  /**
   * Get the user's fund balance for a specific fund.
   *
   */
  async getUserFundBalance(fund_id, user_id) {
    const fund = await this.fundModel
      .aggregate([
        { $match: { _id: ObjectID(fund_id) } },
        { $unwind: '$admins' },
        { $match: { 'admins.user_id': ObjectID(user_id) } },
        { $project: { admins: 1 } },
      ])
      .exec();

    let max_limit = 0;
    if (!_.isEmpty(fund)) {
      max_limit = fund[0].admins.max_donate_amount;
    }

    const transactions = await this.transactionModel
      .aggregate([
        {
          $match: {
            fund_id: ObjectID(fund_id),
          },
        },
        {
          $group: {
            _id: '$fund_id',
            received: {
              $sum: {
                $cond: [
                  { $eq: ['$transaction_type', 'fund-received'] },
                  '$converted_amt',
                  0,
                ],
              },
            },
            donated: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$transaction_type', 'fund-donated'] },
                      { $ne: ['$saayam_community', true] },
                    ],
                  },
                  '$converted_amt',
                  0,
                ],
              },
            },
            user_donated: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$transaction_type', 'fund-donated'] },
                      { $eq: ['$user_id', ObjectID(user_id)] },
                      { $ne: ['$saayam_community', true] },
                    ],
                  },
                  '$converted_amt',
                  0,
                ],
              },
            },
          },
        },
      ])
      .exec();
    let amtleft = 0;
    if (!_.isEmpty(transactions)) {
      let received = transactions[0].received;
      let donated = transactions[0].donated;
      amtleft = received - donated;

      if (max_limit != null && max_limit > 0) {
        let user_donated = transactions[0].user_donated;
        amtleft = max_limit - user_donated;
      }
    }
    return amtleft;
  }

  /**
   * Update donation data for a specific request.
   *
   */
  async updateRequestDonationData(request, amount) {
    const totalDonation = Number(request.total_donation) + Number(amount);
    const goalAmount = Number(request.form_data.goal_amount);
    const avgDonation: any =
      totalDonation >= goalAmount ? 100 : (totalDonation / goalAmount) * 100;
    const remainingAmount =
      totalDonation >= goalAmount ? 0 : goalAmount - totalDonation;
    const updateData: any = {
      $set: {
        total_donation: totalDonation,
        total_donors: Number(request.total_donors) + 1,
        avg_donation: parseInt(avgDonation),
        'form_data.remaining_amount': Number(remainingAmount),
        status: totalDonation >= goalAmount ? 'complete' : request.status,
      },
    };
    const data: any = await this.requestModel
      .findByIdAndUpdate({ _id: request._id }, updateData, {
        new: true,
      })
      .select({ form_settings: 0 })
      .lean();
    return data;
  }

  /**
   * Synchronize exchange rates from an external source and update the database.
   */
  async syncExchangeRates() {
    var axios = require('axios');

    let url =
      'https://dashboard.stripe.com/ajax/exchange_rates?currencies[]=aed&currencies[]=afn&currencies[]=all&currencies[]=amd&currencies[]=ang&currencies[]=aoa&currencies[]=ars&currencies[]=aud&currencies[]=awg&currencies[]=azn&currencies[]=bam&currencies[]=bbd&currencies[]=bdt&currencies[]=bgn&currencies[]=bhd&currencies[]=bif&currencies[]=bmd&currencies[]=bnd&currencies[]=bob&currencies[]=brl&currencies[]=bsd&currencies[]=bwp&currencies[]=byn&currencies[]=bzd&currencies[]=cad&currencies[]=cdf&currencies[]=chf&currencies[]=clp&currencies[]=cny&currencies[]=cop&currencies[]=crc&currencies[]=cve&currencies[]=czk&currencies[]=djf&currencies[]=dkk&currencies[]=dop&currencies[]=dzd&currencies[]=egp&currencies[]=etb&currencies[]=eur&currencies[]=fjd&currencies[]=fkp&currencies[]=gbp&currencies[]=gel&currencies[]=gip&currencies[]=gmd&currencies[]=gnf&currencies[]=gtq&currencies[]=gyd&currencies[]=hkd&currencies[]=hnl&currencies[]=hrk&currencies[]=htg&currencies[]=huf&currencies[]=idr&currencies[]=ils&currencies[]=inr&currencies[]=isk&currencies[]=jmd&currencies[]=jod&currencies[]=jpy&currencies[]=kes&currencies[]=kgs&currencies[]=khr&currencies[]=kmf&currencies[]=krw&currencies[]=kwd&currencies[]=kyd&currencies[]=kzt&currencies[]=lak&currencies[]=lbp&currencies[]=lkr&currencies[]=lrd&currencies[]=lsl&currencies[]=mad&currencies[]=mdl&currencies[]=mga&currencies[]=mkd&currencies[]=mmk&currencies[]=mnt&currencies[]=mop&currencies[]=mro&currencies[]=mur&currencies[]=mvr&currencies[]=mwk&currencies[]=mxn&currencies[]=myr&currencies[]=mzn&currencies[]=nad&currencies[]=ngn&currencies[]=nio&currencies[]=nok&currencies[]=npr&currencies[]=nzd&currencies[]=omr&currencies[]=pab&currencies[]=pen&currencies[]=pgk&currencies[]=php&currencies[]=pkr&currencies[]=pln&currencies[]=pyg&currencies[]=qar&currencies[]=ron&currencies[]=rsd&currencies[]=rub&currencies[]=rwf&currencies[]=sar&currencies[]=sbd&currencies[]=scr&currencies[]=sek&currencies[]=sgd&currencies[]=shp&currencies[]=sle&currencies[]=sll&currencies[]=sos&currencies[]=srd&currencies[]=std&currencies[]=szl&currencies[]=thb&currencies[]=tjs&currencies[]=tnd&currencies[]=top&currencies[]=try&currencies[]=ttd&currencies[]=twd&currencies[]=tzs&currencies[]=uah&currencies[]=ugx&currencies[]=usd&currencies[]=uyu&currencies[]=uzs&currencies[]=vnd&currencies[]=vuv&currencies[]=wst&currencies[]=xaf&currencies[]=xcd&currencies[]=xof&currencies[]=xpf&currencies[]=yer&currencies[]=zar&currencies[]=zmw';
    var config = {
      method: 'get',
      url: url,
      // withCredentials: true,
      headers: {
        'stripe-account': 'acct_1C5pgeKI4ZB8gO4u',
        Cookie: process.env.STRIPE_COOKIE,
      },
    };

    const exchangeRates = this.exchangeRatesModel;
    axios(config)
      .then(function (response) {
        let result = response.data;
        if (result.data) {
          result.data.map(async (item: any) => {
            await exchangeRates
              .updateOne(
                { currency: item.id },
                { currency: item.id, rates: item.rates, updatedAt: new Date() },
                { upsert: true },
              )
              .lean();
          });
        }
      })
      .catch(function (error) {
        this.errorlogService.errorLog(
          error,
          'src/common/common.service.ts-syncExchangeRates',
        );
      });
  }

  // async getExchangeRate(from, to, amount) {
  //   from = from.toLowerCase();
  //   to = to.toLowerCase();
  //   let currency = await this.exchangeRatesModel
  //     .findOne({ currency: from })
  //     .lean();

  //   let newAmount = 0;
  //   let status = true;
  //   let conversionrate = 0;
  //   if (!_.isEmpty(currency)) {
  //     let rates: any = currency.rates;
  //     if (!_.isUndefined(rates[to])) {
  //       newAmount = Number(rates[to]) * Number(amount);
  //       conversionrate = rates[to];
  //     } else if (from === to) {
  //       newAmount = amount;
  //       conversionrate = 1;
  //     } else {
  //       status = false;
  //     }
  //   } else {
  //     status = false;
  //   }

  //   let result = [];
  //   result['amount'] = newAmount;
  //   result['status'] = status;
  //   result['rate'] = conversionrate;
  //   return result;
  // }

  async getExchangeRate(from, to, amount) {
    from = from.toLowerCase();
    to = to.toLowerCase();
    const currency = await this.exchangeRatesModel
      .findOne({ currency: 'usd' })
      .lean();

    let newAmount = 0;
    let status = true;
    let conversionrate = 0;
    if (!_.isEmpty(currency)) {
      const rates: any = currency.rates;
      rates['usd'] = 1;

      if (from === to) {
        newAmount = amount;
        conversionrate = 1;
      } else if (!_.isUndefined(rates[to])) {
        const fromRate = rates[from.toLowerCase()];

        const toRate = rates[to.toLowerCase()];

        const conversionRate = toRate / fromRate;
        const convertedAmount = amount * conversionRate;

        newAmount = Number(convertedAmount);
        conversionrate = Number(conversionRate);
      } else {
        status = false;
      }
    } else {
      status = false;
    }

    const result = [];
    result['amount'] = newAmount;
    result['status'] = status;
    result['rate'] = conversionrate;
    return result;
  }

  /**
   * Get exchange rates for a specific currency.
   *
   */
  async getExchangeRateByCurrency(currency) {
    currency = currency.toLowerCase();
    let res = await this.exchangeRatesModel
      .findOne({ currency: currency })
      .lean();

    if (!_.isEmpty(res)) {
      const result = Object.fromEntries(
        Object.entries(res.rates).map(([key, val]) => [key.toUpperCase(), val]),
      );
      return result;
    } else {
      return [];
    }
  }

  /**
   * Update user data in various records with the provided user information.
   *
   */
  async updateUserInAllRecords(userOldData, updatedUser) {
    try {
      const uname = updatedUser.first_name + ' ' + updatedUser.last_name;
      const update = {
        uname: uname,
        user_image: updatedUser.image,
      };
      if (
        userOldData.first_name !== updatedUser.first_name ||
        userOldData.last_name !== updatedUser.last_name ||
        userOldData.image !== updatedUser.image
      ) {
        //user
        await this.requestModel
          .updateMany({ user_id: ObjectID(updatedUser._id) }, update)
          .lean();
        //donor
        await this.requestModel
          .updateMany(
            {
              category_slug: 'hunger',
              donor_id: ObjectID(updatedUser._id),
              status: { $ne: 'pending' },
            },
            {
              $set: {
                'donor_accept.user_name': uname,
                'donor_accept.image': updatedUser.image,
              },
            },
          )
          .lean();

        //volunteer
        await this.requestModel
          .updateMany(
            {
              category_slug: 'hunger',
              volunteer_id: ObjectID(updatedUser._id),
              status: { $ne: 'waiting_for_volunteer' },
            },
            {
              $set: {
                'volunteer_accept.user_name': uname,
                'volunteer_accept.image': updatedUser.image,
              },
            },
          )
          .lean();

        await this.transactionModel
          .updateMany(
            { user_id: ObjectID(updatedUser._id) },
            {
              user_name: uname,
            },
          )
          .lean();
        await this.transactionModel
          .updateMany(
            { donor_id: ObjectID(updatedUser._id) },
            {
              donor_name: uname,
            },
          )
          .lean();
      }
      if (
        !_.isEmpty(updatedUser) &&
        !_.isEmpty(updatedUser.ngo_data) &&
        updatedUser.ngo_data._id &&
        (userOldData.first_name !== updatedUser.first_name ||
          userOldData.last_name !== updatedUser.last_name ||
          userOldData.email !== updatedUser.email ||
          userOldData.phone_code !== updatedUser.phone_code ||
          userOldData.phone !== updatedUser.phone)
      ) {
        const query = {
          $set: {
            'trustees_name.$.first_name': updatedUser.first_name,
            'trustees_name.$.last_name': updatedUser.last_name,
            'trustees_name.$.email': updatedUser.email,
            'trustees_name.$.phone_code': updatedUser.phone_code,
            'trustees_name.$.phone': updatedUser.phone,
          },
        };
        await this.ngoModel
          .findOneAndUpdate(
            {
              _id: updatedUser.ngo_data._id,
              'trustees_name._id': updatedUser._id,
            },
            query,
          )
          .select({ _id: 1 })
          .lean();
        await this.ngoUpdatedModel
          .findOneAndUpdate(
            {
              ngo_id: updatedUser.ngo_data._id,
              'trustees_name._id': updatedUser._id,
            },
            query,
            { sort: { _id: -1 } },
          )
          .select({ _id: 1 })
          .lean();
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get a list of requests with transaction data, optionally filtered and sorted.
   *
   */
  async getAllRequestListWithTransactionNew(
    query,
    sort,
    start_from,
    per_page,
    userData,
    includeBlocked = false,
  ) {
    try {
      const lookup = [
        {
          $lookup: {
            from: 'transactions',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$request_id', '$$id'] },
                      { $eq: ['$transaction_type', 'donation'] },
                      { $ne: ['$saayam_community', true] },
                    ],
                  },
                },
              },
            ],
            as: 'tData',
          },
        },
        {
          $lookup: {
            from: 'ngo', // collection name in db
            localField: 'user_ngo_id',
            foreignField: '_id',
            as: 'ngoData',
          },
        },
        {
          $lookup: {
            from: 'transactions',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$fund_id', '$$id'] },
                      { $eq: ['$transaction_type', 'fund-received'] },
                    ],
                  },
                },
              },
            ],
            as: 'donations',
          },
        },
        {
          $lookup: {
            from: 'user',
            localField: 'user_id',
            foreignField: '_id',
            as: 'userData',
          },
        },
      ];

      const unwind = [
        {
          $unwind: {
            path: '$tData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$ngoData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$donations',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$userData',
            preserveNullAndEmptyArrays: true,
          },
        },
      ];

      const group = {
        $group: {
          _id: '$_id',
          request_data: { $first: '$$ROOT' },
          ngoDatas: { $first: '$ngoData' },
          total_donation: { $sum: '$tData.converted_amt' },
          raised: { $sum: '$donations.converted_amt' },
          myDonation: {
            $sum: {
              $cond: {
                if: { $eq: ['$tData.donor_id', ObjectID(userData?._id)] },
                then: '$tData.converted_amt',
                else: 0,
              },
            },
          },
          ngoDonation: {
            $sum: {
              $cond: {
                if: { $eq: ['$tData.donor_id', ObjectID(userData?.ngo_id)] },
                then: '$tData.converted_amt',
                else: 0,
              },
            },
          },
          total_donors: { $first: '$totalDonors' },
        },
      };

      let geoNear = [];
      if (
        !_.isUndefined(userData.user_lat) &&
        userData.user_lat != '' &&
        !_.isUndefined(userData.user_long) &&
        userData.user_long != ''
      ) {
        const coord = [userData.user_long, userData.user_lat];
        geoNear = [
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: coord,
              },
              distanceField: 'distance',
              distanceMultiplier: 0.001,
              key: 'location',
              maxDistance: userData.maximum_radius * 1000,
              minDistance: 0,
              spherical: true,
            },
          },
        ];
        delete query.user_lat;
        delete query.user_long;
      }

      const Union = {
        $unionWith: {
          coll: 'fund',
        },
      };
      const data = await this.requestModel.aggregate([
        Union,
        ...geoNear,
        ...lookup,
        {
          $set: {
            totalDonors: { $size: { $setUnion: ['$tData.donor_id', []] } },
            category_slug: {
              $ifNull: ['$category_slug', 'start-fund'],
            },
            countries: {
              $ifNull: ['$countries', []],
            },
            regions: {
              $ifNull: ['$regions', []],
            },
            admins: {
              $ifNull: ['$admins', []],
            },
          },
        },
        ...unwind,
        { $match: query },
        {
          $match: { 'ngoData.is_deleted': { $ne: true } },
        },
        group,
        {
          $project: {
            _id: '$request_data._id',
            distance: '$request_data.distance',
            deliver_time: '$request_data.deliver_time',
            donor_id: '$request_data.donor_id',
            volunteer_id: '$request_data.volunteer_id',
            ngo_volunteer_ids: '$request_data.ngo_volunteer_ids',
            user_ngo_id: '$request_data.user_ngo_id',
            donor_ngo_id: '$request_data.donor_ngo_id',
            volunteer_ngo_id: '$request_data.volunteer_ngo_id',
            ngo_donor_ids: '$request_data.ngo_donor_ids',
            ngo_ids: '$request_data.ngo_ids',
            location: '$request_data.location',
            reference_id: '$request_data.reference_id',
            category_slug: {
              $ifNull: ['$request_data.category_slug', 'start-fund'],
            },
            category_name: {
              $ifNull: ['$request_data.category_name', 'Fund'],
            },
            reject_reason: '$request_data.reject_reason',
            active_type: '$request_data.active_type',
            form_data: '$request_data.form_data',
            total_donation: 1,
            total_donors: 1,
            avg_donation: {
              $cond: {
                if: { $eq: ['$total_donation', 0] },
                then: 0,
                else: {
                  $cond: {
                    if: {
                      $gte: [
                        '$total_donation',
                        { $toInt: '$request_data.form_data.goal_amount' },
                      ],
                    },
                    then: 100,
                    else: {
                      $multiply: [
                        {
                          $divide: [
                            { $toInt: '$total_donation' },
                            { $toInt: '$request_data.form_data.goal_amount' },
                          ],
                        },
                        100,
                      ],
                    },
                  },
                },
              },
            },
            allow_edit_request: '$request_data.allow_edit_request',
            donationCount: 1,
            myDonation: 1,
            ngoDonation: 1,
            raised: 1,
            status: '$request_data.status',
            title_of_fundraiser: '$request_data.form_data.title_of_fundraiser',
            createdAt: '$request_data.createdAt',
            country_data: '$request_data.country_data',
            approve_time: '$request_data.approve_time',
            uname: {
              $concat: [
                '$request_data.userData.first_name',
                ' ',
                '$request_data.userData.last_name',
              ],
            },
            user_name: {
              $concat: [
                '$request_data.userData.first_name',
                ' ',
                '$request_data.userData.last_name',
              ],
            },
            user_image: {
              $ifNull: [
                {
                  $concat: [
                    authConfig.imageUrl,
                    'user/',
                    '$request_data.userData.image',
                  ],
                },
                null,
              ],
            },
            user_id: '$request_data.user_id',
            hasDonation: 1,
            is_featured: '$request_data.is_featured',
            plan_expired_date: '$request_data.plan_expired_date',
            bank_id: '$request_data.bank_id',
            delete_request: '$request_data.delete_request',
            image_url: {
              $cond: {
                if: { $eq: ['$request_data.category_slug', 'start-fund'] },
                then: {
                  $concat: [
                    authConfig.imageUrl,
                    'fund/',
                    { $toString: '$_id' },
                    '/',
                  ],
                },
                else: authConfig.imageUrl + 'request/',
              },
            },
            comment_enabled: '$request_data.comment_enabled',
            ngo_status: '$ngoDatas.ngo_status',
            allow_testimonial: '$request_data.allow_testimonial',
            reject_testimonial_reason: 1,
            testimonial_status: '$request_data.testimonial_status',
            testimonial_video: '$request_data.testimonial_id',
            ngo_Data: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ['$ngoDatas', []] },
                    {
                      $and: [
                        { $ne: ['$ngoDatas.ngo_status', 'blocked'] },
                        { $ne: ['$ngoDatas.ngo_status', 'reject'] },
                        { $ne: ['$ngoDatas.is_expired', true] },
                      ],
                    },
                  ],
                },
                then: 1,
                else: [],
              },
            },
            upload_cover_photo: {
              $map: {
                input: '$request_data.form_data.files.photos',
                as: 'request_cover_photo',
                in: {
                  $cond: {
                    if: { $eq: ['$request_data.category_slug', 'start-fund'] },
                    then: {
                      $concat: [
                        authConfig.imageUrl,
                        'fund/',
                        { $toString: '$_id' },
                        '/',
                        '$$request_cover_photo',
                      ],
                    },
                    else: {
                      $concat: [
                        authConfig.imageUrl,
                        'request/',
                        '$$request_cover_photo',
                      ],
                    },
                  },
                },
              },
            },
            fund_causes: '$request_data.fund_causes',
            sort: {
              $cond: {
                if: {
                  $eq: ['$request_data.status', 'expired'],
                },
                then: 2,
                else: {
                  $cond: {
                    if: {
                      $eq: ['$request_data.status', 'approve'],
                    },
                    then: 0,
                    else: 1,
                  },
                },
              },
            },
          },
        },
        {
          $unwind: {
            path: '$ngo_Data',
            preserveNullAndEmptyArrays: includeBlocked,
          },
        },
        { $sort: sort },
        { $skip: start_from },
        { $limit: per_page },
      ]);

      return data;
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Create a request log entry with the provided log information.
   *
   */
  async createRequestLog(log) {
    try {
      const addData = {
        request_id: log.id,
        type: log.type,
        text: log.text,
        time: new Date(),
      };
      const createRequestLog = new this.requestLog(addData);
      const requestLog = await createRequestLog.save();
      return addData;
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Update form setting data with a new value and, optionally, images.
   *
   */
  async updateFormSettingData(slug, value, formSettings, images = null) {
    try {
      let formSetting = JSON.parse(formSettings);
      formSetting.map(async (item: any, mainIndex: number) => {
        const inputs = item.inputs;
        inputs.map(async (input, inputIndex) => {
          if (input.input_slug == slug) {
            formSetting[mainIndex].inputs[inputIndex].value = value;
            if (slug == 'organization_logo') {
              formSetting[mainIndex].inputs[inputIndex].images = images;
            }
          }
        });
      });
      formSetting = JSON.stringify(formSetting);

      return formSetting;
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  // async sendTextMessage(input) {
  //   try {
  //     const yourProductToken = process.env.SMS_TOKEN;
  //     const myMessageApi = new messagingApi.MessageApiClient(yourProductToken);

  //     const result = myMessageApi.sendTextMessage(
  //       input.phone,
  //       'Saayam',
  //       input.message,
  //     );

  //     result
  //       .then((result) => {
  //         //result.response.body
  //         console.log('CUSTOM_LOG ~ file: common.service.ts:4080 ~ CommonService ~ .then ~ result:', result);
  //         return true;
  //       })
  //       .catch((error) => {
  //         console.log('CUSTOM_LOG ~ file: common.service.ts:4084 ~ CommonService ~ sendTextMessage ~ error:', error);
  //         return error;
  //       });
  //   } catch (e) {
  //     return {
  //       success: false,
  //       message: mConfig.Something_went_wrong,
  //     };
  //   }
  // }

  /**
   * function for add otp log
   *
   */
  public async addOtpLog(body, response, apiurl, success) {
    return new Promise(async (resolve, reject) => {
      try {
        const obj: any = {
          body: body,
          response: JSON.stringify(response),
          api: apiurl,
          success: success,
          ip: ip.address(),
        };
        if (!success) {
          obj.error_message = response.message ? response.message : '';
          obj.error_path = response.stack ? response.stack : response;
        }
        await this.otpLog.create(obj);
        this.uploadLogOnS3(obj, 'otp_logs');
        resolve([]);
      } catch (error) {
        reject([]);
      }
    });
  }
  /**
   * function for add smtp log
   *
   */
  public async addSmtpLog(body, response, apiurl, success) {
    return new Promise(async (resolve, reject) => {
      try {
        const obj: any = {
          body: body,
          response: JSON.stringify(response),
          api: apiurl,
          success: success,
        };
        if (!success) {
          obj.error_message = response.message ? response.message : '';
          obj.error_path = response.stack ? response.stack : response;
        }
        await this.smtpLog.create(obj);
        this.uploadLogOnS3(obj, 'smtp_logs');
        resolve([]);
      } catch (error) {
        reject([]);
      }
    });
  }

  /**
   * function for add notification log
   *
   */
  public async addNotificationLog(body, response, success) {
    return new Promise(async (resolve, reject) => {
      try {
        const obj: any = {
          body: body,
          response: JSON.stringify(response),
          success: success,
        };
        if (!success) {
          obj.error_message = response.message ? response.message : '';
          obj.error_path = response.stack ? response.stack : response;
        }
        await this.notificationLog.create(obj);
        this.uploadLogOnS3(obj, 'notification_logs');
        resolve([]);
      } catch (error) {
        reject([]);
      }
    });
  }

  /**
   * Sends a text message using Twilio API or another messaging service.
   */
  async sendTextMessage(input, apiurl = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        // const recipientPhoneNumber = '';

        const twilio = require('twilio');
        const client = twilio(accountSid, authToken);

        //if phone number not start with + then add
        const normalizedPhones = input.phone.map((phone) => {
          if (!phone.startsWith('+')) {
            return '+' + phone;
          }
          return phone;
        });

        input.from = twilioPhoneNumber;
        client.messages
          .create({
            body: input.message,
            from: twilioPhoneNumber,
            to: normalizedPhones,
          })
          .then(async (message) => {
            await this.addOtpLog(input, message, apiurl, true);
            resolve({ success: true });
          })
          .catch(async (error) => {
            await this.addOtpLog(input, error, apiurl, false);
            resolve({ success: false });
          });
      } catch (e) {
        return {
          success: false,
          message: mConfig.Something_went_wrong,
        };
      }
    });
  }

  // async sendTextMessage(input) {
  //   try {
  //     const yourProductToken = process.env.SMS_TOKEN;
  //     const myMessageApi = new messagingApi.MessageApiClient(yourProductToken);

  //     const result = myMessageApi.sendTextMessage(
  //       input.phone,
  //       'Saayam',
  //       input.message,
  //     );

  //     result
  //       .then((result) => {
  //         return true;
  //       })
  //       .catch((error) => {
  //         return error;
  //       });
  //   } catch (e) {
  //     return {
  //       success: false,
  //       message: mConfig.Something_went_wrong,
  //     };
  //   }
  // }

  /**
   * Retrieves corporate details based on the provided ID.
   */
  async getCorporateDetail(id, loginType = null, userId = null) {
    try {
      let match: any = {
        _id: ObjectID(id),
      };
      const project = {
        first_name: 1,
        last_name: 1,
        profile_set: 1,
        email: 1,
        phone_code: 1,
        phone: 1,
        country_data: 1,
        is_authorize: 1,
        user_id: 1,
        causes: 1,
        location: 1,
        approve_time: 1,
        website: 1,
        job_title: 1,
        organization_name: 1,
        phone_country_short_name: 1,
        phone_country_full_name: 1,
        organization_logo: {
          $map: {
            input: '$form_data.files.organization_logo',
            as: 'organization_logo',
            in: {
              $concat: [
                authConfig.imageUrl,
                'corporate/',
                { $toString: '$_id' },
                '/',
                '$$organization_logo',
              ],
            },
          },
        },
        form_data: 1,
      };

      let aggregation: any = [{ $match: match }, { $project: project }];

      if (loginType == 'app') {
        match = {
          _id: ObjectID(id),
          is_deleted: { $ne: true },
        };
        if (userId && !_.isUndefined(userId)) {
          project['is_admin'] = '$corporateUser.is_admin';
          project['user_status'] = '$corporateUser.status';
          aggregation = [
            { $match: match },
            {
              $lookup: {
                from: 'corporate_users',
                let: { id: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$user_id', ObjectID(userId)] },
                          { $eq: ['$corporate_id', '$$id'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'corporateUser',
              },
            },
            {
              $unwind: {
                path: '$corporateUser',
                preserveNullAndEmptyArrays: true,
              },
            },
            { $project: project },
          ];
        }
      }

      const corporate = await this.corporateModel.aggregate(aggregation).exec();
      if (!_.isEmpty(corporate) && !_.isEmpty(corporate[0])) {
        return corporate[0];
      }
      return {};
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Retrieves a list of corporate administrators for a corporate based on its ID.
   */
  async getCorporateAdmins(id) {
    try {
      const users = await this.userModel
        .aggregate([
          {
            $match: {
              $or: [{ is_corporate_user: true }, { is_corporate: true }],
              corporate_id: ObjectID(id),
            },
          },
          {
            $lookup: {
              from: 'corporate_users',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$user_id', '$$id'] },
                        { $eq: ['$corporate_id', ObjectID(id)] },
                      ],
                    },
                  },
                },
              ],
              as: 'corporate_user',
            },
          },
          {
            $unwind: {
              path: '$corporate_user',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              is_admin: {
                $cond: {
                  if: { $eq: ['$is_corporate', true] },
                  then: true,
                  else: '$corporate_user.is_admin',
                },
              },
              status: {
                $cond: {
                  if: { $eq: ['$is_corporate', true] },
                  then: 'active',
                  else: '$corporate_user.status',
                },
              },
            },
          },
          {
            $match: {
              is_admin: true,
              status: 'active',
            },
          },
          {
            $group: {
              _id: null,
              userId: { $addToSet: '$_id' },
            },
          },
        ])
        .exec();

      if (!_.isEmpty(users) && !_.isEmpty(users[0].userId)) {
        return users[0].userId;
      }
      return [];
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Verifies an OTP (One-Time Password) provided in the DTO (Data Transfer Object).
   */
  async verifyOtp(dto) {
    try {
      const otpData = await this.otpVerifyModel
        .findOne({
          phone_code: dto.phone_code,
          phone: dto.phone,
          $or: [{ platform: dto.otp_platform }, { is_default: true }],
        })
        .lean();

      const currentTime = parseInt(moment().format('X'));
      if (_.isEmpty(otpData)) {
        return {
          success: false,
          message: mConfig.No_data_found,
        };
      } else {
        let existOtp;
        let expiredAt;

        if (dto.otp_platform == 'app') {
          existOtp = otpData?.app_otp;
          expiredAt = otpData?.app_otp_expired_at;
        } else if (dto.otp_platform == 'web') {
          existOtp = otpData?.web_otp;
          expiredAt = otpData?.web_otp_expired_at;
        }

        if (!_.isUndefined(existOtp) && existOtp != dto.otp) {
          return {
            success: false,
            message: mConfig.Invalid_OTP,
          };
        } else if (!_.isUndefined(expiredAt) && expiredAt <= currentTime) {
          return {
            message: mConfig.OTP_expired,
            success: false,
          };
        } else {
          if (!otpData.is_default && _.isUndefined(otpData.is_default)) {
            await this.otpVerifyModel.findByIdAndDelete(otpData._id).lean();
          }

          if (otpData.guest_otp && otpData.guest_otp == 1) {
            return {
              success: true,
            };
          } else {
            return {
              verified: true,
            };
          }
        }
      }
    } catch (e) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Common function for get ngo data
   * @param id
   */
  async getNGODetailForApp(id, userId = null) {
    try {
      const match = {
        _id: ObjectID(id),
        is_deleted: { $ne: true },
      };
      const lookup = [
        {
          $lookup: {
            from: 'user',
            localField: 'trustees_name._id',
            foreignField: '_id',
            as: 'tUserData',
          },
        },
        {
          $lookup: {
            from: 'bookmark_items',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ['$category_slug', 'ngo'],
                      },
                      {
                        $eq: ['$user_id', ObjectID(userId)],
                      },
                      { $eq: ['$request_id', '$$id'] },
                    ],
                  },
                },
              },
            ],
            as: 'bookmarkData',
          },
        },
      ];
      const set: any = [
        {
          $set: {
            trustees_name: {
              $map: {
                input: '$trustees_name',
                in: {
                  $mergeObjects: [
                    '$$this',
                    {
                      user: {
                        $arrayElemAt: [
                          '$tUserData',
                          { $indexOfArray: ['$tUserData._id', '$$this._id'] },
                        ],
                      },
                    },
                  ],
                },
              },
            },
            currency: { $first: '$country_data.currency' },
          },
        },
      ];
      const project = {
        _id: '$ngo._id',
        ngo_causes: '$ngo.ngo_causes',
        trustees_name: {
          $map: {
            input: '$ngo.trustees_name',
            as: 'trustee',
            in: {
              _id: '$$trustee._id',
              first_name: '$$trustee.user.first_name',
              last_name: '$$trustee.user.last_name',
              email: '$$trustee.user.email',
              image: {
                $ifNull: [
                  {
                    $concat: [
                      authConfig.imageUrl,
                      'user/',
                      '$$trustee.user.image',
                    ],
                  },
                  null,
                ],
              },
              phone_code: '$$trustee.user.phone_code',
              phone: '$$trustee.user.phone',
              country_code: '$$trustee.country_code',
              added_time: '$$trustee.added_time',
              removed_time: '$$trustee.removed_time',
              is_owner: '$$trustee.is_owner',
              verified: '$$trustee.verified',
              flag: '$$trustee.user.phone_country_short_name',
            },
          },
        },
        ngo_name: '$ngo.form_data.ngo_name',
        first_name: '$ngo.form_data.first_name',
        last_name: '$ngo.form_data.last_name',
        ngo_phone: '$ngo.form_data.ngo_mobile_number.phoneNumber',
        ngo_phone_code: '$ngo.form_data.ngo_mobile_number.countryCodeD',
        ngo_email: '$ngo.form_data.ngo_email',
        expiry_date: '$ngo.form_data.expiry_date',
        is_enable: '$ngo.is_enable',
        ngo_status: '$ngo.ngo_status',
        transfer_account: '$ngo.transfer_account',
        block_reason: '$ngo.block_reason',
        country_data: {
          country: '$ngo.country_data.country',
          country_code: '$ngo.country_data.country_code',
          currency: '$ngo.currency.symbol',
          currency_code: '$ngo.currency.name',
        },
        transfer_documents: {
          $map: {
            input: '$ngo.transfer_documents',
            as: 'transferDoc',
            in: {
              $concat: [
                authConfig.imageUrl,
                'transfer-ownership/',
                '$$transferDoc',
              ],
            },
          },
        },
        transfer_reason: '$ngo.transfer_reason',
        reject_reason: '$ngo.reject_reason',
        deletedAt: '$ngo.deletedAt',
        delete_account_reason: '$ngo.delete_account_reason',
        is_expired: '$ngo.is_expired',
        vission: '$ngo.vission',
        mission: '$ngo.mission',
        programs: '$ngo.programs',
        history: '$ngo.history',
        values_and_principles: '$ngo.values_and_principles',
        team_members: '$ngo.team_members',
        ngo_location: '$ngo.ngo_address',
        ngo_cover_image: 1,
        is_bookmark: {
          $cond: {
            if: { $gt: [{ $size: '$ngo.bookmarkData' }, 0] }, // Check if bookmarks array is not empty
            then: true, // Bookmarks exist
            else: false, // No bookmarks
          },
        },
      };
      const data = await this.ngoModel.aggregate([
        { $match: match },
        ...lookup,
        {
          $lookup: {
            from: 'ngo_team_member',
            localField: '_id',
            foreignField: 'ngo_id',
            as: 'teamMembers',
          },
        },
        ...set,
        {
          $addFields: {
            team_members: { $size: '$teamMembers' },
          },
        },
        {
          $group: {
            _id: '$_id',
            ngo: { $first: '$$ROOT' },
          },
        },
        {
          $addFields: {
            ngo_cover_image: {
              $concat: [
                authConfig.imageUrl,
                'ngo/',
                { $toString: '$_id' },
                '/',
                {
                  $arrayElemAt: ['$ngo.form_data.files.ngo_cover_photo', 0],
                },
              ],
            },
          },
        },
        {
          $project: project,
        },
      ]);
      if (!_.isEmpty(data)) {
        if (data[0].ngo_status === 'waiting_for_verify') {
          const ngoUpdatedData = await this.ngoUpdatedModel.aggregate([
            { $match: { ngo_id: data[0]._id } },
            ...lookup,
            ...set,
            {
              $group: {
                _id: '$_id',
                ngo: { $first: '$$ROOT' },
              },
            },
            {
              $addFields: {
                ngo_cover_image: {
                  $concat: [
                    authConfig.imageUrl,
                    'ngo/',
                    { $toString: '$ngo.ngo_id' },
                    '/',
                    {
                      $arrayElemAt: ['$ngo.form_data.files.ngo_cover_photo', 0],
                    },
                  ],
                },
              },
            },
            {
              $project: project,
            },
            { $sort: { _id: -1 } },
            { $limit: 1 },
          ]);
          if (!_.isEmpty(ngoUpdatedData)) {
            data[0].updated_data = ngoUpdatedData[0];
          }
        }
        return data[0];
      }
      return [];
    } catch (err) {
      console.log(
        '🚀 ~ file: common.service.ts:5422 ~ CommonService ~ getNGODetailForApp ~ err:',
        err,
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * Common function for get ngo data
   * @param id
   */
  async getNGODetailForAdmin(id) {
    try {
      const match = {
        _id: ObjectID(id),
      };
      const lookup = [
        {
          $lookup: {
            from: 'user',
            localField: 'trustees_name._id',
            foreignField: '_id',
            as: 'tUserData',
          },
        },
        {
          $lookup: {
            from: 'user',
            localField: 'removed_trustee._id',
            foreignField: '_id',
            as: 'rUserData',
          },
        },
      ];
      const set: any = [
        {
          $set: {
            trustees_name: {
              $map: {
                input: '$trustees_name',
                in: {
                  $mergeObjects: [
                    '$$this',
                    {
                      user: {
                        $arrayElemAt: [
                          '$tUserData',
                          { $indexOfArray: ['$tUserData._id', '$$this._id'] },
                        ],
                      },
                    },
                  ],
                },
              },
            },
            currency: { $first: '$country_data.currency' },
            removed_trustee: {
              $map: {
                input: '$removed_trustee',
                in: {
                  $mergeObjects: [
                    '$$this',
                    {
                      user: {
                        $arrayElemAt: [
                          '$rUserData',
                          { $indexOfArray: ['$rUserData._id', '$$this._id'] },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ];
      const project = {
        _id: '$ngo._id',
        ngo_causes: '$ngo.ngo_causes',
        ngo_address: '$ngo.ngo_address',
        trustees_name: {
          $map: {
            input: '$ngo.trustees_name',
            as: 'trustee',
            in: {
              _id: '$$trustee._id',
              first_name: '$$trustee.user.first_name',
              last_name: '$$trustee.user.last_name',
              email: '$$trustee.user.email',
              image: {
                $ifNull: [
                  {
                    $concat: [
                      authConfig.imageUrl,
                      'user/',
                      '$$trustee.user.image',
                    ],
                  },
                  null,
                ],
              },
              phone_code: '$$trustee.user.phone_code',
              phone: '$$trustee.user.phone',
              country_code: '$$trustee.country_code',
              added_time: '$$trustee.added_time',
              removed_time: '$$trustee.removed_time',
              is_owner: '$$trustee.is_owner',
              verified: '$$trustee.verified',
              flag: '$$trustee.user.phone_country_short_name',
            },
          },
        },
        removed_trustee: {
          $map: {
            input: '$ngo.removed_trustee',
            as: 'trustee',
            in: {
              _id: '$$trustee._id',
              first_name: '$$trustee.user.first_name',
              last_name: '$$trustee.user.last_name',
              email: '$$trustee.user.email',
              image: {
                $ifNull: [
                  {
                    $concat: [
                      authConfig.imageUrl,
                      'user/',
                      '$$trustee.user.image',
                    ],
                  },
                  null,
                ],
              },
              phone_code: '$$trustee.user.phone_code',
              phone: '$$trustee.user.phone',
              country_code: '$$trustee.country_code',
              added_time: '$$trustee.added_time',
              removed_time: '$$trustee.removed_time',
              flag: '$$trustee.user.phone_country_short_name',
              documents: {
                $map: {
                  input: '$$trustee.documents',
                  as: 'd',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'ngo/',
                      { $toString: '$_id' },
                      '/remove-trustee/',
                      '$$d',
                    ],
                  },
                },
              },
            },
          },
        },
        image_url: {
          $concat: [authConfig.imageUrl, 'ngo/', { $toString: '$_id' }, '/'],
        },
        form_data: '$ngo.form_data',
        report_ngo: '$ngo.report_ngo',
        is_enable: '$ngo.is_enable',
        ngo_status: '$ngo.ngo_status',
        createdAt: '$ngo.createdAt',
        transfer_account: '$ngo.transfer_account',
        block_reason: '$ngo.block_reason',
        transfer_documents: {
          $map: {
            input: '$ngo.transfer_documents',
            as: 'transferDoc',
            in: {
              $concat: [
                authConfig.imageUrl,
                'transfer-ownership/',
                '$$transferDoc',
              ],
            },
          },
        },
        transfer_reason: '$ngo.transfer_reason',
        reject_reason: '$ngo.reject_reason',
        deletedAt: '$ngo.deletedAt',
        delete_account_reason: '$ngo.delete_account_reason',
        is_expired: '$ngo.is_expired',
        vission: '$ngo.vission',
        mission: '$ngo.mission',
        programs: '$ngo.programs',
        history: '$ngo.history',
        values_and_principles: '$ngo.values_and_principles',
        remaining_amount: 1,
        total_donation: '$ngo.total_donation',
        total_transfered: '$ngo.total_transfered',
        currency: { $first: '$ngo.country_data.currency' },
      };
      const data = await this.ngoModel.aggregate([
        { $match: match },
        ...lookup,
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
              { $project: { converted_amt: 1 } },
            ],
            as: 'transactionData',
          },
        },
        {
          $lookup: {
            from: 'admin-transactions',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$ngo_id', '$$id'] }],
                  },
                },
              },
              { $project: { transfer_amount: 1 } },
            ],
            as: 'adminTransactionData',
          },
        },
        {
          $addFields: {
            total_donation: { $sum: '$transactionData.converted_amt' },
            total_transfered: { $sum: '$adminTransactionData.transfer_amount' },
          },
        },
        {
          $project: {
            transactionData: 0,
            adminTransactionData: 0,
            form_settings: 0,
          },
        },
        ...set,
        {
          $group: {
            _id: '$_id',
            ngo: { $first: '$$ROOT' },
          },
        },
        {
          $project: project,
        },
      ]);
      if (!_.isEmpty(data)) {
        if (data[0].ngo_status === 'waiting_for_verify') {
          const ngoUpdatedData = await this.ngoUpdatedModel.aggregate([
            { $match: { ngo_id: data[0]._id } },
            ...lookup,
            ...set,
            {
              $group: {
                _id: '$_id',
                ngo: { $first: '$$ROOT' },
              },
            },
            {
              $project: project,
            },
            { $sort: { _id: -1 } },
            { $limit: 1 },
          ]);
          if (!_.isEmpty(ngoUpdatedData)) {
            data[0].updated_data = ngoUpdatedData[0];
          }
        }
        return data[0];
      }
      return [];
    } catch (err) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //This function is used for get form_data from table and find key matching with input & set it's value in dynamic form
  async getEditFormSetting(dynamicForm, formData) {
    try {
      return new Promise((resolve, reject) => {
        const data = JSON.parse(dynamicForm);

        data.map(async (item: any) => {
          const inputs = item.inputs;

          inputs.map(async (input: any) => {
            if (input.input_type === 'location' && formData[input.input_slug]) {
              const value = formData[input.input_slug];
              //find country from address
              const addressParts = value.city.split(',');
              const country = addressParts[addressParts.length - 1].trim();

              // add object in dynamic form
              input.value = {
                longitude: value?.coordinates[0],
                latitude: value?.coordinates[1],
                city: value?.city,
                country: country,
              };
            } else if (
              input.input_type === 'file' &&
              formData.form_data &&
              formData.form_data.files[input.input_slug]
            ) {
              // add value in dynamic form
              input.value = formData.form_data.files[input.input_slug];
              input.images = formData.form_data.images[input.input_slug];
            }
            // else if (input.input_type == 'date') {
            // }
            else if (
              formData.form_data &&
              formData.form_data[input.input_slug]
            ) {
              //then don't add first_name fields
              // if (formData.form_data.request_for_self) {
              // }
              input.value = formData.form_data[input.input_slug];
            }
            if (
              input.input_type === 'checkbox' &&
              input.other_inputs &&
              formData.form_data
            ) {
              //For add nested input values in dynamic form
              const otherInputs = input.other_inputs;
              otherInputs.map((o) => {
                if (formData.form_data[o.other_input_slug])
                  o.value = formData.form_data[o.other_input_slug];
              });
            }
          });
        });

        const stringifyData = JSON.stringify(data);

        resolve(stringifyData);
      });
    } catch (error) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  async getCurrencyRates() {
    const axios = require('axios');

    const url = 'https://api.exchangerate-api.com/v4/latest/USD';
    const config = {
      method: 'get',
      url: url,
    };

    const now = new Date();

    var date = now.toISOString().split('T')[0];

    const currencyRates = this.currencyRatesModel;
    axios(config)
      .then(async (response) => {
        const result = response.data;
        if (result.rates) {
          const rates = JSON.parse(JSON.stringify(result.rates).toLowerCase());
          await currencyRates
            .updateOne(
              { date: date },
              {
                currency: 'usd',
                rates: rates,
                updatedAt: new Date(),
                date: date,
              },
              { upsert: true },
            )
            .exec();
        }
      })
      .catch(function (error) {
        this.errorlogService.errorLog(
          error,
          'src/common/common.service.ts-getCurrencyRates',
        );
      });
  }

  //This function is used to get date wise exchange rates
  async getExchangeRates() {
    const startDate = new Date('2021-12-01');
    const endDate = new Date('2023-09-06');

    const headers = {
      apikey: process.env.EXCHANGE_RATE_API_KEY,
    };

    try {
      const start_date = this.formatDate(startDate);
      startDate.setMonth(startDate.getMonth() + 1); // Increment the start date by one month
      const end_date = this.formatDate(endDate);

      const url = `https://api.apilayer.com/exchangerates_data/timeseries?start_date=${start_date}&end_date=${end_date}&base=USD`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      // Read existing JSON data from the file
      let existingData = {};
      const fileName = 'exchange_rates.json';

      try {
        const fileData: any = await fsPromise.readFile(fileName, 'utf8');
        existingData = JSON.parse(fileData);
      } catch (error) {
        // If the file doesn't exist or is empty, existingData will be an empty object
      }

      // Merge the new data with the existing data
      const mergedData = {
        ...existingData,
        ...data.rates,
      };

      // Write the updated data back to the file
      await fsPromise.writeFile(fileName, JSON.stringify(mergedData, null, 2));
      console.log(`Exchange rates data has been saved to ${fileName}`);

      const fileData: any = await fsPromise.readFile(
        'exchange_rates.json',
        'utf8',
      );
      let rateData = JSON.parse(fileData);
      const currencyRates = this.currencyRatesModel;
      Object.keys(rateData).forEach(async function (key) {
        var value = rateData[key];
        await currencyRates
          .updateOne(
            { date: key },
            {
              currency: 'USD',
              rates: value,
              updatedAt: new Date(),
              date: key,
            },
            { upsert: true },
          )
          .exec();
      });
    } catch (error) {
      return error;
    }
  }

  async getLatestExchangeRates() {
    const axios = require('axios');
    const url = 'https://api.apilayer.com/exchangerates_data/latest?base=USD';

    const config = {
      headers: {
        apikey: process.env.EXCHANGE_RATE_API_KEY,
      },
      url: url,
    };

    const now = new Date();

    var date = now.toISOString().split('T')[0];

    const currencyRates = this.currencyRatesModel;
    axios(config)
      .then(async (response) => {
        const result = response.data;
        if (result.rates) {
          const rates = JSON.parse(JSON.stringify(result.rates));

          await currencyRates
            .updateOne(
              { date: date },
              {
                currency: 'USD',
                rates: rates,
                updatedAt: new Date(),
                date: date,
              },
              { upsert: true },
            )
            .lean();
        }
      })
      .catch(function (error) {
        return error;
      });
  }
  // Helper function to format a date as 'YYYY-MM-DD'
  formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  //This function is used for save otp logs on s3 server
  async uploadLogOnS3(obj, folder) {
    const accountName = process.env.ACCOUNT_NAME;
    const accountKey = process.env.ACCOUNT_KEY;
    const containerName = process.env.CONTAINER_NAME;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential,
    );

    const blobContainerClient =
      blobServiceClient.getContainerClient(containerName);

    //Add createAt of log in object
    const timestamp = new Date().toISOString();
    obj.createdAt = timestamp;
    // Get the current date
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayOfMonth = currentDate.getDate().toString().padStart(2, '0');

    // Define the parameters for retrieving the existing object and set path for save file
    const blobName = `logs/${folder}/${year}/${month}/${dayOfMonth}.txt`;
    const separator = `------------------------ ${timestamp} (ISO Format) ------------------------`;

    const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);
    try {
      // Attempt to get the properties of the blob
      await blockBlobClient.getProperties();

      // If the blob exists, append data to it
      const existingBuffer = await blockBlobClient.downloadToBuffer();

      const existingData = existingBuffer.toString('utf-8');
      const updatedData = `${existingData}\n\n${separator}\n${JSON.stringify(
        obj,
      )}`;

      await blockBlobClient.upload(updatedData, Buffer.byteLength(updatedData));
    } catch (error) {
      if (error.statusCode === 404) {
        const updatedContent = JSON.stringify(
          `${separator}\n${JSON.stringify(obj)}`,
        );

        // If the blob does not exist, create it and write the data
        await blockBlobClient.upload(
          updatedContent,
          Buffer.byteLength(updatedContent),
        );
        return { success: true };
      } else {
        return {
          success: false,
          message: mConfig.Something_went_wrong,
        };
      }
    }
  }
  async getIpLocation(ipAddress) {
    try {
      const axios = require('axios');
      const accessKey = process.env.IP_LOCATION_ACCESS_KEY;

      //get location data
      const apiUrl = `http://api.ipstack.com/${ipAddress}?access_key=${accessKey}`;
      const response = await axios.get(apiUrl);

      const location = {
        country_code: response?.data?.country_code,
        country_name: response?.data?.country_name,
        region_code: response?.data?.region_code,
        region_name: response?.data?.region_name,
        city: response?.data?.city,
        zip: response?.data?.zip,
        latitude: response?.data?.latitude,
        longitude: response?.data?.longitude,
      };

      return location;
    } catch (error) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //Get file type from file name
  async getContentType(fileName) {
    try {
      // Map common file extensions to their content types
      const extensionToContentTypeMap = {
        jpg: 'image/jpg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        // gif: "image/gif",
        // bmp: "image/bmp",
        // Add more as needed
      };

      const fileExtension = fileName.split('.').pop().toLowerCase();
      return (
        extensionToContentTypeMap[fileExtension] || 'application/octet-stream'
      );
    } catch (error) {
      return error;
    }
  }

  //Function for upload image on azure
  async imageUploadService(
    imagName = '',
    folder = '',
    oldImage = '',
    localFilePath = './uploads/temp',
  ) {
    try {
      const accountName = process.env.ACCOUNT_NAME;
      const accountKey = process.env.ACCOUNT_KEY;
      const containerName = process.env.CONTAINER_NAME;

      const sharedKeyCredential = new StorageSharedKeyCredential(
        accountName,
        accountKey,
      );
      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        sharedKeyCredential,
      );

      const blobContainerClient =
        blobServiceClient.getContainerClient(containerName);

      const blobName = `${folder ? folder + '/' : ''}${imagName}`;
      const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);

      const contentType = 'application/octet-stream';

      const blobOptions: object = {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      };

      localFilePath = `${localFilePath}/${imagName}`;

      const buffer = fs.readFileSync(localFilePath);

      await blockBlobClient.upload(buffer, buffer.length, blobOptions);

      // Delete the local backup file
      fs.unlinkSync(localFilePath);

      if (oldImage && oldImage !== null) {
        await this.deleteBlobFromAzureStorage(folder, oldImage);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //Function for delete file from azure
  async deleteBlobFromAzureStorage(folder, imagName) {
    try {
      const accountName = process.env.ACCOUNT_NAME;
      const accountKey = process.env.ACCOUNT_KEY;
      const containerName = process.env.CONTAINER_NAME;

      const sharedKeyCredential = new StorageSharedKeyCredential(
        accountName,
        accountKey,
      );
      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        sharedKeyCredential,
      );

      const blobContainerClient =
        blobServiceClient.getContainerClient(containerName);

      const blobName = `${folder ? folder + '/' : ''}${imagName}`;

      const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);

      await blockBlobClient.delete();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }
  async checkAautiPaymentStatus() {
    try {
      const apiUrl = process.env.AAUTI_PAYMENT_URL + 'check-status';
      const response = await axiosInstance.get(apiUrl);
      if (response?.data?.status) {
        return true;
      }
    } catch (error) {
      return false;
    }
  }
}
