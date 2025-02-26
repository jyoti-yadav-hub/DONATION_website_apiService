/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { Request } from 'express';
import moment from 'moment-timezone';
import { REQUEST } from '@nestjs/core';
import {
  FoodRequestModel,
  FoodRequestDocument,
} from './entities/food-request.entity';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from './entities/cause-request.entity';
import { CommentDto } from './dto/comments.dto';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.entity';
import { Fund, FundDocument } from '../fund/entities/fund.entity';
import {
  CurrencyModel,
  CurrencyDocument,
} from '../currency/entities/currency.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  TransactionModel,
  TransactionDocument,
} from '../donation/entities/transaction.entity';
import { Inject, Injectable } from '@nestjs/common';
import {
  PaymentProcessModel,
  PaymentProcessDocument,
} from '../donation/entities/payment-process.entity';
import { PrepareFood } from './dto/prepare-food.dto';
import {
  Notification,
  NotificationDocument,
} from '../notification/entities/notification.entity';
import { authConfig } from '../../config/auth.config';
import { NewRequestDto } from './dto/new-request.dto';
import mConfig from '../../config/message.config.json';
import {
  FeatureTransactionModel,
  FeatureTransactionDocument,
} from '../donation/entities/feature-transaction.entity';
import { CancelRequest } from './dto/cancel-request.dto';
import { QueueService } from '../../common/queue.service';
import { UpdateRequestDto } from './dto/update-request.dto';
import { CommonService } from '../../common/common.service';
import {
  AdminNotification,
  AdminNotificationDocument,
} from '../notification/entities/admin-notification.entity';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
import { Reels, ReelsDocument } from './entities/reels.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { UpdateOrderStatus } from './dto/update-order-status.dto';
import { User, UserDocument } from '../users/entities/user.entity';
import {
  UserToken,
  UserTokenDocument,
} from '../users/entities/user-token.entity';
import { IncreaseReelsCount } from './dto/increase-reels-count.dto';
import { Queue, QueueDocument } from './entities/queue-data.entity';
import { Comment, CommentDocument } from './entities/comments.entity';
import { VerifyFundraiserDto } from './dto/verify-fundraiser-request.dto';
import { RequestModel, RequestDocument } from './entities/request.entity';
import {
  AdminTransactionModel,
  AdminTransactionDocument,
} from '../donation/entities/admin-transaction.entity';
import { ManualTransferDto } from './dto/manual-transfer.dto';
import {
  HospitalSchool,
  HospitalSchoolDocument,
} from '../hospital-school/entities/hospital-school.entity';
import { DeleteOngoingRequestsDto } from './dto/delete-ongoing-requests.dto';
import {
  HospitalSchoolData,
  HospitalSchoolDataDocument,
} from '../hospital-school-data/entities/hospital-school-data.entity';
import { ExpiryDateDto } from '../request/dto/expiry-date.dto';
import { VolunteerService } from './volunteer.service';
import { FundraiserStatus } from './dto/fundraiser-status.dto';
import { Post, PostDocument } from '../drive/entities/drive-post.entity';
import { LogService } from 'src/common/log.service';
import fs from 'fs';
import { ReelsDto } from './dto/reels.dto';
import { SendInviteDto } from './dto/send-invite.dto';
import { VerifyFundraiserInvite } from './dto/verify-fundraiser-invite.dto';
import { GetUserByMailDto } from './dto/get-user.dto';
import { RemoveAdminDto } from './dto/remove-admin.dto';
import { ManagePermissionDto } from './dto/manage-permission.dto';
import { CheckUhidDto } from './dto/check-uhid.dto';
import { Drive, DriveDocument } from '../drive/entities/drive.entity';
import {
  RequestHistoryModel,
  RequestHistoryDocument,
} from './entities/request-history.entity';
import {
  CorporateNotification,
  CorporateNotificationDocument,
} from '../notification/entities/corporate-notification.entity';
import { Bank, BankDocument } from '../bank/entities/bank.entity';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class RequestService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly queueService: QueueService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly volunteerService: VolunteerService,
    @InjectModel(Ngo.name)
    private ngoModel: Model<NgoDocument>,
    @InjectModel(RequestHistoryModel.name)
    private requestHistoryModel: Model<RequestHistoryDocument>,
    @InjectModel(AdminTransactionModel.name)
    private adminTransactionModel: Model<AdminTransactionDocument>,
    @InjectModel(Reels.name)
    private reelsModel: Model<ReelsDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
    @InjectModel(UserToken.name)
    private userTokenModel: Model<UserTokenDocument>,
    @InjectModel(Drive.name)
    private driveModel: Model<DriveDocument>,
    @InjectModel(Queue.name)
    private queueModel: Model<QueueDocument>,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(Comment.name)
    private commentModel: Model<CommentDocument>,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(Fund.name)
    private fundModel: Model<FundDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(FoodRequestModel.name)
    private foodRequestModel: Model<FoodRequestDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
    @InjectModel(CorporateNotification.name)
    private corporateNotification: Model<CorporateNotificationDocument>,
    @InjectModel(AdminNotification.name)
    private adminNotificationModel: Model<AdminNotificationDocument>,
    @InjectModel(HospitalSchool.name)
    private hospitalSchoolModel: Model<HospitalSchoolDocument>,
    @InjectModel(FeatureTransactionModel.name)
    private featureTransactionModel: Model<FeatureTransactionDocument>,
    @InjectModel(HospitalSchoolData.name)
    private hospitalSchoolDataModel: Model<HospitalSchoolDataDocument>,
    @InjectModel(Bank.name) private BankModel: Model<BankDocument>,
  ) {}

  // Api for create new cause request
  public async createCauseRequest(newRequestDto: NewRequestDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        newRequestDto,
      );
      //find category
      const findCategory = await this.categoryModel
        .findOne({ category_slug: newRequestDto.category_slug })
        .select({ name: 1 })
        .lean();
      if (findCategory) {
        let data = JSON.parse(newRequestDto.data);

        const userDetail = this.request.user;
        let countryData = userDetail.country_data;
        let formData: any = {};

        if (
          newRequestDto.draft_id &&
          !_.isUndefined(newRequestDto.draft_id) &&
          !_.isEmpty(newRequestDto.draft_id)
        ) {
          // To save request as draft
          formData = {
            comment_enabled: newRequestDto?.comment_enabled,
            bank_id: newRequestDto?.bank_id ? newRequestDto.bank_id : null,
            add_location_for_food_donation:
              newRequestDto?.add_location_for_food_donation,
            disaster_links: newRequestDto?.disaster_links,
            country_data: {},
            form_data: {
              files: {},
              images: {},
            },
          };
        } else {
          const uname = userDetail.display_name
            ? userDetail.display_name
            : userDetail.first_name + ' ' + userDetail.last_name;
          const userImage = userDetail.image;

          formData = {
            active_type: newRequestDto?.active_type,
            category_slug: newRequestDto?.category_slug,
            comment_enabled: newRequestDto?.comment_enabled,
            bank_id: newRequestDto?.bank_id ? newRequestDto.bank_id : null,
            add_location_for_food_donation:
              newRequestDto?.add_location_for_food_donation,
            disaster_links: newRequestDto?.disaster_links,
            category_name: findCategory.name,
            user_id: ObjectID(userDetail._id),
            uname,
            user_image: userImage,
            country_data: {},
            form_data: {
              files: {},
              images: {},
            },
          };
          // If user create request as ngo role then add ngo id
          if (newRequestDto.active_type === 'ngo') {
            formData.user_ngo_id = ObjectID(userDetail.ngo_data._id);
            countryData = userDetail.ngo_data.country_data;
          }
          if (newRequestDto.active_type === 'corporate') {
            formData.corporate_id = ObjectID(userDetail.corporate_data._id);
            countryData = userDetail.corporate_data.country_data;
          }
        }

        if (newRequestDto.form_type === 'draft') {
          formData.status = 'draft';
        } else {
          formData.status = 'pending';
          if (
            newRequestDto.active_type === 'corporate' &&
            userDetail.corporate_data &&
            _.includes(
              userDetail?.corporate_data?.permissions,
              'auto_approve_fundraiser',
            )
          ) {
            formData.status = 'approve';
          }
        }
        formData.createdAt = new Date();
        formData.updatedAt = new Date();
        formData.country_data['country'] = countryData.country;

        //Call checkValidation function for inputs validation
        const { data1, formData1, haveError } = await this.checkValidation(
          data,
          formData,
          newRequestDto.currency,
          newRequestDto.form_type,
          newRequestDto.active_type,
          newRequestDto.category_slug,
          userDetail,
        );

        data = JSON.stringify(data1);
        formData1.form_settings = data;

        //If there is an error in inputs validation then return error
        if (haveError) {
          return res.json({
            success: false,
            data,
          });
        }

        if (formData1.country_data && formData1.country_data.country) {
          formData1.country_data.country_code = countryData?.country_code;

          if (newRequestDto.category_slug !== 'hunger') {
            if (newRequestDto.currency) {
              formData1.country_data.currency = newRequestDto.currency;
              const currencySymbol = countryData?.currency.filter((e) => {
                return e.symbol === newRequestDto.currency;
              });
              formData1.country_data.currency_code = currencySymbol?.[0]?.name;
            } else {
              formData1.country_data.currency = countryData.currency[0].symbol;
              formData1.country_data.currency_code =
                countryData.currency[0].name;
            }
          }

          if (newRequestDto.form_type !== 'draft') {
            // Call generateUniqueId function for generate short reference id for request
            const referenceId = await this.commonService.generateUniqueId(
              formData1.country_data.country_code,
            );
            formData1.reference_id = referenceId;
          }
        }
        //If hospital/school is selected from list then location come from backend
        if (
          formData1.form_data.saayam_supported_name &&
          !_.isUndefined(formData1.form_data.saayam_supported_name) &&
          !formData1.form_data.not_listed
        ) {
          const findHospitalSchool = await this.hospitalSchoolModel
            .findOne(
              { name: formData1.form_data.saayam_supported_name },
              { location: 1, emergency_contact_number: 1 },
            )
            .lean();
          if (
            !_.isEmpty(findHospitalSchool) &&
            !_.isEmpty(findHospitalSchool.location)
          ) {
            formData1.form_data['location'] = findHospitalSchool.location;
          }
        }

        if (newRequestDto.category_slug === 'hunger') {
          //Call addFoodRequest for continue process
          const result = await this.addFoodRequest(formData1, userDetail);
          return res.json(result.respData);
        } else {
          //Call addCauseRequest for continue process
          const result = await this.addCauseRequest(
            formData1,
            userDetail,
            newRequestDto,
          );
          return res.json(result);
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.Category_not_found,
        });
      }
    } catch (error) {
      console.log(
        '🚀 ~ file: request.service.ts:346 ~ RequestService ~ createCauseRequest ~ error:',
        error,
      );
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-createCauseRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Function for add new food request
  private async addFoodRequest(requestData: any, userDetail: any) {
    try {
      //Find hunger settings
      const { radiusKm, maxRadiusKm, acceptTimeOut, limit }: any =
        await this.queueService.getRequestSetting(
          userDetail.country_data.country,
        );

      // Check donors available or not in maximum radius
      // const donorData: any = await this.queueService.getDonors(
      //   requestData,
      //   maxRadiusKm,
      // );
      // let noDonor = false;

      // if (
      //   (donorData &&
      //     donorData.donors &&
      //     _.isEmpty(donorData.donors) &&
      //     donorData.ngoDonors &&
      //     _.isEmpty(donorData.ngoDonors)) ||
      //   _.isEmpty(donorData)
      // ) {
      //   noDonor = true;
      // } else {

      const uname = userDetail.display_name
        ? userDetail.display_name
        : userDetail.first_name + ' ' + userDetail.last_name;
      const files = requestData.form_data.files;
      // All images are in "requestData.files" move all images from tmp to request folder
      for (const key in files) {
        files[key].map(async (item) => {
          // await this.commonService.moveImageIntoSitefolder(item, 'request');
          await this.commonService.uploadFileOnS3(item, 'request');
        });
      }

      //set cover photo for request
      requestData.form_data.files['upload_cover_photo'] = requestData?.form_data
        ?.files?.photos[0]
        ? [requestData?.form_data?.files?.photos[0]]
        : ['default-img.png'];

      //save new request
      const createRequest = new this.foodRequestModel(requestData);
      const newRequest: any = await createRequest.save();

      //send notification to admin
      const msg = await this.commonService.changeString(
        mConfig.noti_title_new_cause_request,
        { '{{cause}}': newRequest.category_name },
      );
      const input: any = {
        title: msg,
        type: 'food',
        requestId: newRequest._id,
        categorySlug: newRequest.category_slug,
        requestUserId: newRequest.user_id,
      };

      //send notification to another trusteee of ngo
      if (newRequest.user_ngo_id) {
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_new_food_request_created,
          {
            '{{uname}}': uname,
            '{{persons}}': `${newRequest.form_data.how_many_persons} people in your ngo`,
          },
        );
        input.message = msg;
        const notiUser = await this.commonService.getNgoUserIds(
          newRequest.user_ngo_id,
          newRequest.user_id,
        );

        if (notiUser) {
          input.userId = notiUser;
          this.commonService.notification(input);
        }
      }

      // Call setRequestCount function for increase request count in userData
      this.commonService.setRequestCount(
        newRequest,
        requestData.form_data.food_for_myself
          ? requestData.form_data.food_for_myself
          : false,
      );

      // const order = {
      //   request_id: newRequest._id,
      //   radius_km: radiusKm,
      //   max_radius_km: maxRadiusKm,
      //   accept_time_out: acceptTimeOut,
      //   limit: limit,
      // };

      const addQueueData: any = {
        request_id: newRequest._id,
        attempt: 0,
        total_attempt: limit,
        radius: radiusKm,
        max_radius_km: maxRadiusKm,
        cron_time: moment().add(acceptTimeOut, 'm'),
        type: 'donor',
        accept_time_out: acceptTimeOut,
      };

      await this.queueModel.updateOne(
        { request_id: newRequest._id },
        addQueueData,
        {
          upsert: true,
        },
      );

      //call manageFoodRequest for find nearest donor and ngo
      // const response: any = await this.queueService.manageFoodRequest(order);
      // console.log('CUSTOM_LOG ~ file: request.service.ts:432 ~ RequestService ~ addFoodRequest ~ response:', response);
      // if (response.removeJob) {
      //   noDonor = true;
      // }
      // }
      // let respData: any = {
      //   message: mConfig.no_donor_available,
      //   success: false,
      // };
      // if (!noDonor) {
      let respData = {
        message: mConfig.Food_request_send,
        success: true,
      };
      // }

      return { respData };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-addFoodRequest',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //Function for add new cause request
  private async addCauseRequest(
    requestData: any,
    userDetail: any,
    newRequestDto,
  ) {
    try {
      const uname = userDetail.display_name
        ? userDetail.display_name
        : userDetail.first_name + ' ' + userDetail.last_name;

      if (requestData.form_data && requestData.form_data.files) {
        const files = requestData.form_data.files;

        // All images are in "requestData.files" move upload images rom tmp to request folder
        for (const key in files) {
          files[key].map(async (item) => {
            // await this.commonService.moveImageIntoSitefolder(item, 'request');
            await this.commonService.uploadFileOnS3(item, 'request');
          });
        }
      }

      // Remove files from request folder
      if (
        !_.isEmpty(newRequestDto.removed_files) &&
        newRequestDto.removed_files
      ) {
        const removedFiles = newRequestDto.removed_files;
        await Promise.all(
          removedFiles.map(async (item: any) => {
            await this.commonService.unlinkFileFunction('request', item);
          }),
        );
      }
      let data;
      if (
        newRequestDto.draft_id &&
        !_.isUndefined(newRequestDto.draft_id) &&
        !_.isEmpty(newRequestDto.draft_id)
      ) {
        //update request data
        data = await this.causeRequestModel
          .findByIdAndUpdate(
            { _id: newRequestDto.draft_id },
            {
              $set: requestData,
            },
            { new: true },
          )
          .exec();
      } else {
        //save data in request table
        const createRequest = new this.causeRequestModel(requestData);
        data = await createRequest.save();

        if (
          !_.isUndefined(requestData?.form_data?.not_listed) &&
          requestData?.form_data?.not_listed
        ) {
          let hospitalSchoolData = {
            type: requestData?.category_slug,
            request_id: data?._id,
            saayam_supported_name:
              requestData?.form_data?.saayam_supported_name,
            location: requestData?.form_data?.location,
            reference_phone_number:
              requestData?.form_data?.reference_phone_number?.phoneNumber,
            reference_phone_code:
              requestData?.form_data?.reference_phone_number?.countryCodeD,
            reference_phone_short_name:
              requestData?.form_data?.reference_phone_number?.short_name,
            specify_name: requestData?.form_data?.specify_name,
            createdBy: 'auto',
            updatedBy: 'auto',
          };
          const createRequestData = new this.hospitalSchoolDataModel(
            hospitalSchoolData,
          );
          await createRequestData.save();
        }
      }
      if (!data) {
        return {
          success: false,
          message: mConfig.Please_try_again,
        };
      } else {
        if (newRequestDto.form_type === 'main') {
          // Call setRequestCount function for increase request count in userData
          this.commonService.setRequestCount(
            data,
            data.form_data.request_for_self
              ? data.form_data.request_for_self
              : false,
          );

          const title = await this.commonService.changeString(
            mConfig.noti_title_new_cause_request,
            { '{{cause}}': data.category_name },
          );

          const input: any = {
            title: title,
            type: data.category_slug,
            requestId: data._id,
            categorySlug: data.category_slug,
            requestUserId: data.user_id,
          };
          const updateData1 = {
            '{{user}}': uname,
            '{{cause}}': data.category_name,
            '{{refId}}': data.reference_id,
          };

          if (data.user_ngo_id) {
            const notiUser = await this.commonService.getNgoUserIds(
              data.user_ngo_id,
              data.user_id,
            );

            if (notiUser) {
              const msg = await this.commonService.changeString(
                mConfig.noti_msg_new_request,
                updateData1,
              );
              input.message = msg;
              input.userId = notiUser.toString();
              this.commonService.notification(input);
            }
          }

          const noti_msg = await this.commonService.changeString(
            mConfig.noti_msg_admin_new_request,
            updateData1,
          );
          input.message = noti_msg;
          this.commonService.sendAdminNotification(input);

          if (data.active_type == 'corporate') {
            const log: any = {
              request_id: data._id,
              description: `created the ${data.category_slug} request`,
            };
            this.logService.createActivityLog(log);
          }
        }

        if (
          newRequestDto.is_drive_fundraiser &&
          !_.isUndefined(newRequestDto.is_drive_fundraiser)
        ) {
          const reqData = {
            _id: data._id,
            image:
              authConfig.imageUrl +
              'request/' +
              data?.form_data?.files?.upload_cover_photo[0],
            title_of_fundraiser: data?.form_data?.title_of_fundraiser,
            country_data: data.country_data,
          };

          return {
            success: true,
            message:
              newRequestDto.form_type === 'main'
                ? mConfig.Cause_request_send
                : mConfig.Draft_saved,
            data: reqData,
          };
        } else {
          return {
            success: true,
            message:
              newRequestDto.form_type === 'main'
                ? mConfig.Cause_request_send
                : mConfig.Draft_saved,
          };
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-addCauseRequest',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  // Api for upadate cause request
  public async updateCauseRequest(
    id: string,
    updateRequestDto: UpdateRequestDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateRequestDto,
      );
      const request: any = await this.requestModel
        .findOne({
          category_slug: updateRequestDto.category_slug,
          _id: ObjectID(id),
        })
        .lean();

      if (!request) {
        return {
          message: mConfig.No_data_found,
          success: false,
        };
      } else {
        if (request.status == 'expired') {
          return res.json({ success: false, message: mConfig.Request_expired });
        }
        let data = JSON.parse(updateRequestDto.data);
        const userDetail = this.request.user;

        const formData: any = {
          form_data: {
            files: {},
            images: {},
          },
          country_data: request.country_data,
          updatedAt: new Date(),
          comment_enabled: updateRequestDto.comment_enabled
            ? updateRequestDto.comment_enabled
            : true,
          add_location_for_food_donation:
            updateRequestDto?.add_location_for_food_donation,
          disaster_links: updateRequestDto?.disaster_links,
        };

        const { data1, formData1, haveError } = await this.checkValidation(
          data,
          formData,
          updateRequestDto.currency,
          'main',
          request.active_type,
          request.category_slug,
          userDetail,
        );

        data = JSON.stringify(data1);
        formData1.form_settings = data;

        if (haveError) {
          return res.json({
            success: false,
            data,
          });
        }

        //If hospital/school is selected from list then location come from backend
        if (
          formData1.form_data.saayam_supported_name &&
          !_.isUndefined(formData1.form_data.saayam_supported_name) &&
          !formData1.form_data.not_listed
        ) {
          const findHospitalSchool = await this.hospitalSchoolModel
            .findOne(
              { name: formData1.form_data.saayam_supported_name },
              { location: 1, emergency_contact_number: 1 },
            )
            .lean();
          if (
            !_.isEmpty(findHospitalSchool) &&
            !_.isEmpty(findHospitalSchool.location)
          ) {
            formData1.form_data['location'] = findHospitalSchool.location;
          }
        }

        if (updateRequestDto.category_slug === 'hunger') {
          const result = await this.editFoodRequest(
            id,
            formData1,
            updateRequestDto,
            request,
          );
          return res.json(result);
        } else {
          const result = await this.editCauseRequest(
            id,
            formData1,
            updateRequestDto,
            request,
          );

          //Add Activity log for admins
          const logData = {
            request_id: request._id,
            user_id: userDetail._id,
            text: mConfig.Request_edit_activity_log,
          };

          this.logService.createFundraiserActivityLog(logData);
          return res.json(result);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-updateCauseRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Function for update food request
  private async editFoodRequest(
    id: string,
    requestData: any,
    updateRequestDto: UpdateRequestDto,
    foodRequest: any,
  ) {
    try {
      if (foodRequest.status == 'pending') {
        const files = requestData.form_data.files;

        //upload files in request folder
        for (const key in files) {
          files[key].map(async (item) => {
            // await this.commonService.moveImageIntoSitefolder(item, 'request');
            await this.commonService.uploadFileOnS3(item, 'request');
          });
        }

        //set cover photo for request
        requestData.form_data.files['upload_cover_photo'] = requestData
          ?.form_data?.files?.photos[0]
          ? [requestData?.form_data?.files?.photos[0]]
          : ['default-img.png'];

        // Remove files from request folder
        if (
          !_.isEmpty(updateRequestDto.removed_files) &&
          updateRequestDto.removed_files
        ) {
          const removedFiles = updateRequestDto.removed_files;
          await Promise.all(
            removedFiles.map(async (item: any) => {
              await this.commonService.unlinkFileFunction('request', item);
            }),
          );
        }

        //update request data
        await this.foodRequestModel
          .findByIdAndUpdate(
            { _id: foodRequest._id },
            {
              $set: requestData,
            },
          )
          .exec();

        //send notification to another trusteee
        if (foodRequest.user_ngo_id) {
          const notiUser = await this.commonService.getNgoUserIds(
            foodRequest.user_ngo_id,
            foodRequest.user_id,
          );

          if (notiUser) {
            const updateData1 = {
              '{{uname}}': foodRequest.uname,
              '{{cause}}': 'Hunger',
              '{{refId}}': foodRequest.reference_id,
            };

            const update_request = await this.commonService.changeString(
              mConfig.noti_msg_ngo_req_update,
              updateData1,
            );
            const titleMsg = await this.commonService.changeString(
              mConfig.noti_title_update_cause_request,
              { '{{cause}}': 'Hunger' },
            );
            const input: any = {
              message: update_request,
              title: titleMsg,
              type: 'food',
              requestId: foodRequest._id,
              categorySlug: foodRequest.category_slug,
              requestUserId: foodRequest.user_id,
            };
            input.userId = notiUser.toString();
            this.commonService.notification(input);
          }
        }
        return {
          message: mConfig.food_request_updated,
          success: true,
        };
      } else {
        return {
          message: mConfig.unauthorize_to_update_request,
          success: false,
        };
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-editFoodRequest',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //Function for update cause request
  private async editCauseRequest(
    id: string,
    requestData: any,
    updateRequestDto: UpdateRequestDto,
    causeRequest: any,
  ) {
    try {
      const files = requestData.form_data.files;

      //upload files in request folder
      for (const key in files) {
        files[key].map(async (item) => {
          await this.commonService.uploadFileOnS3(item, 'request');
        });
      }

      if (
        updateRequestDto.bank_id &&
        !_.isUndefined(updateRequestDto.bank_id)
      ) {
        requestData.bank_id = updateRequestDto.bank_id;
      }

      // if request status is rejected or new goal amount is greater than old then we're changing request status
      const oldGoalAmount = Number(causeRequest.form_data.goal_amount);
      const newGoalAmount = Number(requestData.form_data.goal_amount);
      if (
        causeRequest.status === 'reject' ||
        (newGoalAmount > oldGoalAmount && causeRequest.status === 'approve')
      ) {
        requestData.status = 'waiting_for_verify';
      }

      //update new data in request table
      await this.causeRequestModel
        .findByIdAndUpdate(
          { _id: causeRequest._id },
          {
            $set: requestData,
          },
        )
        .lean();

      //if user add new hospital/school not listed then we are main this record in new table
      if (
        !_.isUndefined(requestData?.form_data?.not_listed) &&
        requestData?.form_data?.not_listed
      ) {
        const findData = await this.hospitalSchoolDataModel
          .findOne({
            saayam_supported_name:
              requestData?.form_data?.saayam_supported_name,
          })
          .lean();

        if (!findData) {
          let hospitalSchoolData = {
            type: causeRequest?.category_slug,
            request_id: causeRequest?._id,
            saayam_supported_name:
              requestData?.form_data?.saayam_supported_name,
            location: requestData?.form_data?.location,
            reference_phone_number:
              requestData?.form_data?.reference_phone_number?.phoneNumber,
            reference_phone_code:
              requestData?.form_data?.reference_phone_number?.countryCodeD,
            reference_phone_short_name:
              requestData?.form_data?.reference_phone_number?.short_name,
            specify_name: requestData?.form_data?.specify_name,
            createdBy: 'auto',
            updatedBy: 'auto',
          };
          const createRequestData = new this.hospitalSchoolDataModel(
            hospitalSchoolData,
          );
          await createRequestData.save();
        }
      }

      //Add function for store request old data
      await this.storeRequestHistory(causeRequest);

      const titleMsg = await this.commonService.changeString(
        mConfig.noti_title_update_cause_request,
        { '{{cause}}': causeRequest.category_name },
      );
      const input: any = {
        title: titleMsg,
        type: causeRequest.category_slug,
        requestId: causeRequest._id,
        categorySlug: causeRequest.category_slug,
        requestUserId: causeRequest.user_id,
      };

      //send notification to another trusteee
      const updateData1 = {
        '{{uname}}': causeRequest.uname,
        '{{cause}}': causeRequest.category_name,
        '{{refId}}': causeRequest.reference_id,
      };
      if (causeRequest.user_ngo_id) {
        const notiUser = await this.commonService.getNgoUserIds(
          causeRequest.user_ngo_id,
          causeRequest.user_id,
        );

        if (notiUser) {
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_ngo_req_update,
            updateData1,
          );
          input.message = msg;
          input.userId = notiUser.toString();
          this.commonService.notification(input);
        }
      }

      //send notification to admin
      const noti_msg = await this.commonService.changeString(
        mConfig.noti_msg_admin_req_update,
        updateData1,
      );
      input.message = noti_msg;
      this.commonService.sendAdminNotification(input);
      return {
        message: mConfig.cause_req_update,
        success: true,
      };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-editCauseRequest',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  public async storeRequestHistory(oldData) {
    try {
      const historyData = {
        request_id: oldData._id,
        form_data: oldData.form_data,
        previous_status: oldData.status,
        location: oldData.location,
      };
      const create = new this.requestHistoryModel(historyData);
      await create.save();
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-storeRequestHistory',
      );
      return error;
    }
  }

  //Api for cause request list Admin-side
  public async findAllRequest(param, res: any): Promise<RequestModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const match = { status: { $ne: 'draft' } };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const user_type = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (filter.category_slug && !_.isEmpty(filter.category_slug)) {
          where.push({ category_slug: filter.category_slug });
        }
        if (!_.isUndefined(filter.reported) && filter.reported == 1) {
          let value = filter.reported;
          value = value == 'true' || value == true || value == 1 ? true : false;
          where.push({ report_benificiary: { $exists: value } });
        }
        if (!_.isUndefined(filter.only_ngo) && filter.only_ngo == 1) {
          user_type.push('ngo');
        }
        if (!_.isUndefined(filter.only_user) && filter.only_user == 1) {
          user_type.push('user', 'volunteer', 'donor');
        }
        if (
          !_.isUndefined(filter.only_corporate) &&
          filter.only_corporate == 1
        ) {
          user_type.push('corporate');
        }
        if (!_.isEmpty(user_type)) {
          where.push({ active_type: user_type });
        }
        if (!_.isUndefined(filter.updateBy) && filter.updateBy) {
          const query = await this.commonService.filter(
            'contains',
            filter.updateBy,
            'uname',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.user_id) && filter.user_id) {
          where.push({ user_id: ObjectID(filter.user_id) });
        }
        if (!_.isUndefined(filter.reference_id) && filter.reference_id) {
          const query = await this.commonService.filter(
            'contains',
            filter.reference_id,
            'reference_id',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter._id) && filter._id) {
          const query = await this.commonService.filter(
            'objectId',
            filter._id,
            '_id',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.active_type) && filter.active_type) {
          const query = await this.commonService.filter(
            'contains',
            filter.active_type,
            'active_type',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.title_of_fundraiser) &&
          filter.title_of_fundraiser
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.title_of_fundraiser,
            'form_data.title_of_fundraiser',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.name_of_beneficiary) &&
          filter.name_of_beneficiary
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.name_of_beneficiary,
            'form_data.name_of_beneficiary',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.goal_amount) && filter.goal_amount) {
          const query = await this.commonService.filter(
            'contains',
            filter.goal_amount,
            'form_data.goal_amount',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.remaining_amount) &&
          filter.remaining_amount
        ) {
          const query = await this.commonService.filter(
            '=',
            filter.remaining_amount,
            'form_data.remaining_amount',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.urgent_help) && filter.urgent_help) {
          const query = await this.commonService.filter(
            'boolean',
            filter.urgent_help,
            'form_data.urgent_help',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.urgent_help_status) &&
          filter.urgent_help_status
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.urgent_help_status,
            'form_data.urgent_help_status',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.vegetarian) && filter.vegetarian) {
          const query = await this.commonService.filter(
            'boolean',
            filter.vegetarian,
            'form_data.vegetarian',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.is_featured) && filter.is_featured) {
          const query = await this.commonService.filter(
            'boolean',
            filter.is_featured,
            'is_featured',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.deliver_before) && filter.deliver_before) {
          const query = await this.commonService.filter(
            'contains',
            filter.deliver_before,
            'form_data.deliver_before',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.food_for_myself) && filter.food_for_myself) {
          const query = await this.commonService.filter(
            'boolean',
            filter.food_for_myself,
            'form_data.food_for_myself',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.how_many_persons) &&
          filter.how_many_persons
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.how_many_persons,
            'form_data.how_many_persons',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.near_by) && filter.near_by) {
          const query = await this.commonService.filter(
            'contains',
            filter.near_by,
            'form_data.near_by',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.location) && filter.location) {
          const query = await this.commonService.filter(
            'contains',
            filter.location,
            'location.city',
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
        if (!_.isUndefined(filter.expiry_date) && filter.expiry_date) {
          const query = await this.commonService.filter(
            'date',
            filter.expiry_date,
            'form_data.expiry_date',
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
        if (!_.isUndefined(filter.approve_time) && filter.approve_time) {
          const query = await this.commonService.filter(
            'date',
            filter.approve_time,
            'approve_time',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            'contains',
            filter.status,
            'status',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.already_admission) &&
          filter.already_admission
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.already_admission,
            'form_data.already_admission',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.saayam_supported_name) &&
          filter.saayam_supported_name
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.saayam_supported_name,
            'form_data.saayam_supported_name',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.choose_or_select_institute) &&
          filter.choose_or_select_institute
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.choose_or_select_institute,
            'form_data.choose_or_select_institute',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const str_fields = [
            'uname',
            'reference_id',
            '_id',
            'active_type',
            'form_data.title_of_fundraiser',
            'form_data.name_of_beneficiary',
            'form_data.goal_amount',
            'form_data.deliver_before',
            'form_data.how_many_persons',
            'form_data.near_by',
            'location.city',
            'form_data.expiry_date',
            'approve_time',
            'status',
            'form_data.already_admission',
            'form_data.saayam_supported_name',
            'form_data.choose_or_select_institute',
            'updatedAt',
            'createdAt',
          ];
          const num_fields = ['form_data.remaining_amount'];
          const bool_fields = [
            'form_data.urgent_help',
            'form_data.vegetarian',
            'is_featured',
            'form_data.food_for_myself',
          ];
          const stringFilter = await this.commonService.getGlobalFilter(
            str_fields,
            filter.search,
          );
          const numFilter = await this.commonService.getNumberFilter(
            num_fields,
            filter.search,
          );
          const boolFilter = await this.commonService.getBooleanFilter(
            bool_fields,
            filter.search,
          );
          query = stringFilter.concat(numFilter);
          query = query.concat(boolFilter);
        }

        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
        if (!_.isUndefined(filter.search) && !_.isEmpty(query)) {
          match['$or'] = query;
        }
      }

      const sortData = {
        _id: '_id',
        uname: 'uname',
        reference_id: 'reference_id',
        active_type: 'active_type',
        is_featured: 'is_featured',
        report_benificiary: 'report_benificiary',
        title_of_fundraiser: 'form_data.title_of_fundraiser',
        name_of_beneficiary: 'form_data.name_of_beneficiary',
        goal_amount: 'form_data.goal_amount',
        remaining_amount: 'form_data.remaining_amount',
        urgent_help: 'form_data.urgent_help',
        urgent_help_status: 'form_data.urgent_help_status',
        expiry_date: 'form_data.expiry_date',
        vegetarian: 'form_data.vegetarian',
        deliver_before: 'form_data.deliver_before',
        food_for_myself: 'form_data.food_for_myself',
        how_many_persons: 'form_data.how_many_persons',
        location: 'location.city',
        near_by: 'form_data.near_by',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        approve_time: 'approve_time',
        status: 'status',
        already_admission: 'form_data.already_admission',
        choose_or_select_institute: 'form_data.choose_or_select_institute',
      };

      const total_record = await this.requestModel.count(match).lean();

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

      const causeData = await this.requestModel
        .find(match)
        .select({ form_settings: 0 })
        .collation({ locale: 'en' })
        .sort(sort)
        .skip(start_from)
        .limit(per_page)
        .lean();

      const data = await this.commonService.getAllRequestAllDetail(causeData);
      return res.json({
        data,
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
        'src/controller/request/request.service.ts-findAllRequest',
        param,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for app cause request list
  public async findUserFoodRequests(
    body: any,
    res: any,
  ): Promise<FoodRequestModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', body);
      const authorization = this.request?.headers?.authorization;
      const token = !_.isEmpty(authorization) ? authorization.split(' ') : '';

      const userDetail = this.request.user;
      const where = [];
      let geoNear = [];
      let query;
      let userD: any = {};
      let communityList = true;
      let includeBlocked = false;
      if (!_.isEmpty(userDetail) && !_.isUndefined(userDetail._id)) {
        query = {
          $or: [
            {
              ngo_donor_ids: { $in: [ObjectID(userDetail._id)] },
              category_slug: 'hunger',
            },
            {
              ngo_volunteer_ids: { $in: [ObjectID(userDetail._id)] },
              category_slug: 'hunger',
            },
            {
              donor_id: { $in: [ObjectID(userDetail._id)] },
              category_slug: 'hunger',
            },
            {
              volunteer_id: { $in: [ObjectID(userDetail._id)] },
              category_slug: 'hunger',
            },
            {
              status: 'approve',
            },
            // { ngo_ids: { $in: [ObjectID(requestList.user_id)] } },
          ],
          status: { $nin: ['delivered', 'cancelled'] },
          is_deleted: { $exists: false },
        };

        if (
          !_.isEmpty(userDetail.ngo_data) &&
          !_.isUndefined(userDetail.ngo_data._id)
        ) {
          query['$or'].push(
            {
              ngo_ids: { $in: [ObjectID(userDetail.ngo_data._id)] },
              category_slug: 'hunger',
            },
            {
              donor_ngo_id: ObjectID(userDetail.ngo_data._id),
              category_slug: 'hunger',
            },
            {
              user_ngo_id: ObjectID(userDetail.ngo_data._id),
              category_slug: 'hunger',
            },
            {
              volunteer_ngo_id: ObjectID(userDetail.ngo_data._id),
              category_slug: 'hunger',
            },
          );
        }

        // if (!_.isUndefined(body.just_for_you) && body.just_for_you == 1) {
        //   query['$or'].push({
        //     status: 'approve',
        //   });
        // } else {
        //   query['$or'].push({
        //     status: 'approve',
        //     user_id: { $ne: ObjectID(userDetail._id) },
        //     user_ngo_id: { $ne: ObjectID(userDetail?.ngo_data?._id) },
        //   });
        // }

        userD = {
          _id: userDetail._id,
          ngo_id: userDetail?.ngo_data?._id,
        };

        //Filter for my request screen data
        if (!_.isUndefined(body.my_request) && body.my_request) {
          includeBlocked = true;
          communityList = false;
          query = {
            $or: [
              { user_id: ObjectID(userDetail._id) },
              {
                user_ngo_id: ObjectID(userDetail?.ngo_data?._id),
                status: { $ne: 'draft' },
              },
              {
                donor_id: { $eq: [ObjectID(body.user_id)] },
              },
              {
                volunteer_id: { $eq: [ObjectID(body.user_id)] },
              },
              {
                admins: {
                  $elemMatch: {
                    user_id: ObjectID(userDetail._id),
                    status: { $eq: 'approve' },
                  },
                },
                status: { $ne: 'draft' },
              },
            ],
            is_deleted: { $exists: false },
          };
        }

        //Corporate list
        if (
          !_.isEmpty(body) &&
          !_.isUndefined(body.corporate) &&
          body.corporate == 1 &&
          !_.isUndefined(userDetail._id)
        ) {
          query.active_type = 'corporate';
          query.corporate_id = ObjectID(userDetail?.corporate_data?._id);
        } else {
          query.active_type = { $ne: 'corporate' };
        }

        if (
          (!_.isUndefined(body.home_screen) && body.home_screen) ||
          (!_.isUndefined(body.near_by) && body.near_by)
        ) {
          communityList = true;
          where.push({
            status: 'approve',
            category_slug: {
              $ne: 'hunger',
            },
          });
        }
        //Filter request based on race and religion
        if (!_.isUndefined(body.just_for_you) && body.just_for_you == 1) {
          if (
            userDetail.race &&
            !_.isUndefined(userDetail.race) &&
            userDetail.race !== 'Prefer Not To Say'
          ) {
            where.push({
              'form_data.race': userDetail.race,
            });
          }
          if (
            userDetail.religion &&
            !_.isUndefined(userDetail.religion) &&
            userDetail.religion !== 'Prefer Not To Say'
          ) {
            where.push({
              'form_data.religion': userDetail.religion,
            });
          }
        }
      } else if (
        (!_.isEmpty(token) && !_.isEmpty(token[1])) ||
        (_.isEmpty(token) && body.my_request)
      ) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        //guest user request list
        query = {
          status: 'approve',
          is_deleted: { $exists: false },
        };
      }

      if (!_.isUndefined(body) && !_.isEmpty(body)) {
        if (
          body.country &&
          !_.isUndefined(body.country) &&
          body.country != 'all'
        ) {
          if (Array.isArray(body.country)) {
            query['country_data.country_code'] = { $in: body.country };
          } else {
            query['country_data.country_code'] = body.country;
          }
        }
        //Filter for request for
        if (body.request_for && !_.isUndefined(body.request_for)) {
          let query = {};
          if (body.request_for === 'self') {
            query = {
              $or: [
                { 'form_data.food_for_myself': true },
                { 'form_data.request_for_self': true },
              ],
            };
          } else if (body.request_for === 'other') {
            query = {
              $or: [
                { 'form_data.food_for_myself': false },
                { 'form_data.request_for_self': false },
              ],
            };
          }
          where.push(query);
        }

        //Filter for created request between from date to end date
        if (body.start_date && !_.isUndefined(body.start_date)) {
          const startDate = new Date(body.start_date + 'T00:00:00.000Z');
          where.push({
            createdAt: {
              $gte: startDate,
            },
          });
        }

        if (body.end_date && !_.isUndefined(body.end_date)) {
          const endDate = new Date(body.end_date + 'T23:59:59.000Z');
          where.push({
            createdAt: {
              $lte: endDate,
            },
          });
        }

        //Filter for request status
        if (!_.isUndefined(body.status) && body.status) {
          const filterArray = body.status;
          const statusArray = body.status;

          if (filterArray.includes('ongoing')) {
            statusArray.splice(statusArray.indexOf('ongoing'), 1);
            statusArray.push(
              'approve',
              'donor_accept',
              'volunteer_accept',
              'waiting_for_volunteer',
              'pickup',
            );
          }
          if (filterArray.includes('complete')) {
            statusArray.splice(statusArray.indexOf('complete'), 1);
            statusArray.push('complete', 'delivered');
          }
          if (filterArray.includes('reject')) {
            statusArray.splice(statusArray.indexOf('reject'), 1);
            statusArray.push('cancelled', 'reject');
          }
          const query = {
            status: {
              $in: statusArray,
            },
          };
          where.push(query);
        }
        if (
          !_.isUndefined(body.status) &&
          body.status &&
          body.status === 'featured'
        ) {
          where.push({
            is_featured: true,
          });
        }

        //Filter for selected causes requets
        if (
          !_.isUndefined(body.category_slug) &&
          body.category_slug &&
          body.category_slug != 'all'
        ) {
          where.push({
            category_slug: { $in: body.category_slug },
          });
        }

        if (body.search && !_.isUndefined(body.search)) {
          where.push({
            'form_data.title_of_fundraiser': new RegExp(body.search, 'i'),
          });
        }

        //Filter for find requests which contains remaining amount between selected remaining amount
        if (
          !_.isUndefined(body.remaining_amt_from) &&
          body.remaining_amt_from !== ''
        ) {
          where.push({
            'form_data.remaining_amount': { $gte: body.remaining_amt_from },
          });
        }

        if (
          !_.isUndefined(body.remaining_amt_to) &&
          body.remaining_amt_to !== ''
        ) {
          where.push({
            'form_data.remaining_amount': { $lte: body.remaining_amt_to },
          });
        }

        if (!_.isEmpty(where)) {
          query['$and'] = where;
        }

        //Filter for find near by fundraiser requests
        if (
          !_.isUndefined(body.user_lat) &&
          body.user_lat != '' &&
          !_.isUndefined(body.user_long) &&
          body.user_long != ''
        ) {
          const maximumRadius = await this.queueService.getSetting(
            'maximum-radius',
          );

          const maximumRadInMeter = !_.isUndefined(body.maximum_radius)
            ? Number(body.maximum_radius)
            : maximumRadius;

          const latitude = Number(body.user_lat) || 0;
          const longitude = Number(body.user_long) || 0;
          geoNear = [
            {
              $geoNear: {
                near: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                },
                distanceField: 'distance',
                distanceMultiplier: 0.001,
                key: 'location',
                maxDistance: maximumRadInMeter * 1000,
                minDistance: 0,
                spherical: true,
              },
            },
          ];

          userD.user_lat = latitude;
          userD.user_long = longitude;
          userD.maximum_radius = maximumRadInMeter;
        }

        //Filter for find requests thar are expired soon
        if (
          !_.isUndefined(body.fundraiser_closing_soon) &&
          body.fundraiser_closing_soon == true
        ) {
          const closingInDays = await this.queueService.getSetting(
            'fundraiser-closing-soon-in-days',
          );

          const closingDate = moment()
            .tz('UTC')
            .add(closingInDays, 'd')
            .endOf('day')
            .toISOString();
          query['form_data.expiry_date'] = {
            $gte: new Date(),
            $lte: new Date(closingDate),
          };
        }

        if (!_.isUndefined(body.is_urgent) && body.is_urgent == true) {
          query['form_data.urgent_help_status'] = 'approve';
        }
      }

      const sortData = ['_id', 'createdAt', 'approve_time'];

      const total = await this.requestModel.aggregate([
        ...geoNear,
        {
          $lookup: {
            from: 'ngo', // collection name in db
            localField: 'user_ngo_id',
            foreignField: '_id',
            as: 'ngoData',
          },
        },
        { $match: query },
        {
          $unwind: {
            path: '$ngoData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: { 'ngoData.is_deleted': { $ne: true } },
        },
        {
          $group: {
            _id: '$_id',
            ngoDatas: { $first: '$ngoData' },
          },
        },
        {
          $project: {
            _id: '$request_data._id',
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
          },
        },
        {
          $unwind: {
            path: '$ngo_Data',
            preserveNullAndEmptyArrays: includeBlocked,
          },
        },
        { $count: 'count' },
      ]);

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      if (!_.isUndefined(body.home_screen) && body.home_screen) {
        const result = await this.queueService.getSetting(
          'home-screen-per-page',
        );
        body.per_page = !_.isEmpty(result) ? result : 5;
      }

      let {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        body.page,
        body.per_page,
        total_record,
        sortData,
        body.sort_type,
        'createdAt',
      );

      if (communityList) {
        sort = {
          community_sort: 1,
          'form_data.expiry_date': 1,
        };
      } else {
        sort = {
          sort: 1,
          _id: -1,
        };
      }

      const sortList = {};
      if (
        (!_.isUndefined(body.sort_by) && body.sort_by == 'asce') ||
        body.sort_by == 'desc'
      ) {
        const sort_data = 'title_of_fundraiser';
        const sort_type = body.sort_by == 'asce' ? 1 : -1;

        sortList[sort_data] = sort_type;
        sort = sortList;
      }

      if (
        (!_.isUndefined(body.sort_by) && body.sort_by == 'new_to_old') ||
        body.sort_by == 'old_to_new'
      ) {
        const sort_data = 'createdAt';
        const sort_type = body.sort_by == 'old_to_new' ? 1 : -1;

        sortList[sort_data] = sort_type;
        sort = sortList;
      }

      const data = await this.commonService.getAllRequestListWithTransaction(
        query,
        sort,
        start_from,
        per_page,
        userD,
        includeBlocked,
      );

      return res.json({
        data,
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
        'src/controller/request/request.service.ts-findUserFoodRequests',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for similar cause request list
  public async similarFundraiser(id: string, body: any, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        body,
      );
      const userDetail = this.request.user;
      const requestDetail = await this.foodRequestModel
        .findOne({ _id: ObjectID(id), is_deleted: { $ne: true } })
        .select({ _id: 1, category_slug: 1 })
        .lean();

      if (!requestDetail) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let geoNear = [];
        let userD: any = {};
        const query = {
          status: 'approve',
          category_slug: requestDetail.category_slug,
          _id: { $ne: ObjectID(requestDetail._id) },
          is_deleted: { $ne: true },
        };
        //Filter for find near by fundraiser requests
        if (
          !_.isUndefined(body.user_lat) &&
          body.user_lat != '' &&
          !_.isUndefined(body.user_long) &&
          body.user_long != ''
        ) {
          const maximumRadius = await this.queueService.getSetting(
            'maximum-radius',
          );

          const maximumRadInMeter = !_.isUndefined(body.maximum_radius)
            ? Number(body.maximum_radius)
            : maximumRadius;

          const latitude = Number(body.user_lat) || 0;
          const longitude = Number(body.user_long) || 0;

          geoNear = [
            {
              $geoNear: {
                near: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                },
                distanceField: 'distance',
                distanceMultiplier: 0.001,
                key: 'location',
                maxDistance: maximumRadInMeter * 1000,
                minDistance: 0,
                spherical: true,
              },
            },
          ];

          userD.user_lat = Number(latitude);
          userD.user_long = Number(longitude);
          userD.maximum_radius = maximumRadInMeter;
        }

        const sortData = ['_id', 'createdAt', 'approve_time'];
        const total = await this.requestModel.aggregate([
          ...geoNear,
          {
            $lookup: {
              from: 'ngo', // collection name in db
              localField: 'user_ngo_id',
              foreignField: '_id',
              as: 'ngoData',
            },
          },
          { $match: query },
          {
            $unwind: {
              path: '$ngoData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: { 'ngoData.is_deleted': { $ne: true } },
          },
          {
            $group: {
              _id: '$_id',
              ngoDatas: { $first: '$ngoData' },
            },
          },
          {
            $project: {
              _id: '$request_data._id',
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
            },
          },
          {
            $unwind: {
              path: '$ngo_Data',
              preserveNullAndEmptyArrays: false,
            },
          },
          { $count: 'count' },
        ]);

        const total_record =
          total && total[0] && total[0].count ? total[0].count : 0;

        let {
          per_page,
          page,
          total_pages,
          prev_enable,
          next_enable,
          start_from,
          sort,
        } = await this.commonService.sortFilterPagination(
          body.page,
          body.per_page,
          total_record,
          sortData,
          body.sort_type,
          'createdAt',
        );

        sort = {
          community_sort: 1,
          'form_data.expiry_date': 1,
        };

        const data = await this.commonService.getAllRequestListWithTransaction(
          query,
          sort,
          start_from,
          per_page,
          userD,
          false,
        );

        return res.json({
          data,
          success: true,
          total_count: total_record,
          prev_enable: prev_enable,
          next_enable: next_enable,
          total_pages: total_pages,
          per_page: per_page,
          page: page,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-similarFundraiser',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for app cause request list
  public async findVolunteersRequests(
    body: any,
    res: any,
  ): Promise<RequestModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', body);

      const where = [];
      let geoNear = [];
      const userDetail = this.request.user;
      const userD: any = {
        _id: userDetail._id,
        ngo_id: userDetail?.ngo_data?._id,
      };

      const query = {
        volunteer_id: { $in: [ObjectID(userDetail._id)] },
        status: { $ne: 'pending' },
        category_slug: { $ne: ['hunger'] },
        is_deleted: { $exists: false },
      };

      if (!_.isUndefined(body) && !_.isEmpty(body)) {
        //Filter for request status
        if (!_.isUndefined(body.status) && body.status) {
          const filterArray = body.status;
          const statusArray = body.status;

          if (filterArray.includes('approval')) {
            statusArray.splice(statusArray.indexOf('approval'), 1);
            statusArray.push('volunteer_accept', 'waiting_for_volunteer');
          }
          if (filterArray.includes('ongoing')) {
            statusArray.splice(statusArray.indexOf('ongoing'), 1);
            statusArray.push('approve');
          }
          if (filterArray.includes('close')) {
            statusArray.splice(statusArray.indexOf('close'), 1);
            statusArray.push('complete');
          }
          if (filterArray.includes('reverify')) {
            statusArray.splice(statusArray.indexOf('reverify'), 1);
            statusArray.push('reverify');
          }
          const query = {
            status: {
              $in: statusArray,
            },
          };
          where.push(query);
        }

        //Filter for selected causes requets
        if (
          !_.isUndefined(body.category_slug) &&
          !_.isEmpty(body.category_slug)
        ) {
          where.push({
            category_slug: { $in: body.category_slug },
          });
        }

        if (!_.isEmpty(where)) {
          query['$and'] = where;
        }

        //Filter for find near by fundraiser requests
        if (
          !_.isUndefined(body.user_lat) &&
          body.user_lat != '' &&
          !_.isUndefined(body.user_long) &&
          body.user_long != ''
        ) {
          const maximumRadius = await this.queueService.getSetting(
            'maximum-radius',
          );

          const maximumRadInMeter = !_.isUndefined(body.maximum_radius)
            ? Number(body.maximum_radius)
            : maximumRadius;

          const latitude = Number(body.user_lat) || 0;
          const longitude = Number(body.user_long) || 0;
          geoNear = [
            {
              $geoNear: {
                near: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                },
                distanceField: 'distance',
                distanceMultiplier: 0.001,
                key: 'location',
                maxDistance: maximumRadInMeter * 1000,
                minDistance: 0,
                spherical: true,
              },
            },
          ];

          userD.user_lat = latitude;
          userD.user_long = longitude;
          userD.maximum_radius = maximumRadInMeter;
        }

        //Filter for find requests which contains remaining amount between selected remaining amount
        if (
          !_.isUndefined(body.remaining_amt_from) &&
          body.remaining_amt_from !== '' &&
          !_.isUndefined(body.remaining_amt_to) &&
          body.remaining_amt_to !== ''
        ) {
          query['form_data.remaining_amount'] = {
            $gte: body.remaining_amt_from,
            $lte: body.remaining_amt_to,
          };
        }

        //Filter for find requests thar are expired soon
        if (
          !_.isUndefined(body.fundraiser_closing_soon) &&
          body.fundraiser_closing_soon == true
        ) {
          const closingInDays = await this.queueService.getSetting(
            'fundraiser-closing-soon-in-days',
          );

          const closingDate = moment()
            .tz('UTC')
            .add(closingInDays, 'd')
            .endOf('day')
            .toISOString();
          query['form_data.expiry_date'] = {
            $gte: new Date(),
            $lte: new Date(closingDate),
          };
        }

        if (!_.isUndefined(body.is_urgent) && body.is_urgent == true) {
          query['form_data.urgent_help_status'] = 'approve';
        }
      }

      const sortData = ['_id', 'createdAt', 'approve_time'];

      const total = await this.requestModel.aggregate([
        ...geoNear,
        {
          $lookup: {
            from: 'ngo', // collection name in db
            localField: 'user_ngo_id',
            foreignField: '_id',
            as: 'ngoData',
          },
        },
        { $match: query },
        {
          $unwind: {
            path: '$ngoData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: { 'ngoData.is_deleted': { $ne: true } },
        },
        {
          $group: {
            _id: '$_id',
            ngoDatas: { $first: '$ngoData' },
          },
        },
        {
          $project: {
            _id: '$request_data._id',
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
          },
        },
        {
          $unwind: {
            path: '$ngo_Data',
            preserveNullAndEmptyArrays: false,
          },
        },
        { $count: 'count' },
      ]);

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      if (!_.isUndefined(body.home_screen) && body.home_screen) {
        const result = await this.queueService.getSetting(
          'home-screen-per-page',
        );
        body.per_page = !_.isEmpty(result) ? result : 5;
      }

      let {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        body.page,
        body.per_page,
        total_record,
        sortData,
        body.sort_type,
        'createdAt',
      );

      if (!_.isUndefined(body.sort_by) && body.sort_by) {
        const sortBy = body.sort_by;
        if (sortBy == 'asce') {
          sort = { title_of_fundraiser: 1 };
        } else if (sortBy == 'desc') {
          sort = { title_of_fundraiser: -1 };
        } else if (sortBy == 'old_to_new') {
          sort = { createdAt: 1 };
        } else if (sortBy == 'new_to_old') {
          sort = { createdAt: -1 };
        } else if (sortBy == 'last_week') {
          const startDate =
            moment()
              .subtract(1, 'weeks')
              .startOf('isoWeek')
              .format('YYYY-MM-DD') + 'T00:00:00Z';
          const endDate =
            moment()
              .subtract(1, 'weeks')
              .endOf('isoWeek')
              .format('YYYY-MM-DD') + 'T23:59:59Z';

          where.push({
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          });
        } else if (sortBy == 'last_month') {
          const startDate =
            moment()
              .subtract(1, 'month')
              .startOf('month')
              .format('YYYY-MM-DD') + 'T00:00:00Z';
          const endDate =
            moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD') +
            'T23:59:59Z';

          where.push({
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          });
        }
      }

      const data = await this.commonService.getAllRequestListWithTransaction(
        query,
        sort,
        start_from,
        per_page,
        userD,
      );

      return res.json({
        data,
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
        'src/controller/request/request.service.ts-findVolunteersRequests',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Common api for get cause request details for app & admin
  public async getDetail(list_type, param, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      if (_.isEmpty(param.id)) {
        return res.json({
          message: mConfig.Params_are_missing,
          success: false,
        });
      }
      const requestdetail = await this.commonService.getFoodRequest(
        param.id,
        list_type,
        param,
      );

      if (_.isEmpty(requestdetail)) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        requestdetail.goverment_doc = [];
        return res.json({
          success: true,
          data: requestdetail,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-getDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Common api for get cause request details for app & admin
  public async getRequestDetail(param, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      if (_.isEmpty(param.id)) {
        return res.json({
          message: mConfig.Params_are_missing,
          success: false,
        });
      }
      const query: any = {
        _id: ObjectID(param.id),
      };

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
            as: 'donations',
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
            from: 'user',
            localField: 'user_id',
            foreignField: '_id',
            as: 'userData',
          },
        },
        {
          $unwind: {
            path: '$userData',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: 'ngo',
            localField: 'user_ngo_id',
            foreignField: '_id',
            as: 'ngoData',
          },
        },
        {
          $unwind: {
            path: '$ngoData',
            preserveNullAndEmptyArrays: true,
          },
        },
      ];

      const project = {
        _id: 1,
        disaster_links: 1,
        user_ngo_id: 1,
        reference_id: 1,
        delete_request: 1,
        volunteer_accept_time: 1,
        volunteer_name: {
          $concat: ['$volunteerD.first_name', ' ', '$volunteerD.last_name'],
        },
        volunteer_email: '$volunteerD.email',
        volunteer_address: '$volunteerD.location.city',
        volunteer_phone: {
          $concat: ['$volunteerD.phone_code', ' ', '$volunteerD.phone'],
        },
        location: 1,
        deliver_time: 1,
        category_slug: 1,
        category_name: 1,
        active_type: 1,
        transfer_amount: 1,
        total_donors: { $size: { $setUnion: ['$donations.donor_id', []] } },
        report_benificiary: 1,
        remaining_transfer: 1,
        donor_ngo_name: 1,
        volunteer_ngo_name: 1,
        total_transfer: 1,
        status: 1,
        createdAt: 1,
        country_data: 1,
        user_image: {
          $ifNull: [
            { $concat: [authConfig.imageUrl, 'user/', '$user_image'] },
            null,
          ],
        },
        approve_time: 1,
        total_donation: 1,
        uname: 1,
        user_id: 1,
        form_data: 1,
        donor_accept: 1,
        volunteer_accept: 1,
        is_featured: 1,
        fundraiser_status: 1,
        cancelled_by: 1,
        cancelled_at: 1,
        send_request_for_delete_request_reason: 1,
        bank_id: 1,
        plan: 1,
        picked_up_time: 1,
        image_url: authConfig.imageUrl + 'request/',
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
        fcra: { $ifNull: ['$ngoData.form_data.fcra_certificates', false] },
        userDtl: {
          _id: '$userData._id',
          email: '$userData.email',
          phone_code: '$userData.phone_code',
          phone: '$userData.phone',
          display_name: '$userData.display_name',
          first_name: '$userData.first_name',
          last_name: '$userData.last_name',
          phone_country_short_name: '$userData.phone_country_short_name',
          'location.city': '$userData.location.city',
          image: { $concat: [authConfig.imageUrl, 'user/', '$userData.image'] },
          'restaurant_location.city': '$userData.restaurant_location.city',
          restaurant_name: '$userData.restaurant_name',
          is_restaurant: '$userData.is_restaurant',
          is_veg: '$userData.is_veg',
          user_id: '$userData._id',
          country_code: '$userData.country_data.country_code',
        },
      };

      const data = await this.requestModel.aggregate([
        { $match: query },
        ...lookup,

        {
          $project: project,
        },
      ]);
      const requestDetail: any = data[0];
      if (!_.isEmpty(requestDetail)) {
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
          const today: any = new Date().toISOString().slice(0, 10);
          const startDate: any = new Date(
            requestDetail.createdAt.toISOString().slice(0, 10),
          );
          const endDate: any = new Date(today);
          const diffInMs: any = endDate - startDate;
          const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
          requestDetail.funded_in_days = diffInDays > 0 ? diffInDays + 1 : 1;
        }
        return res.json({
          success: true,
          data: requestDetail,
        });
      } else {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-getRequestDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for file upload
  public async uploadFile(file: any, res: any): Promise<any> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', file);

      const imageId: any = await this.commonService.uploadFileFunction(file);
      if (imageId && imageId.error) {
        return res.json({
          message: imageId.error,
          success: false,
        });
      }
      return res.json(imageId);
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-uploadFile',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for file upload
  public async uploadFileS3(file: string, res: any): Promise<any> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', file);
      const filePath = './uploads/temp/' + file;

      const response = await this.commonService.uploadFileOnS3(file, 'aaa');
      return response;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-uploadFileS3',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update food order status
  public async updateOrderStatus(
    id: string,
    updateOrderStatus: UpdateOrderStatus,
    res: any,
  ): Promise<Request> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateOrderStatus,
      );

      const query = { _id: ObjectID(id) };
      const foodRequest: any = await this.foodRequestModel.findById(id).lean();

      if (!foodRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const userDetail = this.request.user;
        const userName = userDetail.display_name
          ? userDetail.display_name
          : userDetail.first_name + ' ' + userDetail.last_name;
        const userId: any = userDetail._id.toString();

        if (
          foodRequest.status === 'pending' &&
          updateOrderStatus.status === 'donor_accept'
        ) {
          const finalDonors = foodRequest.donor_id.map((x) => x.toString());
          const finalNgoDonors = foodRequest.ngo_donor_ids.map((x) =>
            x.toString(),
          );
          const findDonorIds = [
            ...new Set([...finalDonors, ...finalNgoDonors]),
          ];
          const matchId = findDonorIds.includes(userId);

          if (matchId === false) {
            return res.json({
              message: mConfig.Not_exist_in_donor_list,
              success: false,
            });
          } else {
            if (foodRequest.user_id.toString() === userId) {
              await this.queueService.autoAssignDonor(
                foodRequest,
                updateOrderStatus.active_type,
                userId,
              );
              const requestData = await this.commonService.getFoodRequest(
                foodRequest._id,
              );
              return res.json({
                message: mConfig.Request_assigned_to_you,
                success: true,
                data: requestData,
              });
            } else {
              const foodData: any = {
                accept_donor_ids:
                  foodRequest.accept_donor_ids &&
                  !_.isEmpty(foodRequest.accept_donor_ids)
                    ? foodRequest.accept_donor_ids
                    : [],
              };

              let key = 'location';
              const match: any = {
                _id: ObjectID(userId),
              };
              if (
                updateOrderStatus.active_type === 'donor' &&
                userDetail.is_restaurant === true
              ) {
                match.is_restaurant = true;
                key = 'restaurant_location';
              } else if (updateOrderStatus.active_type === 'ngo') {
                key = 'ngo_data.ngo_location';
                match.is_ngo = true;
                const ngoIds =
                  foodRequest.ngo_ids && !_.isEmpty(foodRequest.ngo_ids)
                    ? foodRequest.ngo_ids
                    : [];

                if (
                  ngoIds
                    .map((s) => s.toString())
                    .indexOf(userDetail?.ngo_data?._id.toString()) === -1
                ) {
                  ngoIds.push(userDetail.ngo_data._id);
                }
                foodData.ngo_ids = ngoIds;
              }
              // Have to add restaurant location
              const donorData: any = await this.userModel.aggregate([
                {
                  $geoNear: {
                    near: {
                      type: 'Point',
                      coordinates: foodRequest.location.coordinates,
                    },
                    distanceField: 'distance',
                    key,
                    distanceMultiplier: 0.001,
                    query: match,
                    spherical: true,
                  },
                },
              ]);

              const obj: any = {
                _id: userId,
                distance: donorData[0].distance,
                active_type: updateOrderStatus.active_type,
              };
              foodData.accept_donor_ids.push(obj);

              if (updateOrderStatus.active_type === 'ngo') {
                const ngoUsers = await this.commonService.getNgoUserIds(
                  userDetail.ngo_data._id,
                  userId,
                );
                if (ngoUsers) {
                  const updateData1 = {
                    '{{user}}': userName,
                    '{{refId}}': foodRequest.reference_id,
                  };

                  const accept_request = await this.commonService.changeString(
                    mConfig.noti_msg_accept_food_request,
                    updateData1,
                  );
                  //send notification to another trustee
                  const input: any = {
                    message: accept_request,
                    title: mConfig.noti_title_request_accepted,
                    type: 'food',
                    requestId: foodRequest._id,
                    categorySlug: foodRequest.category_slug,
                    requestUserId: foodRequest.user_id,
                    userId: ngoUsers,
                  };
                  this.commonService.notification(input);
                }
              }
              await this.foodRequestModel.updateOne(query, foodData);
              const requestData = await this.commonService.getFoodRequest(
                foodRequest._id,
              );
              return res.json({
                message: mConfig.Please_wait_for_few_minutes,
                success: true,
                data: requestData,
              });
            }
          }
        }
        // volunteer accept the request & update the status of request volunteer_accept
        else if (
          foodRequest.status === 'waiting_for_volunteer' &&
          updateOrderStatus.status === 'volunteer_accept'
        ) {
          if (
            foodRequest.user_id.toString() === userId ||
            foodRequest.donor_id.toString() === userId
          ) {
            await this.queueService.autoAssignVolunteer(
              foodRequest,
              updateOrderStatus.active_type,
              userId,
            );
            const requestData = await this.commonService.getFoodRequest(
              foodRequest._id,
            );
            return res.json({
              message: mConfig.Request_assigned_to_you,
              success: true,
              data: requestData,
            });
          } else {
            const finalVolunteers = foodRequest.volunteer_id.map((x) =>
              x.toString(),
            );
            const finalNgoVolunteers = foodRequest.ngo_volunteer_ids.map((x) =>
              x.toString(),
            );
            const findVolunteerIds = [
              ...new Set([...finalVolunteers, ...finalNgoVolunteers]),
            ];
            const matchId =
              findVolunteerIds.includes(userId) ||
              foodRequest.donor_id.toString() === userId;

            if (matchId === false) {
              return res.json({
                message: mConfig.Not_exist_in_volunteer_list,
                success: false,
              });
            } else {
              const foodData: any = {
                accept_volunteer_ids:
                  foodRequest.accept_volunteer_ids &&
                  !_.isEmpty(foodRequest.accept_volunteer_ids)
                    ? foodRequest.accept_volunteer_ids
                    : [],
              };

              if (updateOrderStatus.active_type === 'ngo') {
                const ngoIds =
                  foodRequest.ngo_ids && !_.isEmpty(foodRequest.ngo_ids)
                    ? foodRequest.ngo_ids
                    : [];

                if (
                  ngoIds
                    .map((s) => s.toString())
                    .indexOf(userDetail?.ngo_data?._id.toString()) === -1
                ) {
                  ngoIds.push(userDetail.ngo_data._id);
                }
                foodData.ngo_ids = ngoIds;
              }
              const obj: any = {
                _id: userId,
                active_type: updateOrderStatus.active_type,
              };
              foodData.accept_volunteer_ids.push(obj);

              if (updateOrderStatus.active_type === 'ngo') {
                const updateData1 = {
                  '{{user}}': userName,
                  '{{refId}}': foodRequest.reference_id,
                };

                const accept_request = await this.commonService.changeString(
                  mConfig.noti_msg_accept_request,
                  updateData1,
                );
                //send notification to another trustee
                const input: any = {
                  message: accept_request,
                  title: mConfig.noti_title_request_accepted,
                  type: 'food',
                  requestId: foodRequest._id,
                  categorySlug: foodRequest.category_slug,
                  requestUserId: foodRequest.user_id,
                };
                const ngoUsers = await this.commonService.getNgoUserIds(
                  userDetail.ngo_data._id,
                  userId,
                );
                if (ngoUsers) {
                  input.userId = ngoUsers;
                  this.commonService.notification(input);
                }
              }

              await this.foodRequestModel.updateOne(query, foodData).lean();

              const requestData = await this.commonService.getFoodRequest(
                foodRequest._id,
              );

              return res.json({
                message: mConfig.Please_wait_for_few_minutes,
                success: true,
                data: requestData,
              });
            }
          }
        }
        // volunteer pickup the request & update the status of request pickup
        else if (
          foodRequest.status === 'volunteer_accept' &&
          updateOrderStatus.status === 'pickup' &&
          foodRequest.volunteer_id.toString() === userId
        ) {
          const updateData: any = {
            status: 'pickup',
            picked_up_time: new Date(),
          };
          await this.foodRequestModel
            .updateOne({ _id: foodRequest._id }, updateData)
            .lean();

          const requestData = await this.commonService.getFoodRequest(
            foodRequest._id,
          );
          const updateData1 = {
            '{{volunteer_name}}': requestData.volunteer_accept.user_name,
            '{{refId}}': foodRequest.reference_id,
          };

          const pickup_request = await this.commonService.changeString(
            mConfig.noti_msg_volunteer_pickup_food,
            updateData1,
          );

          const removeNotiIds = [requestData.user_id];
          const input: any = {
            message: pickup_request,
            title: mConfig.noti_title_food_request_picked,
            type: 'food',
            requestId: foodRequest._id,
            categorySlug: foodRequest.category_slug,
            requestUserId: foodRequest.user_id,
          };
          // send notification to user
          if (
            foodRequest.user_id.toString() !==
            foodRequest.volunteer_id.toString()
          ) {
            input.userId = requestData.user_id;
            this.commonService.notification(input);
          }
          //send push notification to trustee of user ngo
          if (requestData.user_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              requestData.user_ngo_id,
              requestData.user_id,
            );
            if (notiId) {
              if (notiId.toString() !== requestData.volunteer_id.toString()) {
                const pickup_request = await this.commonService.changeString(
                  mConfig.noti_msg_volunteer_pickup_ngo_food,
                  updateData1,
                );

                input.message = pickup_request;
                input.userId = notiId;
                removeNotiIds.push(notiId);
                this.commonService.notification(input);
              }
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
              !removeNotiIds
                .map((s) => s.toString())
                .includes(notiId.toString())
            ) {
              if (notiId.toString() !== requestData.volunteer_id.toString()) {
                const pickup_request = await this.commonService.changeString(
                  mConfig.noti_msg_volunteer_pickup,
                  updateData1,
                );
                input.message = pickup_request;
                input.userId = notiId;
                removeNotiIds.push(notiId);
                this.commonService.notification(input);
              }
            }
          }
          //send notification to donor
          if (
            !removeNotiIds
              .map((s) => s.toString())
              .includes(requestData.donor_id.toString())
          ) {
            if (
              requestData.donor_id.toString() !==
              requestData.volunteer_id.toString()
            ) {
              const pickup_request = await this.commonService.changeString(
                mConfig.noti_msg_volunteer_pickup,
                updateData1,
              );
              input.message = pickup_request;
              input.userId = requestData.donor_id;
              removeNotiIds.push(requestData.donor_id);
              this.commonService.notification(input);
            }
          }
          //send notification to trustee of volunteer ngo
          if (requestData.volunteer_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              requestData.volunteer_ngo_id,
              requestData.volunteer_id,
            );
            if (
              notiId &&
              !removeNotiIds
                .map((s) => s.toString())
                .includes(notiId.toString())
            ) {
              if (notiId.toString() !== requestData.volunteer_id.toString()) {
                const pickup_request = await this.commonService.changeString(
                  mConfig.noti_msg_volunteer_pickup,
                  updateData1,
                );
                input.message = pickup_request;
                input.userId = notiId;
                removeNotiIds.push(notiId);
                this.commonService.notification(input);
              }
            }
          }

          return res.json({
            message: mConfig.Request_picked,
            success: true,
            data: requestData,
          });
        }
        // volunteer delivered the request & update the status of request delivered
        else if (
          foodRequest.status === 'pickup' &&
          updateOrderStatus.status === 'delivered' &&
          foodRequest.volunteer_id.toString() === userId
        ) {
          const updateData = {
            status: 'delivered',
            deliver_time: new Date(),
            $unset: {
              duration: 1,
              delete_time: 1,
            },
          };

          await this.foodRequestModel
            .updateOne({ _id: foodRequest._id }, updateData)
            .lean();

          const requestData = await this.commonService.getFoodRequest(
            foodRequest._id,
          );
          const updateData2 = {
            '{{refId}}': requestData.reference_id,
            '{{volunteer_name}}': requestData.volunteer_accept.user_name,
          };
          const request_delived = await this.commonService.changeString(
            mConfig.noti_msg_food_delivered,
            updateData2,
          );
          // send notification to user
          const removeNotiIds = [requestData.user_id];
          const input = {
            message: request_delived,
            title: mConfig.noti_title_request_delivered,
            type: 'food',
            requestId: requestData._id,
            categorySlug: requestData.category_slug,
            requestUserId: requestData.user_id,
            userId: requestData.user_id,
          };
          //send notification to user
          if (
            requestData.user_id.toString() !==
            requestData.volunteer_id.toString()
          ) {
            removeNotiIds.push(requestData.user_id);
            this.commonService.notification(input);
          }
          //send notification to trustee of user ngo
          if (requestData.user_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              requestData.user_ngo_id,
              requestData.user_id,
            );
            if (notiId) {
              if (notiId.toString() !== requestData.volunteer_id.toString()) {
                const ngo_request_delived =
                  await this.commonService.changeString(
                    mConfig.noti_msg_ngo_food_delivered,
                    updateData2,
                  );
                input.message = ngo_request_delived;
                input.userId = notiId;
                removeNotiIds.push(notiId);
                this.commonService.notification(input);
              }
            }
          }
          const request_delivered = await this.commonService.changeString(
            mConfig.noti_msg_volunteer_food_delivered,
            updateData2,
          );
          //send notification to trustee of donor ngo
          if (requestData.donor_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              requestData.donor_ngo_id,
              requestData.donor_id,
            );
            if (
              notiId &&
              !removeNotiIds
                .map((s) => s.toString())
                .includes(notiId.toString())
            ) {
              if (notiId.toString() !== requestData.volunteer_id.toString()) {
                input.message = request_delivered;
                input.userId = notiId;
                removeNotiIds.push(notiId);
                this.commonService.notification(input);
              }
            }
          }
          //send notification to donor
          if (
            !removeNotiIds
              .map((s) => s.toString())
              .includes(requestData.donor_id.toString())
          ) {
            if (
              requestData.donor_id.toString() !==
              requestData.volunteer_id.toString()
            ) {
              input.message = request_delivered;
              input.userId = requestData.donor_id;
              removeNotiIds.push(requestData.donor_id);
              this.commonService.notification(input);
            }
          }
          //send notification to trustee of volunteer ngo
          if (requestData.volunteer_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              requestData.volunteer_ngo_id,
              requestData.volunteer_id,
            );
            if (
              notiId &&
              !removeNotiIds
                .map((s) => s.toString())
                .includes(notiId.toString())
            ) {
              if (notiId.toString() !== requestData.volunteer_id.toString()) {
                input.message = request_delivered;
                input.userId = notiId;
                removeNotiIds.push(notiId);
                this.commonService.notification(input);
              }
            }
          }

          return res.json({
            message: mConfig.Request_delivered,
            success: true,
            data: requestData,
          });
        } else {
          return res.json({
            message: mConfig.Request_status_changed,
            success: false,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-updateOrderStatus',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for cancel food request
  public async cancelRequest(
    id: string,
    cancelRequest: CancelRequest,
    res: any,
  ): Promise<Request> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        cancelRequest,
      );

      const userDetail = this.request.user;
      const userId = userDetail._id.toString();
      const requestDetail = await this.foodRequestModel
        .findOne({ _id: ObjectID(id) })
        .lean();

      if (!requestDetail) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        if (
          (requestDetail.status == 'pending' &&
            requestDetail.user_id == userId) ||
          ((requestDetail.status == 'donor_accept' ||
            requestDetail.status === 'waiting_for_volunteer') &&
            (requestDetail.user_id == userId ||
              requestDetail.donor_id == userId)) ||
          (requestDetail.status == 'volunteer_accept' &&
            (requestDetail.user_id == userId ||
              requestDetail.donor_id == userId ||
              requestDetail.volunteer_id == userId)) ||
          (requestDetail.status == 'pickup' &&
            (requestDetail.user_id == userId ||
              requestDetail.volunteer_id == userId))
        ) {
          let cancelledBy;
          if (requestDetail.user_id == userId) {
            cancelledBy = 'requestor';
          } else if (requestDetail.donor_id == userId) {
            // cancelledBy = 'donor';
            cancelledBy = requestDetail.donor_accept
              ? requestDetail.donor_accept.user_name
              : 'donor';
          } else if (requestDetail.volunteer_id == userId) {
            cancelledBy = 'volunteer';
          }

          const uname = userDetail.display_name
            ? userDetail.display_name
            : userDetail.first_name + ' ' + userDetail.last_name;
          const removeUsers = [];
          const input: any = {
            title: mConfig.noti_title_request_cancel,
            type: 'food',
            requestId: requestDetail._id,
            categorySlug: requestDetail.category_slug,
            requestUserId: requestDetail.user_id,
          };
          let expiretime: any = '';
          const deleteTime = await this.queueService.getSetting(
            'request-delete-time',
          );
          if (!_.isEmpty(deleteTime)) {
            expiretime = new Date(moment().add(deleteTime, 'hours').format());
          }
          const updateData1 = {
            '{{cancelledBy}}': cancelledBy,
            '{{refId}}': requestDetail.reference_id,
            '{{cancelReason}}': cancelRequest.reason,
          };
          const updateStatus: any = {
            $set: {
              status: 'cancelled',
              delete_time: expiretime ? expiretime : new Date(),
              cancelled_at: new Date(),
              cancellation_reason: cancelRequest.reason,
              cancelled_by: cancelledBy,
            },
          };
          if (requestDetail.status === 'pending') {
            updateStatus.$set.donor_id = null;
            updateStatus.$set.ngo_donor_ids = null;
            //SEND NOTIFICATION TO USER
            input.userId = requestDetail.user_id;
            const msg = await this.commonService.changeString(
              mConfig.noti_msg_request_cancel_by_me,
              {
                '{{refId}}': requestDetail.reference_id,
                '{{cancelReason}}': cancelRequest.reason,
              },
            );
            input.message = msg;
            this.commonService.notification(input);
            removeUsers.push(requestDetail.user_id);

            //SEND NOTIFICATION TO TRUSTEE OF USER NGO
            if (requestDetail && requestDetail.user_ngo_id) {
              const notiId = await this.commonService.getNgoUserIds(
                requestDetail.user_ngo_id,
                requestDetail.user_id,
              );
              if (notiId) {
                const ngo_request_cancel =
                  await this.commonService.changeString(
                    mConfig.noti_msg_ngo_request_cancelled,
                    updateData1,
                  );
                input.message = ngo_request_cancel;
                input.userId = notiId;
                removeUsers.push(notiId);
                this.commonService.notification(input);
              }
            }

            //SEND NOTIFICATION TO ALL DONORS
            const finalDonors = requestDetail?.donor_id.map((x) =>
              x.toString(),
            );
            const finalNgoDonors = requestDetail?.ngo_donor_ids.map((x) =>
              x.toString(),
            );
            const findDonorIds = [
              ...new Set([...finalDonors, ...finalNgoDonors]),
            ];
            const userIds = await this.commonService.removeIdFromArray(
              findDonorIds,
              removeUsers,
            );

            const request_cancel = await this.commonService.changeString(
              mConfig.noti_msg_food_req_cancel,
              updateData1,
            );
            input.message = request_cancel;
            this.commonService.sendAllNotification(userIds, input);
          } else if (
            requestDetail.status === 'donor_accept' ||
            requestDetail.status === 'waiting_for_volunteer'
          ) {
            await this.foodRequestModel.updateOne(
              { _id: requestDetail.id },
              { $unset: { noVolunteer: 1 } },
            );
            //SEND NOTIFICATION TO USER
            if (requestDetail.user_id == userId) {
              const msg = await this.commonService.changeString(
                mConfig.noti_msg_request_cancel_by_me,
                {
                  '{{refId}}': requestDetail.reference_id,
                  '{{cancelReason}}': cancelRequest.reason,
                },
              );
              input.message = msg;
            } else if (requestDetail.donor_id == userId) {
              const msg = await this.commonService.changeString(
                mConfig.noti_msg_request_has_been_cancel,
                updateData1,
              );
              input.message = msg;
            }
            input.userId = requestDetail.user_id;
            removeUsers.push(requestDetail.user_id);
            await this.commonService.notification(input);

            //SEND NOTIFICATION TO TRUSTEE OF USER NGO
            if (requestDetail.user_ngo_id) {
              const ngoUser = await this.commonService.getNgoUserIds(
                requestDetail.user_ngo_id,
                requestDetail.user_id,
              );
              if (ngoUser) {
                const ngo_request_cancel =
                  await this.commonService.changeString(
                    mConfig.noti_msg_ngo_request_cancelled,
                    updateData1,
                  );
                input.message = ngo_request_cancel;
                input.userId = ngoUser;
                this.commonService.notification(input);
                removeUsers.push(ngoUser);
              }
            }

            //SEND NOTIFICATION TO TRUSTEE OF DONOR NGO
            if (requestDetail.donor_ngo_id) {
              const ngoUser = await this.commonService.getNgoUserIds(
                requestDetail.donor_ngo_id,
                requestDetail.donor_id,
              );
              if (
                ngoUser &&
                !removeUsers
                  .map((s) => s.toString())
                  .includes(ngoUser.toString())
              ) {
                const ngo_request_cancel =
                  await this.commonService.changeString(
                    mConfig.noti_msg_accept_request_cancel_ngo,
                    updateData1,
                  );
                input.message = ngo_request_cancel;
                input.userId = ngoUser;
                this.commonService.notification(input);
                removeUsers.push(ngoUser);
              }
            }
            //SEND NOTIFICATION TO DONOR
            if (
              !removeUsers
                .map((s) => s.toString())
                .includes(requestDetail.donor_id.toString())
            ) {
              if (requestDetail.donor_id == userId) {
                const request_cancel = await this.commonService.changeString(
                  mConfig.noti_msg_accept_request_cancel_by_me,
                  updateData1,
                );
                input.message = request_cancel;
              } else {
                const request_cancel = await this.commonService.changeString(
                  mConfig.noti_msg_accept_request_cancel,
                  updateData1,
                );
                input.message = request_cancel;
              }
              input.userId = requestDetail.donor_id;
              removeUsers.push(requestDetail.donor_id);
              await this.commonService.notification(input);
            }

            if (requestDetail.status === 'waiting_for_volunteer') {
              updateStatus.$set.volunteer_id = null;
              updateStatus.$set.ngo_volunteer_ids = null;
              //SEND NOTIFICATION TO ALL VOLUNTEERS
              const request_cancel = await this.commonService.changeString(
                mConfig.noti_msg_food_req_cancel,
                updateData1,
              );
              input.message = request_cancel;
              if (requestDetail.volunteer_id) {
                const finalVolunteers = requestDetail?.volunteer_id.map((x) =>
                  x.toString(),
                );
                const finalNgoVolunteers = requestDetail?.ngo_volunteer_ids.map(
                  (x) => x.toString(),
                );
                const findVolunteerIds = [
                  ...new Set([...finalVolunteers, ...finalNgoVolunteers]),
                ];
                const userIds = await this.commonService.removeIdFromArray(
                  findVolunteerIds,
                  removeUsers,
                );

                this.commonService.sendAllNotification(userIds, input);
              }
            }
          } else if (
            requestDetail.status === 'volunteer_accept' ||
            requestDetail.status === 'pickup'
          ) {
            //SEND NOTIFICATION TO USER
            if (requestDetail.user_id == userId) {
              const msg = await this.commonService.changeString(
                mConfig.noti_msg_request_cancel_by_me,
                {
                  '{{refId}}': requestDetail.reference_id,
                  '{{cancelReason}}': cancelRequest.reason,
                },
              );
              input.message = msg;
            } else {
              const request_cancel = await this.commonService.changeString(
                mConfig.noti_msg_request_has_been_cancel,
                updateData1,
              );
              input.message = request_cancel;
            }
            input.userId = requestDetail.user_id;
            removeUsers.push(requestDetail.user_id);
            this.commonService.notification(input);

            //SEND NOTIFICATION TO TRUSTEE OF USER NGO
            if (requestDetail.user_ngo_id) {
              const ngoUsers = await this.commonService.getNgoUserIds(
                requestDetail.user_ngo_id,
                requestDetail.user_id,
              );
              if (ngoUsers) {
                const request_cancel = await this.commonService.changeString(
                  mConfig.noti_msg_ngo_request_cancelled,
                  updateData1,
                );
                input.userId = ngoUsers;
                input.message = request_cancel;
                this.commonService.notification(input);
                removeUsers.push(ngoUsers);
              }
            }

            //SEND NOTIFICATION TO TRUSTEE OF DONOR NGO
            if (requestDetail.donor_ngo_id) {
              const ngoUsers = await this.commonService.getNgoUserIds(
                requestDetail.donor_ngo_id,
                requestDetail.donor_id,
              );
              if (
                ngoUsers &&
                !removeUsers
                  .map((s) => s.toString())
                  .includes(ngoUsers.toString())
              ) {
                const request_cancel = await this.commonService.changeString(
                  mConfig.noti_msg_accept_request_cancel_ngo,
                  updateData1,
                );
                input.userId = ngoUsers;
                input.message = request_cancel;
                this.commonService.notification(input);
                removeUsers.push(ngoUsers);
              }
            }

            //SEND NOTIFICATION TO DONOR
            if (
              !removeUsers
                .map((s) => s.toString())
                .includes(requestDetail.donor_id.toString())
            ) {
              if (requestDetail.donor_id == userId) {
                const request_cancel = await this.commonService.changeString(
                  mConfig.noti_msg_accept_request_cancel_by_me,
                  updateData1,
                );
                input.message = request_cancel;
              } else {
                const request_cancel = await this.commonService.changeString(
                  mConfig.noti_msg_accept_request_cancel,
                  updateData1,
                );
                input.message = request_cancel;
              }
              input.userId = requestDetail.donor_id;
              this.commonService.notification(input);
            }

            //SEND NOTIFICATION TO TRUSTEE OF VOLUNTEER NGO
            if (requestDetail.volunteer_ngo_id) {
              const ngoUsers = await this.commonService.getNgoUserIds(
                requestDetail.volunteer_ngo_id,
                requestDetail.volunteer_id,
              );
              if (
                ngoUsers &&
                !removeUsers
                  .map((s) => s.toString())
                  .includes(ngoUsers.toString())
              ) {
                const request_cancel = await this.commonService.changeString(
                  mConfig.noti_msg_accept_request_cancel_ngo,
                  updateData1,
                );
                input.userId = ngoUsers;
                input.message = request_cancel;
                this.commonService.notification(input);
                removeUsers.push(ngoUsers);
              }
            }

            //SEND NOTIFICATION TO volunteer
            if (
              !removeUsers
                .map((s) => s.toString())
                .includes(requestDetail.volunteer_id.toString())
            ) {
              if (requestDetail.volunteer_id == userId) {
                const request_cancel = await this.commonService.changeString(
                  mConfig.noti_msg_accept_request_cancel_by_me,
                  updateData1,
                );
                input.message = request_cancel;
              } else {
                const request_cancel = await this.commonService.changeString(
                  mConfig.noti_msg_accept_request_cancel,
                  updateData1,
                );
                input.message = request_cancel;
              }
              input.userId = requestDetail.donor_id;
              this.commonService.notification(input);
            }
          }

          await this.foodRequestModel
            .updateOne({ _id: ObjectID(id) }, updateStatus)
            .lean();

          const requestData = await this.commonService.getFoodRequest(id);

          res.json({
            success: true,
            data: requestData,
          });
        } else {
          return res.json({
            message: mConfig.Request_status_changed,
            success: false,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-cancelRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for add Food preparing time in request
  public async addFoodPrepareTime(id, prepareFood: PrepareFood, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        prepareFood,
      );

      const foodRequest = await this.foodRequestModel
        .findOne({ _id: ObjectID(id) })
        .lean();

      if (!foodRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const userDetail = this.request.user;
        if (
          foodRequest.status == 'donor_accept' &&
          foodRequest.donor_id.toString() === userDetail._id.toString()
        ) {
          const updateData: any = {
            $set: {
              prepare_time: prepareFood.prepare_time,
            },
          };

          await this.foodRequestModel
            .updateOne({ _id: foodRequest._id }, updateData)
            .lean();

          const requestData = await this.commonService.getFoodRequest(
            foodRequest._id,
          );
          const updateData1 = {
            '{{donor_name}}': requestData.donor_accept.user_name,
            '{{prepare_time}}': requestData.prepare_time,
            '{{refId}}': requestData.reference_id,
          };
          const prepare_time = await this.commonService.changeString(
            mConfig.noti_msg_prepare_time,
            updateData1,
          );
          const removeNotiIds = [requestData.user_id];
          //send notification to user
          const input: any = {
            message: prepare_time,
            title: mConfig.noti_title_prepare_time,
            type: 'food',
            requestId: requestData._id,
            categorySlug: requestData.category_slug,
            requestUserId: requestData.user_id,
          };
          if (
            requestData.user_id.toString() !== requestData.donor_id.toString()
          ) {
            input.userId = requestData.user_id;
            this.commonService.notification(input);
          }

          //send notification to another trustee of user ngo
          if (requestData && requestData.user_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              requestData.user_ngo_id,
              requestData.user_id,
            );
            if (
              notiId &&
              notiId.toString() !== requestData.donor_id.toString()
            ) {
              const need_prepare_time = await this.commonService.changeString(
                mConfig.noti_msg_need_prepare_time,
                updateData1,
              );
              input.message = need_prepare_time;
              input.userId = notiId;
              removeNotiIds.push(notiId);
              this.commonService.notification(input);
            }
          }

          //send notification to another trustee of donor ngo
          if (requestData && requestData.donor_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              requestData.donor_ngo_id,
              requestData.donor_id,
            );
            if (
              notiId &&
              !removeNotiIds
                .map((s) => s.toString())
                .includes(notiId.toString())
            ) {
              const added_prepare_time = await this.commonService.changeString(
                mConfig.noti_msg_added_prepare_time,
                updateData1,
              );
              input.message = added_prepare_time;
              input.userId = notiId;
              this.commonService.notification(input);
            }
          }

          return res.json({
            success: true,
            data: requestData,
          });
        } else {
          return res.json({
            success: false,
            message: mConfig.You_are_not_donor_of_this_request,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-addFoodPrepareTime',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Function to get record of queue data
  async getQueueData(requestId, isDonor = true) {
    try {
      const query = {
        request_id: requestId,
        users: { $exists: true },
        type: 'donor',
      };
      if (!isDonor) {
        query.type = 'volunteer';
      }
      const data = await this.queueModel.findOne(query).lean();
      let resp: any = [];
      if (!_.isEmpty(data)) {
        resp = data;
      }
      return resp;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-getQueueData',
      );
      return [];
    }
  }

  //Api for verify Fundraiser request in admin
  public async verifyFundraiser(
    reqId: string,
    verifyFundraiserDto: VerifyFundraiserDto,
    res: any,
  ): Promise<RequestDocument> {
    try {
      let notiMsg;

      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        verifyFundraiserDto,
      );

      const updateData: any = {
        $set: {
          status: verifyFundraiserDto.status,
        },
      };

      const request: any = await this.causeRequestModel
        .findById({ _id: ObjectID(reqId) })
        .select({
          _id: 1,
          user_ngo_id: 1,
          user_id: 1,
          category_name: 1,
          reference_id: 1,
          category_slug: 1,
          country_data: 1,
          form_data: {
            not_listed: 1,
            saayam_supported_name: 1,
            location: 1,
            reference_phone_number: 1,
            specify_name: 1,
          },
          form_settings: 1,
        })
        .lean();
      if (!_.isEmpty(request)) {
        let requestUserIds = [];
        if (request.user_ngo_id) {
          requestUserIds = await this.commonService.getNgoUserIds(
            request.user_ngo_id,
          );
        } else {
          requestUserIds.push(request.user_id);
        }

        if (verifyFundraiserDto.status == 'approve') {
          updateData['$set']['approve_time'] = new Date();

          if (verifyFundraiserDto.is_urgent) {
            updateData['$set']['form_data.urgent_help'] = true;
            updateData['$set']['form_data.urgent_help_status'] =
              verifyFundraiserDto.status;
          } else {
            updateData['$set']['form_data.urgent_help'] = false;
            updateData['$unset'] = { 'form_data.urgent_help_status': 1 };
          }

          const formSetting = await this.commonService.updateFormSettingData(
            'urgent_help',
            verifyFundraiserDto.is_urgent ? true : false,
            request.form_settings,
          );
          updateData['$set']['form_settings'] = formSetting;

          const updateData1 = {
            '{{category}}': request.category_name,
            '{{refId}}': request.reference_id,
          };
          const noti_msg = await this.commonService.changeString(
            mConfig.noti_msg_request_arrive,
            updateData1,
          );
          //send Notification to all user for new request arrive
          const allInput = {
            message: noti_msg,
            title: mConfig.noti_title_request_arrive,
            type: request.category_slug,
            categorySlug: request.category_slug,
            requestUserId: request.user_id,
            requestId: request._id,
          };

          this.commonService.sendAllUsersNotification(
            requestUserIds,
            allInput,
            request.country_data.country,
          );
          notiMsg = mConfig.noti_msg_request_approved;
        } else if (verifyFundraiserDto.status == 'reject') {
          updateData['$set']['reject_reason'] =
            verifyFundraiserDto.reject_reason;
          updateData['$set']['reject_time'] = new Date();
          updateData.allow_edit_request = verifyFundraiserDto.allow_edit_request
            ? verifyFundraiserDto.allow_edit_request
            : false;

          notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_reason,
            { '{{reason}}': verifyFundraiserDto.reject_reason },
          );
        }
        await this.causeRequestModel.findByIdAndUpdate(
          { _id: ObjectID(reqId) },
          updateData,
        );

        const status =
          verifyFundraiserDto.status === 'approve'
            ? 'approved'
            : verifyFundraiserDto.status === 'reject'
            ? 'rejected'
            : verifyFundraiserDto.status;
        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_request_verify,
          {
            '{{category}}': request.category_name,
            '{{refId}}': request.reference_id,
            '{{status}}': status,
          },
        );
        //send notification to user_id
        const input: any = {
          title: notiTitle,
          type: request.category_slug,
          requestId: request._id,
          categorySlug: request.category_slug,
          requestUserId: request.user_id,
          message: notiMsg,
        };
        this.commonService.sendAllNotification(requestUserIds, input);

        //Add Activity Log
        const logData = {
          action: 'verify',
          request_id: request._id,
          entity_name: `Verify ${request.category_name} Request`,
          description: `${request.category_name} request has been ${status} - ${request.reference_id}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message:
            verifyFundraiserDto.status === 'approve'
              ? mConfig.Request_approved
              : verifyFundraiserDto.status === 'reject'
              ? mConfig.Request_rejected
              : mConfig.Request_verified,
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
        'src/controller/request/request.service.ts-verifyFundraiser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for verify Fundraiser request in admin
  public async reportBenificiary(id: string, description: string, res: any) {
    try {
      const userDetail = this.request.user;
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        description,
      );

      const userId = userDetail._id;
      const uname = userDetail.display_name
        ? userDetail.display_name
        : userDetail.first_name + ' ' + userDetail.last_name;
      const causeRequest: any = await this.causeRequestModel
        .findById({ _id: id })
        .lean();
      if (!causeRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const addData: any = {
          user_id: userId,
          user_name: uname,
          description,
          added_time: new Date(),
        };
        await this.causeRequestModel
          .findByIdAndUpdate(
            { _id: causeRequest._id },
            { $push: { report_benificiary: addData } },
          )
          .lean();
        const updateData1 = {
          '{{uname}}': uname,
          '{{refId}}': causeRequest.reference_id,
        };
        const reportTitle = await this.commonService.changeString(
          mConfig.noti_title_report,
          updateData1,
        );
        const reportMsg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': description },
        );

        //send notification to user_id
        const input: any = {
          title: reportTitle,
          type: causeRequest.category_slug,
          requestId: causeRequest._id,
          categorySlug: causeRequest.category_slug,
          message: reportMsg,
        };
        this.commonService.sendAdminNotification(input);

        const data = await this.commonService.getFoodRequest(causeRequest._id);
        return res.json({
          message: mConfig.Reported_successfully,
          data,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-reportBenificiary',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for featured list
  public async featureList(res: any): Promise<CauseRequestDocument> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', '');

      const category = await this.categoryModel.find().lean();
      const data = [];
      const userDetail = this.request.user;
      await Promise.all(
        category.map(async (item: any) => {
          const query = {
            category_slug: item.category_slug,
            $or: [
              {
                $or: [
                  { user_ngo_id: userDetail?.ngo_data?._id },
                  { user_id: userDetail._id },
                ],
                is_featured: { $eq: true, $exists: true },
                status: 'approve',
              },
              {
                is_featured: { $eq: true, $exists: true },
                status: 'approve',
                'country_data.country': userDetail.country_data.country,
              },
            ],
          };
          const sort: any = {
            createdAt: -1,
          };
          const getData = await this.commonService.getAllRequestListWithUrl(
            query,
            sort,
            0,
            5,
          );
          item.category_slug = item.category_slug.replace('-', '_');
          data.push({ [item.category_slug]: getData });
        }),
      );

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-featureList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for view all donation transaction receipt of user
  public async receiptList(id, params, res: any): Promise<TransactionModel[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'get',
        params,
      );

      if (!params.transaction_type) {
        return res.json({
          success: false,
          message: mConfig.Params_are_missing,
        });
      }
      const query: any = {
        donor_id: {
          $in: [this.request.user._id, this.request.user?.ngo_data?._id],
        },
        transaction_type: params.transaction_type,
        saayam_community: { $exists: false },
      };
      if (params.transaction_type === 'donation') {
        query['$or'] = [{ request_id: ObjectID(id) }, { _id: ObjectID(id) }];
      } else if (params.transaction_type === 'ngo-donation') {
        query['$or'] = [{ user_id: ObjectID(id) }, { _id: ObjectID(id) }];
      } else if (params.transaction_type === 'fund-donated') {
        query['$or'] = [{ to_fund_id: ObjectID(id) }, { _id: ObjectID(id) }];
      }
      const data: any = await this.transactionModel
        .find(query, {
          _id: 1,
          currency: 1,
          amount: 1,
          tip_charge: 1,
          tip_amount: 1,
          transaction_charge: 1,
          transaction_amount: 1,
          total_amount: 1,
          createdAt: 1,
          user_name: 1,
          receipt_number: 1,
          tax_number: 1,
          note: 1,
          manage_fees: 1,
          campaign_name: 1,
          transaction_type: 1,
          request_id: 1,
          country_data: 1,
        })
        .sort({ _id: -1 });

      if (!_.isEmpty(data)) {
        const receipt = await this.commonService.getDownloadTemplate(
          data.transaction_type,
        );
        if (!_.isEmpty(receipt)) {
          data.download = true;
        } else {
          data.download = false;
        }
      }

      return res.json({
        data,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-receiptList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for my donation list, active donation list
  public async myDonationsList(param, res: any): Promise<CauseRequestModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
      let sortList: any = { _id: -1 };
      const userDetail = this.request.user;

      await this.userTokenModel
        .updateOne(
          { user_id: userDetail._id, access_token: userDetail.access_token },
          {
            expiry_date: new Date(new Date().setDate(new Date().getDate() + 7)),
          },
        )
        .lean();

      let includeBlocked = true;

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
                      {
                        $in: [
                          '$donor_id',
                          [
                            ObjectID(userDetail._id),
                            ObjectID(userDetail?.ngo_data?._id),
                          ],
                        ],
                      },
                      {
                        $or: [
                          { eventCode: 'AUTHORISATION', success: true },
                          { eventCode: 'Authorised' },
                          { status: 'complete' },
                          { status: 'completed' },
                        ],
                      },
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
                        $eq: ['$user_id', ObjectID(userDetail._id)],
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
      ];
      let match: any = {
        tData: { $ne: [] },
      };

      const unwind = [
        {
          $unwind: {
            path: '$tData',
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
      ];

      const group = {
        $group: {
          _id: '$_id',
          request_data: { $first: '$$ROOT' },
          ngoDatas: { $first: '$ngoData' },
          transaction: { $last: '$tData' },
          bookmarkData: { $first: '$bookmarkData' },
          donationCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$tData.donor_id', ObjectID(userDetail?._id)] },
                    {
                      $eq: [
                        '$tData.donor_id',
                        ObjectID(userDetail?.ngo_data?._id),
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          myDonation: {
            $sum: {
              $cond: {
                if: { $eq: ['$tData.donor_id', ObjectID(userDetail?._id)] },
                then: '$tData.converted_amt',
                else: 0,
              },
            },
          },
          ngoDonation: {
            $sum: {
              $cond: {
                if: {
                  $eq: ['$tData.donor_id', ObjectID(userDetail?.ngo_data?._id)],
                },
                then: '$tData.converted_amt',
                else: 0,
              },
            },
          },
        },
      };

      //filter for active donations list
      if (
        param.filter &&
        !_.isUndefined(param.filter) &&
        param.filter === 'active_donation'
      ) {
        includeBlocked = false;
        const date = new Date(moment().startOf('minute').format());
        match = {
          'form_data.expiry_date': { $exists: true, $gte: date },
          tData: { $ne: [] },
          status: 'approve',
          is_deleted: { $ne: true },
        };
        sortList = {
          community_sort: 1,
          'form_data.expiry_date': 1,
        };
      }

      //Filter requests category wise
      if (!_.isUndefined(param.category_slug) && param.category_slug) {
        match['category_slug'] = {
          $in: param.category_slug,
        };
      }

      //Filter for find near by fundraiser requests
      let geoNear = [];
      if (
        !_.isUndefined(param.user_lat) &&
        param.user_lat != '' &&
        !_.isUndefined(param.user_long) &&
        param.user_long != ''
      ) {
        const maximumRadius = await this.queueService.getSetting(
          'maximum-radius',
        );

        const maximumRadInMeter = !_.isUndefined(param.maximum_radius)
          ? Number(param.maximum_radius)
          : maximumRadius;

        const latitude = Number(param.user_lat) || 0;
        const longitude = Number(param.user_long) || 0;
        geoNear = [
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [longitude, latitude],
              },
              distanceField: 'distance',
              distanceMultiplier: 0.001,
              key: 'location',
              maxDistance: maximumRadInMeter * 1000,
              minDistance: 0,
              spherical: true,
            },
          },
        ];
      }

      //Filter for find urgent requests
      if (!_.isUndefined(param.is_urgent) && param.is_urgent == 'true') {
        match['form_data.urgent_help_status'] = 'approve';
      }

      //Filter for find requests which remain amount between selected amount
      if (
        !_.isUndefined(param.remaining_amt_from) &&
        param.remaining_amt_from !== '' &&
        !_.isUndefined(param.remaining_amt_to) &&
        param.remaining_amt_to !== ''
      ) {
        match['form_data.remaining_amount'] = {
          $gte: Number(param.remaining_amt_from),
          $lte: Number(param.remaining_amt_to),
        };
      }

      //Find requests which are expiring soon
      if (
        !_.isUndefined(param.fundraiser_closing_soon) &&
        param.fundraiser_closing_soon == 'true'
      ) {
        const closingInDays = await this.queueService.getSetting(
          'fundraiser-closing-soon-in-days',
        );

        const closingDate = moment()
          .tz('UTC')
          .add(closingInDays, 'd')
          .endOf('day')
          .toISOString();
        match['form_data.expiry_date'] = {
          $gte: new Date(),
          $lte: new Date(closingDate),
        };
      }

      const total = await this.requestModel.aggregate([
        ...geoNear,
        ...lookup,
        { $match: match },
        ...unwind,
        {
          $group: {
            _id: '$_id',
            ngoDatas: { $first: '$ngoData' },
          },
        },
        {
          $project: {
            _id: '$request_data._id',
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
          },
        },
        {
          $unwind: {
            path: '$ngo_Data',
            preserveNullAndEmptyArrays: includeBlocked,
          },
        },
        { $count: 'count' },
      ]);

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
        null,
        param.sort_type,
        param.sort,
      );

      const data = await this.requestModel.aggregate([
        ...geoNear,
        ...lookup,
        { $match: match },
        ...unwind,
        group,
        {
          $project: {
            _id: '$request_data._id',
            distance: '$request_data.distance',
            transaction_id: '$transaction._id',
            reference_id: '$request_data.reference_id',
            category_slug: '$request_data.category_slug',
            category_name: '$request_data.category_name',
            active_type: '$request_data.active_type',
            form_data: '$request_data.form_data',
            total_donors: '$request_data.total_donors',
            allow_edit_request: '$request_data.allow_edit_request',
            allow_for_reverify: '$request_data.allow_for_reverify',
            donationCount: 1,
            myDonation: 1,
            ngoDonation: 1,
            status: '$request_data.status',
            user_image: {
              $ifNull: [
                {
                  $concat: [
                    authConfig.imageUrl,
                    'user/',
                    '$request_data.user_image',
                  ],
                },
                null,
              ],
            },
            title_of_fundraiser: '$request_data.form_data.title_of_fundraiser',
            createdAt: '$request_data.createdAt',
            avg_donation: '$request_data.avg_donation',
            country_data: '$request_data.country_data',
            approve_time: '$request_data.approve_time',
            total_donation: '$request_data.total_donation',
            uname: '$request_data.uname',
            user_id: '$request_data.user_id',
            hasDonation: 1,
            is_featured: '$request_data.is_featured',
            plan_expired_date: '$request_data.plan_expired_date',
            bank_id: '$request_data.bank_id',
            image_url: authConfig.imageUrl + 'request/',
            comment_enabled: '$request_data.comment_enabled',
            ngo_status: '$ngoDatas.ngo_status',
            is_deleted: '$request_data.is_deleted',
            disaster_links: '$request_data.disaster_links',
            add_location_for_food_donation:
              '$request_data.add_location_for_food_donation',
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
                input: '$request_data.form_data.files.upload_cover_photo',
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
            is_bookmark: {
              $cond: {
                if: { $gt: ['$bookmarkData', null] },
                then: true,
                else: false,
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
          },
        },
        {
          $unwind: {
            path: '$ngo_Data',
            preserveNullAndEmptyArrays: includeBlocked,
          },
        },
        { $sort: sortList },
        { $skip: start_from },
        { $limit: per_page },
      ]);

      return res.json({
        data,
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
        'src/controller/request/request.service.ts-myDonationsList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for  my fundraiser list
  public async fundraiserList(param, res: any): Promise<CauseRequestModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const userId = this.request.user._id;
      const userNgoId = this.request.user.ngo_data._id;

      const query = {
        $or: [
          { user_ngo_id: ObjectID(userNgoId) },
          { user_id: ObjectID(userId) },
        ],
        category_slug: 'fundraiser',
        'form_data.expiry_date': { $gte: new Date() },
      };

      const sortData = ['_id'];
      const total_record = await this.causeRequestModel.count(query).lean();

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

      const data = await this.commonService.getAllRequestListWithUrl(
        query,
        sort,
        start_from,
        per_page,
      );
      return res.json({
        data,
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
        'src/controller/request/request.service.ts-fundraiserList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Common api for transaction list in app/admin
  public async transactionList(
    id,
    param,
    res: any,
  ): Promise<TransactionModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      let match: any = {};
      let saayamCommunity = false;
      if (id && !_.isUndefined(id)) {
        match = {
          request_id: ObjectID(id),
          $or: [
            { success: true, eventCode: 'AUTHORISATION' },
            { eventCode: 'Authorised' },
            { status: 'complete' },
            { status: 'completed' },
          ],
          transaction_type: 'donation',
        };
      }

      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : 'is';

        if (
          !_.isUndefined(filter.saayam_community) &&
          filter.saayam_community == 1
        ) {
          saayamCommunity = true;
        }

        if (
          !_.isUndefined(filter.transaction_type) &&
          filter.transaction_type
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.transaction_type,
            'transaction_type',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.country_type) && filter.country_type) {
          let query: any = {};
          if (filter.country_type == 'local') {
            query = { 'country_data.country_code': 'IN' };
          } else {
            query = { 'country_data.country_code': { $ne: 'IN' } };
          }
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
        if (!_.isUndefined(filter._id) && filter._id) {
          const query = await this.commonService.filter(
            'objectId',
            filter._id,
            '_id',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.receipt_number) && filter.receipt_number) {
          const query = await this.commonService.filter(
            operator,
            filter.receipt_number,
            'receipt_number',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.campaign_name) && filter.campaign_name) {
          const query = await this.commonService.filter(
            operator,
            filter.campaign_name,
            'campaign_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.user_name) && filter.user_name) {
          const query = await this.commonService.filter(
            operator,
            filter.user_name,
            'user_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.donor_name) && filter.donor_name) {
          const query = await this.commonService.filter(
            operator,
            filter.donor_name,
            'donor_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.category_name) && filter.category_name) {
          const query = await this.commonService.filter(
            operator,
            filter.category_name,
            'category_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.goal_amount) && filter.goal_amount) {
          const query = await this.commonService.filter(
            '=',
            filter.goal_amount,
            'goal_amount',
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
        if (!_.isUndefined(filter.tip_amount) && filter.tip_amount) {
          const query = await this.commonService.filter(
            '=',
            filter.tip_amount,
            'tip_amount',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.transaction_charge) &&
          filter.transaction_charge
        ) {
          const query = await this.commonService.filter(
            '=',
            filter.transaction_charge,
            'transaction_charge',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.tip_charge) && filter.tip_charge) {
          const query = await this.commonService.filter(
            '=',
            filter.tip_charge,
            'tip_charge',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.total_amount) && filter.total_amount) {
          const query = await this.commonService.filter(
            '=',
            filter.total_amount,
            'total_amount',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.is_contribute_anonymously) &&
          filter.is_contribute_anonymously
        ) {
          const query = await this.commonService.filter(
            'boolean',
            filter.is_contribute_anonymously,
            'is_contribute_anonymously',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.is_tax_benefit) && filter.is_tax_benefit) {
          const query = await this.commonService.filter(
            'boolean',
            filter.is_tax_benefit,
            'is_tax_benefit',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.tax_number) && filter.tax_number) {
          const query = await this.commonService.filter(
            operator,
            filter.tax_number,
            'tax_number',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.paymentMethod) && filter.paymentMethod) {
          const query = await this.commonService.filter(
            operator,
            filter.paymentMethod,
            'paymentMethod',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.country) && filter.country) {
          const query = await this.commonService.filter(
            operator,
            filter.country,
            'country_data.country',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const str_fields = [
            '_id',
            'receipt_number',
            'transaction_type',
            'campaign_name',
            'user_name',
            'donor_name',
            'category_name',
            'tax_number',
            'paymentMethod',
            'country_data.country',
            'createdAt',
          ];
          const num_fields = [
            'goal_amount',
            'amount',
            'tip_amount',
            'transaction_charge',
            'tip_charge',
            'total_amount',
          ];
          const bool_fields = ['is_contribute_anonymously', 'is_tax_benefit'];
          const stringFilter = await this.commonService.getGlobalFilter(
            str_fields,
            filter.search,
          );
          const numFilter = await this.commonService.getNumberFilter(
            num_fields,
            filter.search,
          );
          const boolFilter = await this.commonService.getBooleanFilter(
            bool_fields,
            filter.search,
          );
          query = stringFilter.concat(numFilter);
          query = query.concat(boolFilter);
        }

        if (!_.isUndefined(filter.search) && !_.isEmpty(query)) {
          match['$or'] = query;
        }

        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      if (saayamCommunity) {
        match['saayam_community'] = true;
      } else {
        match['saayam_community'] = { $exists: false };
      }

      const sortData = {
        _id: '_id',
        createdAt: 'createdAt',
        receipt_number: 'receipt_number',
        user_name: 'user_name',
        campaign_name: 'campaign_name',
        donor_name: 'donor_name',
        category_name: 'category_name',
        amount: 'amount',
        tip_amount: 'tip_amount',
        goal_amount: 'goal_amount',
        tip_charge: 'tip_charge',
        transaction_charge: 'transaction_charge',
        total_amount: 'total_amount',
        country: 'country_data.country',
        is_contribute_anonymously: 'is_contribute_anonymously',
        is_tax_benefit: 'is_tax_benefit',
        tax_number: 'tax_number',
        paymentMethod: 'paymentMethod',
      };

      const total = await this.transactionModel
        .aggregate([{ $match: match }, { $count: 'count' }])
        .exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      // param.sort_type = param && param.sort_type ? param.sort_type : 1;
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

      const data = await this.transactionModel.aggregate(
        [
          { $match: match },
          {
            $lookup: {
              from: 'fund',
              localField: 'fund_id',
              foreignField: '_id',
              as: 'fundData',
            },
          },
          {
            $unwind: {
              path: '$fundData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              userData: 1,
              _id: 1,
              converted_total_amt: 1,
              exchange_rate: 1,
              converted_amt: 1,
              amount_usd: 1,
              currency_code: 1,
              campaign_name: 1,
              currency: 1,
              user_name: 1,
              total_amount: 1,
              transaction_charge: 1,
              transaction_amount: 1,
              tip_charge: 1,
              tip_amount: 1,
              tip_included: 1,
              paymentMethod: 1,
              transaction_type: 1,
              is_donor_ngo: 1,
              is_user_ngo: 1,
              receipt_number: 1,
              note: 1,
              tax_number: 1,
              is_tax_benefit: 1,
              is_contribute_anonymously: 1,
              goal_amount: 1,
              amount: 1,
              category_name: 1,
              request_id: 1,
              country_data: 1,
              donor_name: 1,
              donor_id: 1,
              createdAt: 1,
              fund_id: 1,
              category_slug: 1,
              fund_name: '$fundData.form_data.title_of_fundraiser',
              fund_reference_id: '$fundData.reference_id',
            },
          },
          { $sort: sort },
          { $skip: start_from },
          { $limit: per_page },
        ],
        { collation: authConfig.collation },
      );

      const allPromise = data.map(async (item) => {
        return new Promise(async (resolve) => {
          const userData = await this.commonService.getTransactionUser(
            item,
            item.donor_id,
            item.is_donor_ngo,
          );
          item.userData = userData;
          resolve(item);
        });
      });
      const result = await Promise.all(allPromise);

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
        'src/controller/request/request.service.ts-transactionList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for ngo donors list
  public async ngoDonorsList(id, param, res: any): Promise<TransactionModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const sortData = ['_id'];
      const query = {
        user_id: ObjectID(id),
        $or: [
          { success: true, eventCode: 'AUTHORISATION' },
          { eventCode: 'Authorised' },
          { status: 'complete' },
          { status: 'completed' },
        ],
        transaction_type: 'ngo-donation',
        saayam_community: { $exists: false },
      };

      const total_record = await this.transactionModel.count(query).lean();
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
      const data: any = await this.transactionModel
        .find(query, { resp: 0 })
        .sort(sort)
        .skip(start_from)
        .limit(per_page)
        .lean();

      const allPromise = data.map(async (item) => {
        return new Promise(async (resolve) => {
          const userData = await this.commonService.getTransactionUser(
            item,
            item.donor_id,
            item.is_donor_ngo,
          );
          item.userData = userData;
          resolve(item);
        });
      });
      const result = await Promise.all(allPromise);

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
        'src/controller/request/request.service.ts-ngoDonorsList',
        id,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get feature payment list for admin
  public async adminFeaturePaymentList(
    param,
    res: any,
  ): Promise<FeatureTransactionModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const sortData = ['_id'];

      const lookup = {
        $lookup: {
          from: 'requests', // collection name in db
          localField: 'request_id',
          foreignField: '_id',
          as: 'causeData',
        },
      };
      const total = await this.featureTransactionModel
        .aggregate([lookup, { $count: 'count' }])
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

      const data = await this.featureTransactionModel.aggregate(
        [
          lookup,
          { $unwind: '$causeData' },
          {
            $project: {
              _id: 1,
              campaign_name: 1,
              paymentMethod: 1,
              transaction_type: 1,
              receipt_number: 1,
              currency: 1,
              amount: 1,
              category_name: 1,
              user_name: 1,
              createdAt: 1,
              plan: 1,
              plan_expired_date: '$causeData.plan_expired_date',
            },
          },
          { $sort: sort },
          { $skip: start_from },
          { $limit: per_page },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        data,
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
        'src/controller/request/request.service.ts-adminFeaturePaymentList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for  get ngo fundraiser requests
  public async fundraiserRequest(
    param,
    res: any,
  ): Promise<CauseRequestModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      let query;
      let sortOrder;
      if (param.type && param.type === 'past') {
        query = {
          category_slug: { $ne: 'hunger' },
          status: { $in: ['complete', 'close'] },
        };
      } else {
        if (param.userType === 'user') {
          query = {
            category_slug: { $ne: 'hunger' },
            status: 'approve',
          };
        } else {
          query = {
            category_slug: { $ne: 'hunger' },
            status: { $in: ['approve', 'complete', 'close'] },
          };
        }
      }

      if (param.userType === 'user' && param.userId) {
        query.user_id = ObjectID(param.userId);
        query.active_type = { $ne: 'ngo' };
        sortOrder = { 'form_data.expiry_date': 1 };
      } else if (param.userType === 'ngo' && param.userId) {
        query.user_ngo_id = ObjectID(param.userId);
        query.active_type = 'ngo';
        sortOrder = { sort: 1, 'form_data.expiry_date': 1 };
      }

      if (param.home_screen && param.home_screen == 1) {
        const result = await this.queueService.getSetting(
          'home-screen-per-page',
        );
        param.per_page = !_.isEmpty(result) ? result : 5;
      }

      const sortData = ['_id'];
      const total_record = await this.causeRequestModel.count(query).lean();

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

      const data = await this.commonService.getAllRequestListWithUrl(
        query,
        sortOrder,
        start_from,
        per_page,
      );

      return res.json({
        data,
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
        'src/controller/request/request.service.ts-fundraiserRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for  my feature transaction list
  public async transactionHistory(
    param,
    res: any,
  ): Promise<FeatureTransactionDocument[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      if (
        !_.includes(['donation', 'ngo-donation', 'fund-donated'], param.type)
      ) {
        return res.json({
          success: false,
          message: mConfig.type_missing,
        });
      }

      const userData = this.request.user;
      let query: any = {
        donor_id: { $in: [userData._id, userData?.ngo_data?._id] },
        // transaction_type: { $in: ['donation', 'ngo-donation', 'fund-donated'] },
        saayam_community: { $exists: false },
        $or: [
          { eventCode: 'AUTHORISATION', success: true },
          { eventCode: 'Authorised' },
          { status: 'complete' },
          { status: 'completed' },
        ],
      };
      let lookup = {};
      let unwind = {};
      let addFields = {};
      if (param.type == 'donation') {
        query.transaction_type = 'donation';
        lookup = {
          $lookup: {
            from: 'requests',
            let: { id: '$request_id', type: '$transaction_type' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$type', 'donation'] },
                      { $eq: ['$$id', '$_id'] },
                    ],
                  },
                },
              },
            ],
            as: 'reqData',
          },
        };
        unwind = {
          $unwind: {
            path: '$reqData',
            preserveNullAndEmptyArrays: true,
          },
        };
        addFields = {
          $addFields: {
            cover_photo: {
              $concat: [
                authConfig.imageUrl,
                'request/',
                {
                  $arrayElemAt: [
                    '$reqData.form_data.files.upload_cover_photo',
                    0,
                  ],
                },
              ],
            },
          },
        };
      } else if (param.type == 'ngo-donation') {
        query.transaction_type = 'ngo-donation';
        lookup = {
          $lookup: {
            from: 'ngo',
            let: { id: '$user_id', type: '$transaction_type' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$type', 'ngo-donation'] },
                      { $eq: ['$$id', '$_id'] },
                    ],
                  },
                },
              },
            ],
            as: 'ngoData',
          },
        };
        unwind = {
          $unwind: {
            path: '$ngoData',
            preserveNullAndEmptyArrays: true,
          },
        };
        addFields = {
          $addFields: {
            cover_photo: {
              $concat: [
                authConfig.imageUrl,
                'ngo/',
                { $toString: '$ngoData._id' },
                '/',
                {
                  $arrayElemAt: ['$ngoData.form_data.files.ngo_cover_photo', 0],
                },
              ],
            },
          },
        };
      } else if (param.type == 'fund-donated') {
        query.transaction_type = 'fund-donated';

        lookup = {
          $lookup: {
            from: 'fund',
            let: { id: '$to_fund_id', type: '$transaction_type' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$type', 'fund-donated'] },
                      { $eq: ['$$id', '$_id'] },
                    ],
                  },
                },
              },
            ],
            as: 'fundData',
          },
        };

        unwind = {
          $unwind: {
            path: '$fundData',
            preserveNullAndEmptyArrays: true,
          },
        };
        addFields = {
          $addFields: {
            cover_photo: {
              $concat: [
                authConfig.imageUrl,
                'fund/',
                { $toString: '$fundData._id' },
                '/',
                {
                  $arrayElemAt: ['$fundData.form_data.files.photos', 0],
                },
              ],
            },
          },
        };
      }

      const total = await this.transactionModel
        .aggregate([{ $match: query }, { $count: 'count' }])
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
        null,
        param.sort_type,
        param.sort,
      );

      const data = await this.transactionModel.aggregate(
        [
          {
            $match: query,
          },
          {
            $addFields: {
              template: {
                $cond: {
                  if: { $eq: ['$transaction_type', 'ngo-donation'] },
                  then: 'ngo-donation-receipt',
                  else: 'single-receipt-template',
                },
              },
            },
          },
          lookup,
          unwind,
          {
            $lookup: {
              from: 'email-templates',
              let: { template: '$template' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$email_slug', '$$template'] },
                        { $eq: ['$email_status', 'Active'] },
                      ],
                    },
                  },
                },
              ],
              as: 'templateData',
            },
          },
          addFields,
          {
            $project: {
              _id: 1,
              plan: 1,
              amount: '$converted_amt',
              tip_amount: 1,
              tip_charge: 1,
              transaction_charge: 1,
              transaction_amount: 1,
              total_amount: 1,
              user_id: 1,
              currency: 1,
              tax_number: 1,
              note: 1,
              manage_fees: 1,
              createdAt: 1,
              request_id: 1,
              category_id: 1,
              category_name: 1,
              receipt_number: 1,
              transaction_type: 1,
              campaign_name: 1,
              country_data: 1,
              cover_photo: 1,
              download: {
                $cond: {
                  if: { $gt: [{ $size: '$templateData' }, 0] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: start_from },
          { $limit: per_page },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        data,
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
        'src/controller/request/request.service.ts-transactionHistory',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete request
  public async deleteRequest(id: string, res: any): Promise<CauseRequestModel> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'delete', id);

      const user = this.request.user;
      const userId = user._id.toString();
      let result: any = await this.causeRequestModel
        .aggregate([
          { $match: { _id: ObjectID(id) } },
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
            $project: {
              _id: 1,
              reference_id: 1,
              category_name: 1,
              category_slug: 1,
              form_data: 1,
              user_id: 1,
              donor_id: 1,
              volunteer_id: 1,
              status: 1,
              country_data: 1,
              user_ngo_id: 1,
              uname: 1,
              total_donation: { $sum: '$tData.converted_amt' },
            },
          },
        ])
        .exec();
      if (_.isEmpty(result) && _.isEmpty(result[0])) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        result = result[0];
        let updateData: any = '';
        let update = true;

        const query = {
          _id: ObjectID(id),
        };
        const query1: any = {
          request_id: ObjectID(id),
        };
        const updateReqData = {
          is_deleted: true,
        };

        if (result.user_id && result.user_id.toString() === userId) {
          //send hide notification to users
          await this.requestModel
            .findByIdAndUpdate(query, updateReqData, {
              new: true,
            })
            .lean();
          if (
            result &&
            result.form_data &&
            result.form_data.files &&
            !_.isEmpty(result.form_data.files)
          ) {
            const files = result.form_data.files;

            if (
              result.form_data.files.video &&
              !_.isEmpty(result.form_data.files.video)
            ) {
              const vidName = result.form_data.files.video;
              await this.reelsModel
                .updateMany({ name: { $in: vidName } }, updateReqData)
                .exec();
              await this.commentModel
                .updateMany(
                  { name: { $in: vidName }, type: 'request' },
                  updateReqData,
                )
                .exec();
            }

            // for (const key in files) {
            //   files[key].map(async (item: any) => {
            //     await this.commonService.s3ImageRemove('request', item);
            //   });
            // }
          }

          update = false;
          if (result.status !== 'draft') {
            await this.adminNotificationModel
              .deleteMany({ request_id: id })
              .lean();

            //this condition is only put when fundraiser request if hunger request then check based on status
            const userIds = await this.userModel
              .find(
                {
                  'country_data.country': result.country_data.country,
                  _id: { $nin: user._id },
                  is_deleted: false,
                  is_guest: { $ne: true },
                },
                { _id: 1 },
              )
              .lean();

            const requestUserIds = [];
            await userIds.map(async (item) => {
              requestUserIds.push(item._id);
            });
            const updateData1 = {
              '{{uname}}': result.uname,
            };
            const delete_request = await this.commonService.changeString(
              mConfig.noti_msg_delete_request,
              updateData1,
            );
            const input: any = {
              title: mConfig.noti_title_request_deleted,
              type: result.category_slug,
              requestId: result._id,
              categorySlug: result.category_slug,
              requestUserId: result.user_id,
              message: delete_request,
            };
            this.commonService.sendAllNotification(requestUserIds, input, true);
            this.commonService.sendAdminNotification(input);

            this.volunteerService.transferRequestFund(result);
          }
        } else if (
          !_.isEmpty(result.donor_id) &&
          Array.isArray(result.donor_id)
        ) {
          //if request is accepted as ngo then need to send noti to trustee of ngo
          if (result.donor_id.map((s) => s.toString()).includes(userId)) {
            query1.user_id = userId;
            updateData = {
              $pull: {
                donor_id: user._id,
              },
            };
          }
        } else if (
          !_.isEmpty(result.volunteer_id) &&
          Array.isArray(result.volunteer_id)
        ) {
          //if request is accepted as ngo then need to send noti to trustee of ngo
          if (result.volunteer_id.map((s) => s.toString()).includes(userId)) {
            query1.user_id = userId;
            updateData = {
              $pull: {
                volunteer_id: user._id,
              },
            };

            if (result.donor_id.toString() === userId) {
              updateData.donor_id = null;
            }
          }
        } else if (
          result.volunteer_id.toString() === userId &&
          result.donor_id.toString() === userId
        ) {
          //then check  donor_ngo_id and voluneer_ngo_id
          query1.user_id = userId;
          updateData = {
            volunteer_id: null,
            donor_id: null,
          };
        } else if (result.donor_id && result.donor_id.toString() === userId) {
          query1.user_id = userId;
          updateData = {
            donor_id: null,
          };
        } else if (
          result?.volunteer_id &&
          result?.volunteer_id.toString() === userId
        ) {
          query1.user_id = userId;
          updateData = {
            volunteer_id: null,
          };
        }
        if (update) {
          await this.requestModel.updateOne(query, updateData);
        }
        await this.notificationModel.deleteMany(query1).exec();

        let message;
        if (result.status !== 'draft') {
          message = mConfig.category_request_deleted_successfully;
        } else {
          message = mConfig.category_draft_deleted;
        }
        const delete_request_msg = await this.commonService.changeString(
          message,
          { '{{category}}': result.category_name },
        );
        return res.json({
          success: true,
          message: delete_request_msg,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-deleteRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async delete(id: string, res: any): Promise<Request> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'put', null);

      const userDetail = this.request.user;
      const userId = userDetail._id.toString();
      const requestDetail = await this.foodRequestModel
        .findOne({ _id: ObjectID(id) })
        .lean();

      if (!requestDetail) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const removeUsers = [];
        const input: any = {
          title: mConfig.noti_title_request_cancel,
          type: 'food',
          requestId: requestDetail._id,
          categorySlug: requestDetail.category_slug,
          requestUserId: requestDetail.user_id,
        };

        const updateData1 = {
          // '{{cancelledBy}}': cancelledBy,
        };
        const updateStatus: any = {
          $set: {
            status: 'cancelled',
            cancelled_at: new Date(),
          },
        };
        if (requestDetail.status === 'pending') {
          //SEND NOTIFICATION TO USER
          input.userId = requestDetail.user_id;
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_request_delete_by_me,
            { '{{refId}}': requestDetail.reference_id },
          );
          input.message = msg;
          this.commonService.notification(input);
          removeUsers.push(requestDetail.user_id);

          //SEND NOTIFICATION TO TRUSTEE OF USER NGO
          if (requestDetail && requestDetail.user_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              requestDetail.user_ngo_id,
              requestDetail.user_id,
            );
            if (notiId) {
              const ngo_request_cancel = await this.commonService.changeString(
                mConfig.noti_msg_ngo_request_delete,
                updateData1,
              );
              input.message = ngo_request_cancel;
              input.userId = notiId;
              removeUsers.push(notiId);
              this.commonService.notification(input);
            }
          }

          //SEND NOTIFICATION TO ALL DONORS
          const userIds = await this.commonService.removeIdFromArray(
            requestDetail.donor_id,
            removeUsers,
          );
          const request_cancel = await this.commonService.changeString(
            mConfig.noti_msg_food_req_cancel,
            updateData1,
          );
          input.message = request_cancel;
          this.commonService.sendAllNotification(userIds, input);
        } else if (
          requestDetail.status === 'donor_accept' ||
          requestDetail.status === 'waiting_for_volunteer'
        ) {
          await this.foodRequestModel.updateOne(
            { _id: requestDetail.id },
            { $unset: { noVolunteer: 1 } },
          );
          //SEND NOTIFICATION TO USER
          if (requestDetail.user_id == userId) {
            input.message = mConfig.noti_msg_my_req_cancel_by_me;
          } else if (requestDetail.donor_id == userId) {
            // input.message = mConfig.noti_msg_my_req_cancel_by_donor;
            const req_cancel_by_donor = await this.commonService.changeString(
              mConfig.noti_msg_my_req_cancel_by_donor,
              updateData1,
            );
            input.message = req_cancel_by_donor;
          }
          input.userId = requestDetail.user_id;
          removeUsers.push(requestDetail.user_id);
          await this.commonService.notification(input);

          const ngo_request_cancel = await this.commonService.changeString(
            mConfig.noti_msg_ngo_request_delete,
            updateData1,
          );
          //SEND NOTIFICATION TO TRUSTEE OF USER NGO
          if (requestDetail.user_ngo_id) {
            const ngoUser = await this.commonService.getNgoUserIds(
              requestDetail.user_ngo_id,
              requestDetail.user_id,
            );
            if (ngoUser) {
              input.message = ngo_request_cancel;
              input.userId = ngoUser;
              this.commonService.notification(input);
              removeUsers.push(ngoUser);
            }
          }

          //SEND NOTIFICATION TO TRUSTEE OF DONOR NGO
          if (requestDetail.donor_ngo_id) {
            const ngoUser = await this.commonService.getNgoUserIds(
              requestDetail.donor_ngo_id,
              requestDetail.donor_id,
            );
            if (
              ngoUser &&
              !removeUsers.map((s) => s.toString()).includes(ngoUser.toString())
            ) {
              input.userId = ngoUser;
              input.message = ngo_request_cancel;
              this.commonService.notification(input);
              removeUsers.push(ngoUser);
            }
          }
          //SEND NOTIFICATION TO DONOR
          if (
            !removeUsers
              .map((s) => s.toString())
              .includes(requestDetail.donor_id.toString())
          ) {
            if (requestDetail.donor_id == userId) {
              input.message = mConfig.noti_msg_my_req_cancel_by_me;
            } else {
              const request_cancel = await this.commonService.changeString(
                mConfig.noti_msg_request_has_been_delete,
                updateData1,
              );
              input.message = request_cancel;
            }
            input.userId = requestDetail.donor_id;
            removeUsers.push(requestDetail.donor_id);
            await this.commonService.notification(input);
          }

          if (requestDetail.status === 'waiting_for_volunteer') {
            //SEND NOTIFICATION TO ALL VOLUNTEERS
            const request_cancel = await this.commonService.changeString(
              mConfig.noti_msg_food_req_cancel,
              updateData1,
            );
            input.message = request_cancel;
            const userIds = await this.commonService.removeIdFromArray(
              requestDetail.volunteer_id,
              removeUsers,
            );
            this.commonService.sendAllNotification(userIds, input);
          }
        } else if (
          requestDetail.status === 'volunteer_accept' ||
          requestDetail.status === 'pickup'
        ) {
          //SEND NOTIFICATION TO USER
          if (requestDetail.user_id == userId) {
            input.message = mConfig.noti_msg_my_req_cancel_by_me;
          } else {
            const request_cancel = await this.commonService.changeString(
              mConfig.noti_msg_request_has_been_delete,
              updateData1,
            );
            input.message = request_cancel;
          }
          input.userId = requestDetail.user_id;
          removeUsers.push(requestDetail.user_id);
          this.commonService.notification(input);

          //SEND NOTIFICATION TO TRUSTEE OF USER NGO
          if (requestDetail.user_ngo_id) {
            const ngoUsers = await this.commonService.getNgoUserIds(
              requestDetail.user_ngo_id,
              requestDetail.user_id,
            );
            const request_cancel = await this.commonService.changeString(
              mConfig.noti_msg_ngo_request_delete,
              updateData1,
            );
            if (ngoUsers) {
              input.userId = ngoUsers;
              input.message = request_cancel;
              this.commonService.notification(input);
              removeUsers.push(ngoUsers);
            }
          }

          //SEND NOTIFICATION TO TRUSTEE OF DONOR NGO
          if (requestDetail.donor_ngo_id) {
            const ngoUsers = await this.commonService.getNgoUserIds(
              requestDetail.donor_ngo_id,
              requestDetail.donor_id,
            );
            if (
              ngoUsers &&
              !removeUsers
                .map((s) => s.toString())
                .includes(ngoUsers.toString())
            ) {
              const request_cancel = await this.commonService.changeString(
                mConfig.noti_msg_ngo_request_delete,
                updateData1,
              );
              input.userId = ngoUsers;
              input.message = request_cancel;
              this.commonService.notification(input);
              removeUsers.push(ngoUsers);
            }
          }

          //SEND NOTIFICATION TO DONOR
          if (
            !removeUsers
              .map((s) => s.toString())
              .includes(requestDetail.donor_id.toString())
          ) {
            if (requestDetail.donor_id == userId) {
              input.message = mConfig.noti_msg_my_req_cancel_by_me;
            } else {
              const request_cancel = await this.commonService.changeString(
                mConfig.noti_msg_request_has_been_delete,
                updateData1,
              );
              input.message = request_cancel;
            }
            input.userId = requestDetail.donor_id;
            this.commonService.notification(input);
          }

          //SEND NOTIFICATION TO TRUSTEE OF VOLUNTEER NGO
          if (requestDetail.volunteer_ngo_id) {
            const ngoUsers = await this.commonService.getNgoUserIds(
              requestDetail.volunteer_ngo_id,
              requestDetail.volunteer_id,
            );
            if (
              ngoUsers &&
              !removeUsers
                .map((s) => s.toString())
                .includes(ngoUsers.toString())
            ) {
              const request_cancel = await this.commonService.changeString(
                mConfig.noti_msg_ngo_request_delete,
                updateData1,
              );
              input.userId = ngoUsers;
              input.message = request_cancel;
              this.commonService.notification(input);
              removeUsers.push(ngoUsers);
            }
          }

          //SEND NOTIFICATION TO volunteer
          if (
            !removeUsers
              .map((s) => s.toString())
              .includes(requestDetail.volunteer_id.toString())
          ) {
            if (requestDetail.volunteer_id == userId) {
              input.message = mConfig.noti_msg_my_req_cancel_by_me;
            } else {
              const request_cancel = await this.commonService.changeString(
                mConfig.noti_msg_request_has_been_delete,
                updateData1,
              );
              input.message = request_cancel;
            }
            input.userId = requestDetail.donor_id;
            this.commonService.notification(input);
          }
        }
        const updateData5 = {
          '{{refId}}': requestDetail.reference_id,
        };
        const food_request_cancel = await this.commonService.changeString(
          mConfig.noti_msg_food_req_cancel,
          updateData5,
        );

        input.message = food_request_cancel;
        this.commonService.sendAdminNotification(input);

        await this.foodRequestModel
          .updateOne({ _id: ObjectID(id) }, updateStatus)
          .lean();

        const requestData = await this.commonService.getFoodRequest(id);

        res.json({
          success: true,
          data: requestData,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-cancelRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for verify Fundraiser request for app
  public async reverifyRequest(
    reqId: string,
    res: any,
  ): Promise<CauseRequestDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        reqId,
      );
      const userData = this.request.user;
      const updateData = {
        $set: {
          status: 'reverify',
        },
        $unset: {
          allow_for_reverify: 1,
          block_request: 1,
          reject_time: 1,
        },
      };
      const request = await this.causeRequestModel
        .findOneAndUpdate(
          { _id: ObjectID(reqId), status: 'reject' },
          updateData,
          {
            new: true,
          },
        )
        .exec();

      if (!_.isEmpty(request)) {
        const updateData1 = {
          '{{first_name}}': userData.display_name
            ? userData.display_name
            : userData.first_name,
          '{{refId}}': request?.reference_id,
        };
        const reverification_req = await this.commonService.changeString(
          mConfig.noti_msg_reverification,
          updateData1,
        );
        //send notification to admin
        const input: any = {
          title: mConfig.noti_title_request_reverify,
          type: request.category_slug,
          requestId: request._id,
          categorySlug: request.category_slug,
          requestUserId: request.user_id,
          message: reverification_req,
        };
        this.commonService.sendAdminNotification(input);
        if (userData.ngo_data && userData.ngo_data._id) {
          const ngoUser = await this.commonService.getNgoUserIds(
            userData.ngo_data._id,
            userData._id,
          );
          if (ngoUser && !_.isUndefined(ngoUser)) {
            input.userId = ngoUser;
            this.commonService.notification(input);
          }
        }

        const data = await this.commonService.getFoodRequest(reqId);
        return res.json({
          success: true,
          message: mConfig.Reverify_request,
          data,
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
        'src/controller/request/request.service.ts-reverifyRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get urgent request list for app
  public async findUrgentRequest(body, res: any): Promise<CauseRequestModel> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', body);
      let userD: any = {};
      const userDetail = this.request.user;

      let urgentRequests = true;
      if (body.show_data == 1) {
        const result = await this.queueService.getSetting(
          'home-screen-per-page',
        );
        body.per_page = !_.isEmpty(result) ? result : 5;
      }

      const query: any = {
        status: 'approve',
        is_deleted: { $exists: false },
        'form_data.urgent_help_status': 'approve',
        'country_data.country_code': body.country,
      };

      //Filter for selected causes requests
      if (!_.isUndefined(body.category_slug) && body.category_slug) {
        query['category_slug'] = {
          $in: body.category_slug,
        };
      }

      //Corporate list
      if (
        !_.isEmpty(body) &&
        !_.isUndefined(body.corporate) &&
        body.corporate == 1 &&
        !_.isUndefined(userDetail._id)
      ) {
        query.active_type = 'corporate';
        query.corporate_id = ObjectID(userDetail?.corporate_data?._id);
      } else {
        query.active_type = { $ne: 'corporate' };
      }

      //Filter for find near by fundraiser requests
      let geoNear = [];
      if (
        !_.isUndefined(body.user_lat) &&
        body.user_lat != '' &&
        !_.isUndefined(body.user_long) &&
        body.user_long != ''
      ) {
        const maximumRadius = await this.queueService.getSetting(
          'maximum-radius',
        );

        const maximumRadInMeter = !_.isUndefined(body.maximum_radius)
          ? Number(body.maximum_radius)
          : maximumRadius;

        const latitude = Number(body.user_lat) || 0;
        const longitude = Number(body.user_long) || 0;
        geoNear = [
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [longitude, latitude],
              },
              distanceField: 'distance',
              distanceMultiplier: 0.001,
              key: 'location',
              maxDistance: maximumRadInMeter * 1000,
              minDistance: 0,
              spherical: true,
            },
          },
        ];

        userD.user_lat = latitude;
        userD.user_long = longitude;
        userD.maximum_radius = maximumRadInMeter;
      }

      //Filter for find requests which contains remaining amount between selected remaining amount
      if (
        !_.isUndefined(body.remaining_amt_from) &&
        body.remaining_amt_from !== '' &&
        !_.isUndefined(body.remaining_amt_to) &&
        body.remaining_amt_to !== ''
      ) {
        query['form_data.remaining_amount'] = {
          $gte: Number(body.remaining_amt_from),
          $lte: Number(body.remaining_amt_to),
        };
      }

      //Filter for find requests thar are expired soon
      if (
        !_.isUndefined(body.fundraiser_closing_soon) &&
        body.fundraiser_closing_soon == true
      ) {
        const closingInDays = await this.queueService.getSetting(
          'fundraiser-closing-soon-in-days',
        );

        const closingDate = moment()
          .tz('UTC')
          .add(closingInDays, 'd')
          .endOf('day')
          .toISOString();
        query['form_data.expiry_date'] = {
          $gte: new Date(),
          $lte: new Date(closingDate),
        };
      }

      const sortData = ['_id'];
      const lookup = {
        $lookup: {
          from: 'ngo', // collection name in db
          localField: 'user_ngo_id',
          foreignField: '_id',
          as: 'ngoData',
        },
      };
      const unwind1 = {
        $unwind: {
          path: '$ngoData',
          preserveNullAndEmptyArrays: true,
        },
      };
      const group = {
        $group: {
          _id: '$_id',
          ngoDatas: { $first: '$ngoData' },
        },
      };
      const project = {
        $project: {
          _id: '$request_data._id',
          distance: '$request_data.distance',
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
        },
      };
      const unwind2 = {
        $unwind: {
          path: '$ngo_Data',
          preserveNullAndEmptyArrays: false,
        },
      };

      let total = await this.causeRequestModel.aggregate([
        ...geoNear,
        lookup,
        { $match: query },
        unwind1,
        group,
        project,
        unwind2,
        { $count: 'count' },
      ]);
      let total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      //if there is no urgent requests then find approved requests
      if (total_record < 1) {
        urgentRequests = false;
        delete query['form_data.urgent_help_status'];

        total = await this.causeRequestModel.aggregate([
          ...geoNear,
          lookup,
          { $match: query },
          unwind1,
          group,
          project,
          unwind2,
          { $count: 'count' },
        ]);
        total_record = total && total[0] && total[0].count ? total[0].count : 0;
      }

      const {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        body.page,
        body.per_page,
        total_record,
        sortData,
        body.sort_type,
        body.sort,
      );

      if (!_.isEmpty(userDetail) && !_.isUndefined(userDetail._id)) {
        userD['_id'] = userDetail._id;
        userD['ngo_id'] = userDetail?.ngo_data?._id;
      }

      const data = await this.commonService.getAllRequestListWithTransaction(
        query,
        { 'form_data.expiry_date': 1 },
        start_from,
        per_page,
        userD,
      );

      return res.json({
        data,
        urgentRequests,
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
        'src/controller/request/request.service.ts-findUrgentRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for verify urgent fundraiser request in admin
  public async verifyUrgentFundraiser(
    reqId: string,
    verifyFundraiserDto: VerifyFundraiserDto,
    res: any,
  ): Promise<CauseRequestDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        verifyFundraiserDto,
      );

      const updateData: any = {
        $set: {
          'form_data.urgent_help_status': verifyFundraiserDto.status,
          'form_data.urgent_help': true,
        },
      };
      const request = await this.causeRequestModel
        .findByIdAndUpdate({ _id: ObjectID(reqId) }, updateData, {
          new: true,
        })
        .lean();

      if (!_.isEmpty(request)) {
        let requestUserIds = [];
        if (request.user_ngo_id) {
          requestUserIds = await this.commonService.getNgoUserIds(
            request.user_ngo_id,
          );
        } else {
          requestUserIds.push(request.user_id);
        }

        const status =
          verifyFundraiserDto.status === 'approve'
            ? 'approved'
            : verifyFundraiserDto.status === 'reject'
            ? 'rejected'
            : verifyFundraiserDto.status;
        if (verifyFundraiserDto.status == 'approve') {
          const allInput: any = {
            title: mConfig.noti_title_fundraiser_request,
            type: request.category_slug,
            categorySlug: request.category_slug,
            requestUserId: request.user_id,
            requestId: request._id,
            message: mConfig.noti_msg_urgent_request,
          };

          this.commonService.sendAllUsersNotification(
            requestUserIds,
            allInput,
            request.country_data.country,
            true,
          );
        }

        //send notification to user_id
        const updateData = {
          '{{cause}}': request.category_name,
          '{{status}}': status,
        };
        const msg = await this.commonService.changeString(
          mConfig.noti_urgent_request_verify_by_admin,
          updateData,
        );
        const input: any = {
          title: mConfig.noti_title_request_verification,
          type: request.category_slug,
          requestId: request._id,
          categorySlug: request.category_slug,
          requestUserId: request.user_id,
          message: msg,
          userId: request.user_id,
        };
        this.commonService.sendAllNotification(requestUserIds, input);

        //Add Activity Log
        const logData = {
          action: 'verify',
          request_id: request._id,
          entity_name: `Verify Urgent ${request.category_name} Request`,
          description: `Urgent ${request.category_name} request has been ${status} - ${request.reference_id}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message:
            verifyFundraiserDto.status === 'approve'
              ? mConfig.Make_urgent
              : mConfig.Remove_from_urgent,
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
        'src/controller/request/request.service.ts-verifyUrgentFundraiser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for my donation list, active donation list
  public async ngoDonationList(param, res: any): Promise<Ngo[]> {
    this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

    try {
      const userData = this.request.user;
      const lookup: any = {
        $lookup: {
          from: 'transactions',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user_id', '$$id'] },
                    {
                      $in: [
                        '$donor_id',
                        [userData._id, userData?.ngo_data?._id],
                      ],
                    },
                    {
                      $or: [
                        { eventCode: 'AUTHORISATION', success: true },
                        { eventCode: 'Authorised' },
                        { status: 'complete' },
                        { status: 'completed' },
                      ],
                    },
                    { $eq: ['$transaction_type', 'ngo-donation'] },
                    { $ne: ['$saayam_community', true] },
                  ],
                },
              },
            },
            {
              $sort: { id: -1 },
            },
          ],
          as: 'transactionData',
        },
      };
      const match = {
        transactionData: { $ne: [] },
      };

      const total = await this.ngoModel
        .aggregate([lookup, { $match: match }, { $count: 'count' }])
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
        null,
        param.sort_type,
        param.sort,
      );

      const data = await this.ngoModel.aggregate([
        lookup,
        { $match: match },
        {
          $project: {
            _id: 1,
            ngo_name: '$form_data.ngo_name',
            ngo_status: 1,
            createdAt: 1,
            is_deleted: 1,
            ngoDonation: {
              $sum: {
                $map: {
                  input: '$transactionData',
                  as: 'donation',
                  in: {
                    $cond: [
                      {
                        $eq: [
                          '$$donation.donor_id',
                          ObjectID(userData?.ngo_data?._id),
                        ],
                      },
                      '$$donation.converted_amt',
                      0,
                    ],
                  },
                },
              },
            },
            myDonation: {
              $sum: {
                $map: {
                  input: '$transactionData',
                  as: 'donation',
                  in: {
                    $cond: [
                      {
                        $eq: ['$$donation.donor_id', ObjectID(userData._id)],
                      },
                      '$$donation.converted_amt',
                      0,
                    ],
                  },
                },
              },
            },
            donationCount: { $size: '$transactionData' },
            currency: { $first: '$transactionData.currency' },
            transaction_id: { $first: '$transactionData._id' },
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
          },
        },
        { $skip: start_from },
        { $limit: per_page },
      ]);

      return res.json({
        data,
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
        'src/controller/request/request.service.ts-ngoDonationList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
  //Api for get food request videos list for app
  public async reelsList(reelsDto: ReelsDto, res: any): Promise<Reels[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'get',
        reelsDto,
      );

      const userId = reelsDto.user_id ? reelsDto.user_id : null;

      const query: any = {
        'form_data.files.video': { $exists: 1 },
        category_slug: { $ne: 'hunger' },
        status: 'approve',
        'country_data.country_code': reelsDto.country_code,
        $and: [
          { 'ngoData.ngo_status': { $nin: ['blocked', 'reject'] } },
          { 'ngoData.is_expired': { $ne: true } },
        ],
        is_deleted: { $ne: true },
      };
      if (reelsDto.active_type == 'corporate') {
        query['active_type'] = 'corporate';
      } else {
        query['active_type'] = { $ne: 'corporate' };
      }
      const lookup = [
        {
          $lookup: {
            from: 'reels',
            localField: 'form_data.files.video',
            foreignField: 'name',
            as: 'reelsData',
          },
        },
        {
          $lookup: {
            from: 'ngo',
            localField: 'user_ngo_id',
            foreignField: '_id',
            as: 'ngoData',
          },
        },
        {
          $lookup: {
            from: 'user', // collection name in db
            localField: 'user_id',
            foreignField: '_id',
            as: 'userData',
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
                    $or: [
                      {
                        $and: [
                          { $eq: ['$request_id', '$$id'] },
                          { $eq: ['$transaction_type', 'donation'] },
                          { $ne: ['$saayam_community', true] },
                        ],
                      },
                      {
                        $and: [
                          { $eq: ['$fund_id', '$$id'] },
                          { $eq: ['$transaction_type', 'fund-received'] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'donations',
          },
        },
      ];
      const ngoUnwind = {
        $unwind: {
          path: '$ngoData',
          preserveNullAndEmptyArrays: true,
        },
      };

      const Union = [
        {
          $unionWith: {
            coll: 'fund',
          },
        },
        {
          $unionWith: {
            coll: 'drives',
          },
        },
      ];
      const total = await this.requestModel.aggregate([
        ...Union,
        { $unwind: '$form_data.files.video' },
        ...lookup,
        ngoUnwind,
        { $match: query },
        { $count: 'count' },
      ]);

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
        reelsDto.page,
        reelsDto.per_page,
        total_record,
        null,
        reelsDto.sort_type,
        reelsDto.sort,
      );

      const causeData = await this.requestModel.aggregate([
        ...Union,
        { $unwind: '$form_data.files.video' },
        ...lookup,
        {
          $unwind: {
            path: '$reelsData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$userData',
            preserveNullAndEmptyArrays: false,
          },
        },
        ngoUnwind,
        { $match: query },
        {
          $lookup: {
            from: 'comments',
            let: { id: '$form_data.files.video' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$name', '$$id'] },
                      { $eq: ['$parent_id', '0'] },
                      { $eq: ['$type', 'request'] },
                      { $ne: ['$is_deleted', true] },
                    ],
                  },
                },
              },
            ],
            as: 'commentsData',
          },
        },
        {
          $set: {
            uniqueID: { $split: ['$form_data.files.video', '-'] },
          },
        },
        {
          $project: {
            _id: 1,
            unique_id: { $first: '$uniqueID' },
            user_id: '$userData._id',
            uname: {
              $concat: ['$userData.first_name', ' ', '$userData.last_name'],
            },
            user_image: {
              $ifNull: [
                { $concat: [authConfig.imageUrl, 'user/', '$userData.image'] },
                { $concat: [authConfig.imageUrl, 'profile.png'] },
              ],
            },
            video: {
              $cond: {
                if: { $eq: ['$category_slug', 'start-fund'] },
                then: {
                  $concat: [
                    authConfig.imageUrl,
                    'fund/',
                    { $toString: '$_id' },
                    '/',
                    '$form_data.files.video',
                  ],
                },
                else: {
                  $cond: {
                    if: { $eq: ['$category_slug', 'saayam-drive'] },
                    then: {
                      $concat: [
                        authConfig.imageUrl,
                        'drive/',
                        { $toString: '$_id' },
                        '/',
                        '$form_data.files.video',
                      ],
                    },
                    else: {
                      $concat: [
                        authConfig.imageUrl,
                        'request/',
                        '$form_data.files.video',
                      ],
                    },
                  },
                },
              },
            },
            video_name: '$form_data.files.video',
            write_your_story: {
              $cond: {
                if: { $eq: ['$category_slug', 'start-fund'] },
                then: '$form_data.describe_your_fund',
                else: {
                  $cond: {
                    if: { $eq: ['$category_slug', 'saayam-drive'] },
                    then: '$form_data.drive_description',
                    else: '$form_data.write_your_story',
                  },
                },
              },
            },
            title_of_fundraiser: '$form_data.title_of_fundraiser',
            views_count: {
              $ifNull: ['$reelsData.views_count', 0],
            },
            comment_count: { $size: '$commentsData' },
            likes_count: {
              $ifNull: ['$reelsData.likes_count', 0],
            },
            category: {
              $cond: {
                if: { $eq: ['$category_slug', 'start-fund'] },
                then: 'Start Fund',
                else: {
                  $cond: {
                    if: { $eq: ['$category_slug', 'saayam-drive'] },
                    then: 'Saayam Drive',
                    else: '$category_slug',
                  },
                },
              },
            },
            category_slug: 1,
            total_donors: { $size: { $setUnion: ['$donations.donor_id', []] } },
            // total_donors: '$donations.donor_id',
            comment_enabled: {
              $ifNull: ['$comment_enabled', false],
            },
            is_viewed: {
              $cond: {
                if: {
                  $and: [
                    { $ifNull: ['$reelsData.views_user_ids', null] },
                    { $in: [userId, '$reelsData.views_user_ids'] },
                  ],
                },
                then: true,
                else: false,
              },
            },
            is_like: {
              $cond: {
                if: {
                  $and: [
                    { $ifNull: ['$reelsData.like_user_ids', null] },
                    { $in: [userId, '$reelsData.like_user_ids'] },
                  ],
                },
                then: true,
                else: false,
              },
            },
            ngo: '$ngoData.ngo_status',
            createdAt: 1,
          },
        },
        { $sort: sort },
        { $skip: start_from },
        { $limit: per_page },
      ]);

      return res.json({
        causeData,
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
        'src/controller/request/request.service.ts-reelsList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async increaseReelsCount(
    increaseReelsCount: IncreaseReelsCount,
    res: any,
  ): Promise<Reels> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        increaseReelsCount,
      );

      const userId = increaseReelsCount.user_id;
      const data: any = await this.reelsModel
        .findOne({ name: increaseReelsCount.name })
        .lean();
      if (data) {
        let updateData;
        if (
          increaseReelsCount.type === 'increase_view' &&
          !data.views_user_ids.includes(userId)
        ) {
          updateData = {
            views_count: data.views_count + 1,
            $push: {
              views_user_ids: userId,
            },
          };
        } else if (
          increaseReelsCount.type === 'like' &&
          !data.like_user_ids.includes(userId)
        ) {
          updateData = {
            likes_count: data.likes_count + 1,
            $push: {
              like_user_ids: userId,
            },
          };
        } else if (
          increaseReelsCount.type === 'dislike' &&
          data.like_user_ids.includes(userId)
        ) {
          updateData = {
            likes_count: data.likes_count > 0 ? data.likes_count - 1 : 0,
            $pull: {
              like_user_ids: userId,
            },
          };
        }
        await this.reelsModel
          .findByIdAndUpdate({ _id: data._id }, updateData)
          .exec();
        //update request data
      } else {
        let reelsData;
        if (increaseReelsCount.type === 'increase_view') {
          reelsData = {
            name: increaseReelsCount.name,
            views_count: 1,
            views_user_ids: [userId],
          };
        } else if (increaseReelsCount.type === 'like') {
          reelsData = {
            name: increaseReelsCount.name,
            likes_count: 1,
            like_user_ids: [increaseReelsCount.user_id],
          };
        }
        //save data in request table
        const createRecord = new this.reelsModel(reelsData);
        await createRecord.save();
      }
      return res.json({ success: true });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-increaseReelsCount',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async addComment(type, commentDto: any, res: any): Promise<Comment> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        commentDto,
      );
      const userDetail = this.request.user;
      let data;
      if (type == 'request') {
        data = await this.reelsModel
          .findOne({ name: commentDto.name })
          .select({ _id: 1 })
          .lean();
      } else if (type == 'drive') {
        data = await this.postModel
          .findOne({
            _id: ObjectID(commentDto.post_id),
            is_blocked: { $ne: true },
          })
          .select({ _id: 1 })
          .lean();
      }
      if (data) {
        commentDto.user_id = userDetail._id;
        commentDto.type = type;

        const addComment = new this.commentModel(commentDto);
        await addComment.save();
        return res.json({
          success: true,
          message: mConfig.comment_added,
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
        'src/controller/request/request.service.ts-addComment',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
  public async commentList(
    type: string,
    id: string,
    param: any,
    res: any,
  ): Promise<Comment[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', id);
      if (!id) {
        return res.json({
          success: false,
          message: mConfig.Params_are_missing,
        });
      }
      const sortData = ['_id'];
      const query: any = {
        parent_id: '0',
        is_deleted: { $ne: true },
        type: type,
      };
      if (type == 'request') {
        query['name'] = id;
      } else if (type == 'drive' || type == 'ngo') {
        query['post_id'] = ObjectID(id);
      }

      if (!_.isUndefined(param.parent_id)) {
        query.parent_id = param.parent_id;
      }

      const total_record = await this.commentModel.count(query).lean();
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

      const data = await this.commentModel.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'user',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info',
          },
        },
        { $unwind: '$user_info' },
        {
          $lookup: {
            from: 'comments',
            let: { parent: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parent_id', '$$parent'] },
                      { $ne: ['$is_deleted', true] },
                    ],
                  },
                },
              },
            ],
            as: 'total_reply',
          },
        },
        {
          $lookup: {
            from: 'user',
            localField: 'total_reply.user_id',
            foreignField: '_id',
            as: 'reply_user_info',
          },
        },
        {
          $set: {
            total_reply: {
              $map: {
                input: '$total_reply',
                in: {
                  $mergeObjects: [
                    '$$this',
                    {
                      user: {
                        $arrayElemAt: [
                          '$reply_user_info',
                          {
                            $indexOfArray: [
                              '$reply_user_info._id',
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
        },
        {
          $project: {
            _id: 1,
            comment: 1,
            user_id: 1,
            first_name: '$user_info.first_name',
            last_name: '$user_info.last_name',
            display_name: '$user_info.display_name',
            video_name: '$name',
            post_id: 1,
            parent_id: 1,
            is_parent: {
              $cond: {
                if: { $eq: ['$parent_id', '0'] },
                then: true,
                else: false,
              },
            },
            user_image: {
              $concat: [authConfig.imageUrl, 'user/', '$user_info.image'],
            },
            createdAt: {
              $toLong: '$createdAt',
            },
            created_at: '$createdAt',
            updatedAt: 1,
            total_reply_count: { $size: '$total_reply' },
            total_reply: {
              $map: {
                input: '$total_reply',
                as: 'reply',
                in: {
                  _id: '$$reply._id',
                  first_name: '$$reply.user.first_name',
                  last_name: '$$reply.user.last_name',
                  display_name: '$$reply.user.display_name',
                  user_image: {
                    $concat: [
                      authConfig.imageUrl,
                      'user/',
                      '$$reply.user.image',
                    ],
                  },
                  comment: '$$reply.comment',
                  video_name: '$$reply.name',
                  user_id: '$$reply.user_id',
                  parent_id: '$$reply.parent_id',
                  createdAt: {
                    $toLong: '$createdAt',
                  },
                  created_at: '$$reply.createdAt',
                  updatedAt: '$$reply.updatedAt',
                },
              },
            },
          },
        },
        { $sort: sort },
        { $skip: start_from },
        { $limit: per_page },
      ]);

      return res.json({
        data,
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
        'src/controller/request/request.service.ts-commentList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async createFundraiserStatus(
    fundraiserStatus: FundraiserStatus,
    res: any,
  ): Promise<CauseRequestModel[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        fundraiserStatus,
      );
      const userData = this.request.user;
      const findFundraiser: any = await this.causeRequestModel
        .findOne({
          _id: ObjectID(fundraiserStatus.request_id),
        })
        .select({
          fundraiser_status: 1,
          status: 1,
          category_name: 1,
          reference_id: 1,
          _id: 1,
        })
        .lean();

      if (findFundraiser) {
        if (findFundraiser.status == 'expired') {
          return res.json({
            success: false,
            message: mConfig.Request_expired,
          });
        }
        const updateStatus = findFundraiser.fundraiser_status || [];
        const status_object = {
          _id: Math.floor(100000 + Math.random() * 900000),
          date: new Date(),
          status: fundraiserStatus.fundraiser_status,
          user_id: userData._id,
        };

        updateStatus.push(status_object);

        await this.causeRequestModel
          .findByIdAndUpdate(
            { _id: ObjectID(fundraiserStatus.request_id) },
            { $set: { fundraiser_status: updateStatus } },
            { new: true },
          )
          .exec();

        //Add Activity log for admins
        const logData = {
          request_id: findFundraiser._id,
          user_id: userData._id,
          text: mConfig.Request_update_status_activity_log,
        };

        this.logService.createFundraiserActivityLog(logData);

        return res.send({
          success: true,
          message: mConfig.fundraiser_status_added,
        });
      } else {
        return res.send({
          message: mConfig.No_data_found,
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-createFundraiserStatus',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async updateFundraiserStatus(
    id: string,
    fundraiserStatus: FundraiserStatus,
    res: any,
  ): Promise<CauseRequestModel[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        fundraiserStatus,
      );
      const findFundraiser: any = await this.causeRequestModel
        .findOne({
          _id: ObjectID(fundraiserStatus.request_id),
        })
        .select({ fundraiser_status: 1, status: 1 })
        .lean();

      if (findFundraiser) {
        if (findFundraiser.status == 'expired') {
          return res.json({
            success: false,
            message: mConfig.Request_expired,
          });
        }
        await this.causeRequestModel
          .findOneAndUpdate(
            {
              _id: ObjectID(fundraiserStatus.request_id),
              'fundraiser_status._id': Number(id),
            },
            {
              $set: {
                'fundraiser_status.$.updatedAt': new Date(),
                'fundraiser_status.$.status':
                  fundraiserStatus.fundraiser_status,
              },
            },
          )
          .lean();
        return res.send({
          success: true,
          message: mConfig.fundraiser_status_update,
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
        'src/controller/request/request.service.ts-updateFundraiserStatus',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async deleteFundraiserStatus(
    id: string,
    requestId: string,
    res: any,
  ): Promise<CauseRequestModel[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { requestId },
      );
      const findFundraiser: any = await this.causeRequestModel
        .findOne({
          _id: ObjectID(requestId),
        })
        .select({ status: 1 })
        .lean();

      if (findFundraiser) {
        if (findFundraiser.status == 'expired') {
          return res.json({
            success: false,
            message: mConfig.Request_expired,
          });
        }
        await this.causeRequestModel
          .findOneAndUpdate(
            {
              _id: ObjectID(requestId),
              'fundraiser_status._id': Number(id),
            },
            {
              $pull: {
                fundraiser_status: { _id: Number(id) },
              },
            },
            { new: true },
          )
          .lean();

        return res.send({
          success: true,
          message: mConfig.fundraiser_status_deleted,
        });
      } else {
        return res.send({
          message: mConfig.No_data_found,
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-deleteFundraiserStatus',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async requestForDeleteOngoingRequests(
    deleteOngoingRequestsDto: DeleteOngoingRequestsDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        deleteOngoingRequestsDto,
      );
      const userData = this.request.user;
      const userName = userData.display_name
        ? userData.display_name
        : userData.first_name + ' ' + userData.last_name;

      const requestData = await this.causeRequestModel
        .findById(deleteOngoingRequestsDto.request_id, {
          _id: 1,
          reference_id: 1,
          category_name: 1,
          category_slug: 1,
          status: 1,
        })
        .lean();
      if (requestData) {
        if (requestData.status == 'expired') {
          return res.json({
            success: false,
            message: mConfig.Request_expired,
          });
        }
        let updateRequestData;
        let notiTitle;
        let notiMsg;
        const updateData = {
          '{{uname}}': userName,
          '{{cause}}': requestData.category_name,
          '{{refId}}': requestData.reference_id,
        };
        if (requestData.status === 'pending') {
          updateRequestData = {
            $set: {
              status: 'cancelled',
              is_deleted: true,
              cancellation_reason: deleteOngoingRequestsDto.reason,
            },
          };
          notiTitle = await this.commonService.changeString(
            mConfig.noti_title_request_cancel_by_requestor,
            updateData,
          );

          notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_request_cancel_by_requestor,
            updateData,
          );
        } else {
          if (deleteOngoingRequestsDto.type === 'send_request') {
            updateRequestData = {
              $set: {
                delete_request: true,
                send_request_for_delete_request_reason:
                  deleteOngoingRequestsDto.reason,
              },
            };
            notiTitle = await this.commonService.changeString(
              mConfig.noti_title_send_request_for_delete_ongoing_request,
              updateData,
            );
            notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_reason,
              { '{{reason}}': deleteOngoingRequestsDto.reason },
            );
          } else if (deleteOngoingRequestsDto.type === 'cancel_request') {
            updateRequestData = {
              $unset: {
                delete_request: 1,
              },
            };
            notiTitle =
              mConfig.noti_title_cancel_request_for_delete_ongoing_request;
            notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_cancel_request_for_delete_ongoing_request,
              updateData,
            );
          }
        }

        await this.causeRequestModel
          .findByIdAndUpdate(
            deleteOngoingRequestsDto.request_id,
            updateRequestData,
            { new: true },
          )
          .lean();

        //send notification to admin
        const input = {
          message: notiMsg,
          title: notiTitle,
          type: requestData.category_slug,
          requestId: requestData._id,
          categorySlug: requestData.category_slug,
        };
        this.commonService.sendAdminNotification(input);
        return res.json({
          success: true,
          message:
            requestData.status === 'pending'
              ? mConfig.noti_title_cancelled_request
              : mConfig.Request_send,
          type: requestData.status === 'pending' ? 'cancel' : 'delete',
        });
      } else {
        return res.json({
          success: true,
          message: mConfig.No_data_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/requestForCancelOngoingRequests',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async verifyDeleteRequest(
    deleteOngoingRequestsDto: DeleteOngoingRequestsDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        deleteOngoingRequestsDto,
      );
      let requestData: any = await this.causeRequestModel
        .aggregate([
          { $match: { _id: ObjectID(deleteOngoingRequestsDto.request_id) } },
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
            $project: {
              _id: 1,
              reference_id: 1,
              category_name: 1,
              category_slug: 1,
              form_data: 1,
              user_id: 1,
              status: 1,
              country_data: 1,
              user_ngo_id: 1,
              uname: 1,
              total_donation: { $sum: '$tData.converted_amt' },
            },
          },
        ])
        .exec();
      requestData = requestData[0];

      if (!_.isEmpty(requestData)) {
        let notiTitle;
        let notiMsg;
        const updateData = {
          '{{cause}}': requestData.category_name,
          '{{refId}}': requestData.reference_id,
        };
        if (deleteOngoingRequestsDto.type === 'approve') {
          notiTitle =
            mConfig.noti_title_approve_request_for_delete_ongoing_request;
          notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_approve_request_for_delete_ongoing_request,
            updateData,
          );

          await this.causeRequestModel
            .findByIdAndUpdate(
              deleteOngoingRequestsDto.request_id,
              { status: 'cancelled' },
              { new: true },
            )
            .lean();

          await this.notificationModel
            .deleteMany({ request_id: requestData._id })
            .lean();
          this.volunteerService.transferRequestFund(requestData);

          ///send notifications to donors
          if (requestData.status === 'approve') {
            const requestUserIds = [requestData.user_id];

            const title = await this.commonService.changeString(
              mConfig.noti_title_request_cancel_by_requestor,
              updateData,
            );

            const input: any = {
              title: title,
              type: requestData.category_slug,
              requestId: requestData._id,
              categorySlug: requestData.category_slug,
            };
            const transactions = await this.transactionModel
              .find({
                request_id: requestData._id,
                donor_id: {
                  $nin: [requestData.user_ngo_id, requestData.user_id],
                },
                transaction_type: 'donation',
                saayam_community: { $exists: false },
              })
              .select({ donor_user_id: 1 })
              .lean();

            if (!_.isEmpty(transactions)) {
              let donorsArray = transactions.map(function (obj) {
                return obj.donor_user_id;
              });
              donorsArray = [...new Set(donorsArray)];
              requestUserIds.push(...donorsArray);

              const msg = await this.commonService.changeString(
                mConfig.noti_msg_cancel_request,
                updateData,
              );
              input.message = msg;
              await this.commonService.sendAllNotification(donorsArray, input);
            }

            updateData['uname'] = requestData.uname;
            const msg = await this.commonService.changeString(
              mConfig.noti_msg_request_cancel_by_requestor,
              updateData,
            );

            input.message = msg;

            //send notification to another trustee of ngo
            if (requestData.user_ngo_id) {
              const ngoUser = await this.commonService.getNgoUserIds(
                requestData.user_ngo_id,
                requestData.user_id,
              );
              if (
                ngoUser &&
                !requestUserIds
                  .map((s) => s.toString())
                  .includes(ngoUser.toString())
              ) {
                requestUserIds.push(ngoUser);
                input.userId = ngoUser;
                await this.commonService.notification(input);
              }
            }

            //send notification to all users
            this.commonService.sendAllUsersNotification(
              requestUserIds,
              input,
              requestData.country_data.country,
              true,
            );
          }
        } else if (deleteOngoingRequestsDto.type === 'reject') {
          const updateRequestData = {
            $set: {
              delete_request: false,
              cancel_request_for_delete_request_reason:
                deleteOngoingRequestsDto.reason,
            },
            $unset: { send_request_for_delete_request_reason: 1 },
          };
          notiTitle = await this.commonService.changeString(
            mConfig.noti_title_reject_request_for_delete_ongoing_request,
            updateData,
          );
          notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_reason,
            { '{{reason}}': deleteOngoingRequestsDto.reason },
          );
          await this.causeRequestModel
            .findByIdAndUpdate(
              deleteOngoingRequestsDto.request_id,
              updateRequestData,
              { new: true },
            )
            .lean();
        }
        const input: any = {
          title: notiTitle,
          message: notiMsg,
          type: requestData.category_slug,
          requestId: requestData._id,
          categorySlug: requestData.category_slug,
          requestUserId: requestData.user_id,
          userId: requestData.user_id,
        };
        this.commonService.notification(input);

        const status =
          deleteOngoingRequestsDto.type === 'approve' ? 'approved' : 'rejected';
        //Add Activity Log
        const logData = {
          action: 'verify',
          request_id: requestData._id,
          entity_name: `Verify User Request For Delete Request`,
          description: `User request for delete ${requestData.category_name} request has been ${status} - ${requestData.reference_id}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message:
            deleteOngoingRequestsDto.type === 'approve'
              ? mConfig.Request_approved
              : mConfig.Request_rejected,
        });
      } else {
        return res.json({
          success: true,
          message: mConfig.No_data_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/verifyDeleteRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  checkValidation = async (
    data,
    formData,
    currency,
    formType,
    acceptedType,
    categorySlug,
    userData,
  ) => {
    try {
      //validate form data
      let haveError = false;

      data.map(async (item: any, mainIndex: number) => {
        const isVisble = item?.visible;
        let haveValidate = false;
        if (categorySlug == 'ngo_form') {
          haveValidate = true;
        } else if (acceptedType === 'ngo' && !isVisble.includes('ngo')) {
          return;
        } else {
          if (userData?.is_donor && isVisble.includes('donor')) {
            haveValidate = true;
          } else if (userData?.is_volunteer && isVisble.includes('volunteer')) {
            haveValidate = true;
          } else if (userData?.is_user && isVisble.includes('user')) {
            haveValidate = true;
          } else if (
            ((userData?.is_corporate || userData?.is_corporate_user) &&
              isVisble.includes('corporate')) ||
            ((userData?.is_corporate || userData?.is_corporate_user) &&
              categorySlug == 'corporate')
          ) {
            haveValidate = true;
          }
        }

        if (haveValidate) {
          const inputs = item.inputs;

          inputs.map(async (input: any, inputIndex: number) => {
            let havetoCheck = true;
            let inputError = false;
            if (formType === 'draft') {
              havetoCheck = false;
            }
            //Add currency field in form data
            if (
              input.input_slug === 'goal_amount' &&
              currency &&
              !_.isEmpty(currency)
            ) {
              data[mainIndex].inputs[inputIndex].currency = currency;
            }

            /* check either input is dippened on another input or not */
            if (input?.is_dependant && input?.dependant_type) {
              let dependantData: any;
              data.map((it: any) => {
                if (it?.inputs) {
                  it.inputs.map((subIt: any) => {
                    if (
                      subIt?.input_slug &&
                      subIt?.input_slug == input?.dependant_type
                    ) {
                      dependantData = subIt;
                    }
                  });
                } else {
                  if (
                    it?.input_slug &&
                    it?.input_slug == input?.dependant_type
                  ) {
                    dependantData = it;
                  }
                }
              });
              if (
                !_.isEmpty(dependantData) &&
                (((input?.dependant_value == 'false' ||
                  input?.dependant_value == '') &&
                  (!dependantData?.value ||
                    dependantData?.value == 'false' ||
                    dependantData?.value == '')) ||
                  (input?.dependant_value == 'true' &&
                    dependantData?.value &&
                    (dependantData?.value == 'true' ||
                      dependantData?.value != '')))
              ) {
                // Do nothing
              } else {
                havetoCheck = false;
              }
            }

            if (havetoCheck) {
              if (
                _.includes(
                  [
                    'string',
                    'number',
                    'textarea',
                    'email',
                    'password',
                    'checkbox',
                    'radio',
                    'select',
                    'date',
                  ],
                  input.input_type,
                )
              ) {
                if (
                  input.is_required &&
                  (input.input_type === 'checkbox'
                    ? input.value === false
                    : _.isEmpty(input.value))
                ) {
                  data[mainIndex].inputs[inputIndex].error = _.includes(
                    ['checkbox', 'radio', 'select'],
                    input.input_type,
                  )
                    ? `Select any option for ${input.title}`
                    : `${input.title} can not be empty.`;
                  data[mainIndex].inputs[inputIndex].haveError = true;

                  haveError = true;
                  inputError = true;
                }
              }
              if (
                !inputError &&
                _.includes(
                  ['string', 'number', 'textarea', 'email', 'password'],
                  input.input_type,
                ) &&
                !_.isEmpty(
                  input.input_slug === 'secondary_mobile_number' ||
                    input.input_slug === 'ngo_mobile_number'
                    ? input?.value?.phoneNumber
                    : input?.value,
                )
              ) {
                let value = input.value;
                if (
                  input.input_slug === 'secondary_mobile_number' ||
                  input.input_slug === 'ngo_mobile_number'
                ) {
                  value = input?.value?.phoneNumber;
                }
                let len = value ? _.size(value) : 0;
                if (input.input_type === 'number' && !input.is_mobile) {
                  len = value;
                }
                if (parseInt(input.min) > 0) {
                  if (parseInt(input.min) > len) {
                    data[mainIndex].inputs[
                      inputIndex
                    ].error = `${input.title} must be greater than ${input.min}.`;
                    data[mainIndex].inputs[inputIndex].haveError = true;
                    haveError = true;
                    inputError = true;
                  }
                }
                if (parseInt(input.max) > 0) {
                  if (parseInt(input.max) < len) {
                    data[mainIndex].inputs[
                      inputIndex
                    ].error = `${input.title} must be less than ${input.max}.`;
                    data[mainIndex].inputs[inputIndex].haveError = true;
                    haveError = true;
                    inputError = true;
                  }
                }
              }
              if (
                input.input_slug === 'add_link' ||
                (input.input_slug === 'website_link' && !_.isEmpty(input.value))
              ) {
                const linkRegex =
                  /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
                if (!linkRegex.test(input.value)) {
                  data[mainIndex].inputs[inputIndex].error =
                    'Please enter valid link.';
                  data[mainIndex].inputs[inputIndex].haveError = true;
                  haveError = true;
                  inputError = true;
                }
              }
              if (input.input_type === 'location') {
                if (input.is_required && _.isEmpty(input.value)) {
                  data[mainIndex].inputs[inputIndex].error =
                    'Please select location.';
                  data[mainIndex].inputs[inputIndex].haveError = true;
                  haveError = true;
                  inputError = true;
                } else if (
                  input.value &&
                  (_.isUndefined(input.value.longitude) ||
                    input.value.longitude === 0 ||
                    !input.value.longitude ||
                    _.isUndefined(input.value.latitude) ||
                    input.value.latitude === 0 ||
                    !input.value.latitude ||
                    _.isUndefined(input.value.city) ||
                    !input.value.city)
                ) {
                  data[mainIndex].inputs[inputIndex].error =
                    'Please select proper location.';
                  data[mainIndex].inputs[inputIndex].haveError = true;
                  haveError = true;
                  inputError = true;
                }
              }
              if (input.input_type === 'file') {
                if (input.is_required && _.isEmpty(input.value)) {
                  data[mainIndex].inputs[
                    inputIndex
                  ].error = `${input.title} can not be empty.`;
                  data[mainIndex].inputs[inputIndex].haveError = true;
                  haveError = true;
                  inputError = true;
                } else if (parseInt(input.min) > 0 && input.value) {
                  const len = input.value ? _.size(input.value) : 0;
                  if (parseInt(input.min) > len) {
                    data[mainIndex].inputs[
                      inputIndex
                    ].error = `Please upload atleast ${input.min} file${
                      input.min > 1 ? 's' : ''
                    } in ${input.title}.`;
                    data[mainIndex].inputs[inputIndex].haveError = true;
                    haveError = true;
                    inputError = true;
                  }
                } else if (parseInt(input.max) > 0 && input.value) {
                  const len = input.value ? _.size(input.value) : 0;
                  if (parseInt(input.max) < len) {
                    data[mainIndex].inputs[
                      inputIndex
                    ].error = `${input.title} must be less than ${input.max}.`;
                    data[mainIndex].inputs[inputIndex].haveError = true;
                    haveError = true;
                    inputError = true;
                  }
                }
              }
              if (
                input.input_type === 'date' ||
                input.input_type === 'dateTime'
              ) {
                if (
                  input.is_required &&
                  (_.isEmpty(input.value) || !input.value)
                ) {
                  data[mainIndex].inputs[inputIndex].error =
                    'Please select date.';
                  data[mainIndex].inputs[inputIndex].haveError = true;
                  haveError = true;
                  inputError = true;
                } else if (
                  input.value &&
                  new Date(input.value) <= new Date() &&
                  input.input_slug !== 'established_year'
                ) {
                  data[mainIndex].inputs[
                    inputIndex
                  ].error = `Selected date must be greater than today's date.`;
                  haveError = true;
                  inputError = true;
                  data[mainIndex].inputs[inputIndex].haveError = true;
                }
              }
              if (input.input_type === 'checkbox') {
                if (input.value && input?.other_input) {
                  const otherInputs =
                    input.other_input && input.value ? input.other_inputs : [];
                  otherInputs.map((o, oidx) => {
                    if (
                      _.includes(
                        [
                          'string',
                          'number',
                          'textarea',
                          'email',
                          'password',
                          'checkbox',
                          'radio',
                          'select',
                          'date',
                        ],
                        o.other_input_type,
                      )
                    ) {
                      if (o.other_is_required && !o.value) {
                        data[mainIndex].inputs[inputIndex].other_inputs[
                          oidx
                        ].error = _.includes(
                          ['checkbox', 'radio', 'select'],
                          o.other_input_type,
                        )
                          ? `Select any option for ${o.other_title}`
                          : `${o.other_title} can not be empty.`;
                        data[mainIndex].inputs[inputIndex].other_inputs[
                          oidx
                        ].haveError = true;
                        haveError = true;
                        inputError = true;
                      }
                    }
                    if (
                      !inputError &&
                      _.includes(
                        ['string', 'number', 'textarea', 'email', 'password'],
                        o.other_input_type,
                      ) &&
                      o.value
                    ) {
                      if (parseInt(o.other_min) > 0) {
                        let len = o.value ? _.size(o.value) : 0;
                        if (o.other_input_type === 'number' && o.value) {
                          len = o.value;
                        }
                        if (parseInt(o.other_min) > len) {
                          data[mainIndex].inputs[inputIndex].other_inputs[
                            oidx
                          ].error = `${o.other_title} must be greater than ${
                            o?.input_slug === 'goal_amount' ? '0' : o.other_min
                          }.`;
                          data[mainIndex].inputs[inputIndex].other_inputs[
                            oidx
                          ].haveError = true;
                          haveError = true;
                          inputError = true;
                        }
                      }
                      if (parseInt(o.other_max) > 0) {
                        let len = o.value ? _.size(o.value) : 0;
                        if (o.other_input_type === 'number' && o.value) {
                          len = o.value;
                        }
                        if (parseInt(o.other_max) < len) {
                          data[mainIndex].inputs[inputIndex].other_inputs[
                            oidx
                          ].error = `${o.other_title} must be less than ${o.other_max}.`;
                          data[mainIndex].inputs[inputIndex].other_inputs[
                            oidx
                          ].haveError = true;
                          haveError = true;
                          inputError = true;
                        }
                      }
                    }

                    if (!inputError) {
                      formData.form_data[o.other_input_slug] = o.value;
                    }
                  });
                } else if (
                  input?.value?.checkBoxVal &&
                  input?.value?.description === ''
                ) {
                  data[mainIndex].inputs[inputIndex].error =
                    'Please enter description.';
                  data[mainIndex].inputs[inputIndex].haveError = true;
                  haveError = true;
                  inputError = true;
                }
              }

              if (input?.input_type === 'radio') {
                if (data?.[mainIndex]?.inputs[inputIndex]?.radioCustom) {
                  if (
                    data[mainIndex].inputs[inputIndex].other_inputs[0]
                      ?.other_max < data[mainIndex].inputs[inputIndex].value
                  ) {
                    data[mainIndex].inputs[
                      inputIndex
                    ].error = `Number must be between ${data[mainIndex].inputs[inputIndex].other_inputs[0]?.other_min} to ${data[mainIndex].inputs[inputIndex].other_inputs[0]?.other_max}`;
                    data[mainIndex].inputs[inputIndex].haveError = true;
                    haveError = true;
                    inputError = true;
                  } else if (input?.is_required && _.isEmpty(input.value)) {
                    data[mainIndex].inputs[inputIndex].error =
                      'Please enter Number';
                    data[mainIndex].inputs[inputIndex].haveError = true;
                    haveError = true;
                    inputError = true;
                  }
                }
              }
              if (
                input.input_slug === 'secondary_mobile_number' &&
                !_.isEmpty(input?.value?.phoneNumber)
              ) {
                const secondaryMobileValue = input.value?.phoneNumber; // Assuming it's a phone number

                const ngoMobileValue = await this.getNgoMobileValue(data); // Implement a function to get the value of 'ngo_mobile_number'

                if (secondaryMobileValue === ngoMobileValue) {
                  // Values are the same, handle the error
                  data[mainIndex].inputs[inputIndex].error =
                    'Secondary mobile number cannot be the same as NGO mobile number.';
                  data[mainIndex].inputs[inputIndex].haveError = true;
                  haveError = true;
                  inputError = true;
                }
              }
            }
            // Add all data in object

            if (!inputError) {
              if (input.input_type === 'location' && !_.isEmpty(input.value)) {
                const target =
                  input.input_slug === 'location' ||
                  input.input_slug === 'ngo_address'
                    ? formData
                    : formData.form_data;
                target[input.input_slug] = {
                  type: 'Point',
                  coordinates: [input.value.longitude, input.value.latitude],
                  city: input.value.city,
                };

                if (categorySlug === 'hunger') {
                  formData.country_data['country'] = input?.value?.country;
                  const currencyData = await this.currencyModel.findOne(
                    { country: formData.country_data.country },
                    { country_code: 1 },
                  );

                  formData.country_data.country_code =
                    currencyData.country_code;
                }
              } else if (input.input_type === 'file') {
                if (input.value && !_.isEmpty(input.value)) {
                  const filesArray = input.value;
                  formData.form_data.files[input.input_slug] = filesArray;
                }
                if (!haveError && input.images) {
                  input.images.map((imagesList: any, imagesIndex: number) => {
                    if (imagesList.OriginalName) {
                      input.images[imagesIndex].path = imagesList.OriginalName;
                      input.images[imagesIndex].server = true;
                    }
                  });
                  data[mainIndex].inputs[inputIndex].images = input.images;
                  formData.form_data.images[input.input_slug] = input.images;
                }
              } else if (
                input.input_type == 'date' &&
                input.value &&
                !_.isEmpty(input.value) &&
                !_.isEmpty(userData)
              ) {
                const value = input.value;
                const timeZone = userData?.time_zone;
                const utcDate = new Date(
                  moment(value).tz(timeZone).endOf('day').format(),
                );
                formData.form_data[input.input_slug] = utcDate;
              } else if (
                input.input_type === 'checkbox' &&
                !input.value &&
                input.input_slug != 'link_available'
              ) {
                formData.form_data[input.input_slug] = false;
              } else if (!_.isUndefined(input.value)) {
                formData.form_data[input.input_slug] = input.value;
              }
              if (
                input.input_type === 'checkbox' &&
                input.value &&
                input.other_inputs
              ) {
                const otherInputs = input.other_inputs;
                otherInputs.map((o) => {
                  if (!_.isUndefined(o.value))
                    formData.form_data[o.other_input_slug] = o.value;
                });
              }
            }
          });
        }
      });

      //If user wants to create request for self then add user firstname,lastname,race and religion otherwise take user enter inputs
      if (formData.form_data.request_for_self) {
        formData.form_data['first_name'] = userData.first_name;
        formData.form_data['last_name'] = userData.last_name;
        formData.form_data['race'] = userData.race;
        formData.form_data['religion'] = userData.religion;
      }
      if (formData.form_data.urgent_help) {
        formData.form_data['urgent_help_status'] = 'pending';
      }
      if (
        formData.form_data.goal_amount &&
        !_.isUndefined(formData.form_data.goal_amount)
      ) {
        formData.form_data['remaining_amount'] = Number(
          formData.form_data.goal_amount,
        );
      }
      if (
        formData.form_data.expiry_date &&
        !_.isUndefined(formData.form_data.expiry_date)
      ) {
        const reminder_days = await this.queueService.getSetting(
          'extend-expiry-date',
        );
        let reminder;
        let reminderDate;
        const today = moment().format('X');

        if (!_.isEmpty(reminder_days)) {
          reminderDate = moment(formData.form_data.expiry_date)
            .subtract(reminder_days, 'days')
            .format('X');
          reminder = new Date(
            moment(formData.form_data.expiry_date)
              .subtract(reminder_days, 'days')
              .format(),
          );
        }
        if (
          _.isEmpty(reminder_days) ||
          parseInt(reminderDate) < parseInt(today)
        ) {
          reminder = new Date();
        }

        formData.form_data['reminder_date'] = reminder;
      }
      return {
        data1: data,
        formData1: formData,
        haveError,
      };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-checkValidation',
      );
    }
  };

  public async getNgoMobileValue(data) {
    const ngo_number = data
      .flatMap((obj: any) => obj.inputs)
      .find((input: any) => input.input_slug === 'ngo_mobile_number');

    return ngo_number?.value?.phoneNumber || null;
  }

  //This api is used for get form setting for request and fund at create & edit time
  public async formData(id: string, type: string, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', id);
      let catData;
      const userId = this.request.user._id;

      if (type === 'cause') {
        //type cause is used for get create request & fund form and id will be a cause id
        catData = await this.categoryModel
          .findOne({ _id: ObjectID(id) })
          .select({ form_settings: 1 })
          .lean();
      } else {
        let modelName;
        if (type === 'fund') {
          //type fund is used for get fund form at update time and id will be a fund id
          modelName = this.fundModel;
        } else {
          //type request is used for get fundraiser form at update time and id will be a request id
          modelName = this.requestModel;
        }
        catData = await modelName
          .findOne({ _id: ObjectID(id) })
          .select({
            form_settings: 1,
            add_location_for_food_donation: 1,
            disaster_links: 1,
          })
          .lean();
      }
      if (!catData) {
        return res.send({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let bankCount = 0;
        if (userId) {
          bankCount = await this.BankModel.countDocuments({
            is_deleted: { $ne: true },
            status: 'approve',
            user_id: userId,
          });
        }

        const data =
          type === 'disaster-relief' ? catData : catData.form_settings;
        return res.send({
          success: true,
          data,
          bank_count: bankCount,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-form-data',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async updateExpiryDate(expiryDateDto: ExpiryDateDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        expiryDateDto,
      );
      const request = await this.causeRequestModel
        .findById({ _id: expiryDateDto.request_id })
        .select({
          _id: 1,
          form_settings: 1,
        })
        .lean();
      if (!_.isEmpty(request)) {
        const timeZone = this.request.user.time_zone;

        const utcDate = await this.commonService.convertDateToUTC(
          expiryDateDto.expiry_date,
          timeZone,
        );

        const reminder_days = await this.queueService.getSetting(
          'extend-expiry-date',
        );
        const reminderDate = moment(utcDate)
          .subtract(reminder_days, 'days')
          .format('X');
        const today = moment().format('X');
        let reminder = new Date(
          moment(utcDate).subtract(reminder_days, 'days').format(),
        );

        if (parseInt(reminderDate) < parseInt(today)) {
          reminder = new Date();
        }

        //update date in form settings
        const formSetting = await this.commonService.updateFormSettingData(
          'expiry_date',
          expiryDateDto.expiry_date,
          request.form_settings,
        );

        const updateData = {
          'form_data.expiry_date': utcDate,
          'form_data.reminder_date': reminder,
          form_settings: formSetting,
        };

        const result = await this.requestModel
          .findByIdAndUpdate({ _id: expiryDateDto.request_id }, updateData, {
            new: true,
          })
          .select({
            _id: 1,
            category_name: 1,
            category_slug: 1,
            user_id: 1,
            country_data: 1,
          })
          .lean();

        await this.notificationModel
          .deleteOne({ user_id: ObjectID(result.user_id), type: 'extend_date' })
          .lean();

        //send hidden notification to all users
        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_change_expiry_date,
          { '{{category}}': result.category_name },
        );
        //send Notification to all user for new request arrive
        const allInput = {
          title: notiTitle,
          type: result.category_slug,
          categorySlug: result.category_slug,
          requestUserId: result.user_id,
          requestId: result._id,
        };

        this.commonService.sendAllUsersNotification(
          [this.request.user._id],
          allInput,
          result.country_data.country,
          true,
        );

        return res.json({
          success: true,
          message: mConfig.request_expiry_date_updated,
        });
      } else {
        return res.json({
          success: true,
          message: mConfig.No_data_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-updateExpiryDate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // testApi = async (

  //   ) => {
  //     try {
  //       // new Date(moment().startOf('minute').format())
  //       const requests = await this.causeRequestModel.find({
  //         $and: [{
  //           status: 'approve',
  //           remaining_amount: {
  //             $exists : true
  //           },
  //           'form_data.expiry_date':{
  //             $gte: new Date(moment().startOf('day').format()),
  //             $lte:  new Date(moment().endOf('day').format()),
  //           }
  //         }]
  //       });
  //       // console.log("🚀 ~ request", requests)
  //       console.log("🚀 ~ request count", requests.length)
  //       if(!_.isEmpty(requests)){
  //         for (let i = 0; i < requests.length; i++) {
  //           let reqData = requests[i];
  //           console.log("🚀 ~ file: request.service.ts ~ line 5870 ~ RequestService ~ reqData._id", reqData._id)

  //           const lastTransaction = await this.transactionModel.findOne({
  //             $and: [{
  //               request_id: reqData._id,
  //               createdAt: -1
  //             }]
  //           });
  //           console.log("🚀 ~ file: request.service.ts ~ line 5873 ~ RequestService ~ lastTransaction", lastTransaction)
  //           if(!_.isEmpty(lastTransaction)){
  //             const user = await this.userModel.findOne({
  //               _id : lastTransaction.donor_id
  //             });
  //             if(!_.isEmpty(user)){
  //               const input: any = {
  //                 title: "Request remaining amount",
  //                 type: 'remaining_amount',
  //                 requestId: reqData._id,
  //                 categorySlug: reqData.category_slug,
  //                 message: `${reqData.category_name} request ${reqData._id} will expire today, Only ${reqData.remaining_amount.toFixed(2)} amount is remaining to complete the request`,
  //                 userId : user._id
  //               };
  //               this.commonService.notification(input);
  //             }
  //           }
  //         }

  //       }

  //     } catch (error) {
  //       console.log("🚀 ~ file: request.service.ts ~ line 5853 ~ RequestService ~ error", error)
  //     }
  //   };

  public async updateComment(
    id: string,
    comment: string,
    res: any,
  ): Promise<Comment[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        comment,
      );
      const findComment: any = await this.commentModel
        .findByIdAndUpdate(
          { _id: ObjectID(id) },
          { $set: { comment: comment } },
          { new: true },
        )
        .select({ _id: 1 })
        .lean();

      if (findComment) {
        return res.send({
          success: true,
          message: mConfig.comment_updated,
        });
      } else {
        return res.send({
          message: mConfig.No_data_found,
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-updateComment',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async deleteComment(id: string, res: any): Promise<Comment> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const findComment: any = await this.commentModel
        .updateMany(
          {
            $or: [{ _id: ObjectID(id) }, { parent_id: id }],
          },
          {
            $set: {
              is_deleted: true,
            },
          },
          { new: true },
        )
        .lean();

      if (findComment) {
        return res.send({
          success: true,
          message: mConfig.comment_deleted,
        });
      } else {
        return res.send({
          message: mConfig.No_data_found,
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-deleteComment',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for manual transfer
  public async manualTransfer(
    manualTransferdto: ManualTransferDto,
    file,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        manualTransferdto,
      );
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        manualTransferdto,
      );
      let modelName: any = this.requestModel;
      if (manualTransferdto.type == 'ngo-transfer') {
        modelName = this.ngoModel;
      }
      const resData: any = await modelName
        .findOne({
          _id: ObjectID(manualTransferdto.id),
        })
        .lean();

      if (!resData) {
        return res.send({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let imageId: any = null;
        if (!_.isEmpty(file)) {
          const byteCount = file.size;
          const maxBytes = 10 * 1024 * 1024;

          if (byteCount > maxBytes) {
            return res.json({
              success: false,
              message: mConfig.Allow_maximum_10_MB,
            });
          }
          const fileId = await this.commonService.checkAndLoadImage(
            file,
            'manual-transfer',
          );
          imageId = fileId.file_name;
        }

        const addDonation: any = {
          amount: manualTransferdto.amount,
          note: manualTransferdto.note,
          currency_code: resData.country_data.currency_code,
          currency: manualTransferdto.currency,
          transfer_date: new Date(moment(manualTransferdto.date).format()),
          transfer_amount: manualTransferdto.amount,
          receipt_number: manualTransferdto.receipt_number,
          status: 'completed',
          manual_transfer: true,
          receipt_image: imageId,
        };

        if (manualTransferdto.type == 'request-transfer') {
          (addDonation.request_id = ObjectID(manualTransferdto.id)),
            (addDonation.goal_amount = resData.form_data.goal_amount),
            (addDonation.total_donation = resData.total_donation),
            (addDonation.remaining_amount = resData.form_data.remaining_amount
              ? resData.form_data.remaining_amount
              : resData.form_data.goal_amount);
          addDonation.user_id = resData.user_id;
        } else {
          addDonation.ngo_id = ObjectID(manualTransferdto.id);
        }

        //save new request
        const createData = new this.adminTransactionModel(addDonation);
        const newRequest: any = await createData.save();

        if (manualTransferdto.type == 'request-transfer') {
          const total_donation = await this.adminTransactionModel
            .aggregate([
              {
                $match: {
                  request_id: ObjectID(manualTransferdto.id),
                },
              },
              {
                $group: {
                  _id: '$request_id',
                  total_transfer: {
                    $sum: '$amount',
                  },
                },
              },
            ])
            .exec();

          const total_transfer = total_donation[0].total_transfer;
          const remaining_transfer =
            Number(resData.form_data.goal_amount) -
            total_donation[0].total_transfer;

          const updateData: any = {
            transaction_time: new Date(),
            last_transaction: newRequest.transfer_amount,
            total_transfer: total_transfer,
            remaining_transfer:
              remaining_transfer <= 0 ? 0 : remaining_transfer,
          };

          if (
            (!_.isUndefined(manualTransferdto.mark_closed) &&
              manualTransferdto.mark_closed == 'true') ||
            total_transfer >= Number(resData.form_data.goal_amount)
          ) {
            updateData.status = 'close';
          }
          const query = {
            _id: ObjectID(manualTransferdto.id),
          };

          await this.causeRequestModel.updateOne(query, updateData).lean();
        }

        const logData: any = {
          action: 'transfer',
          entity_name: 'Manual Transfer',
        };

        if (manualTransferdto.type == 'request-transfer') {
          logData.request_id = resData._id;
          logData.description = `Manually transfer ${manualTransferdto.amount} to request - ${resData.reference_id}`;
        } else if (manualTransferdto.type == 'ngo-transfer') {
          logData.ngo_id = resData._id;
          logData.description = `Manually transfer ${manualTransferdto.amount} to NGO- ${resData?.form_data?.ngo_name}`;
        }

        this.logService.createAdminLog(logData);

        return res.send({
          message: mConfig.Manual_transfer,
          success: true,
          transaction_id: newRequest._id,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-manualTransfer',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for total amount of saayam
  public async adminSaayamAmount(param, res: any): Promise<TransactionModel> {
    this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

    try {
      const data = await this.transactionModel.aggregate([
        { $match: { saayam_community: true } },
        {
          $group: {
            _id: '$saayam_community',
            amount: { $sum: '$amount_usd' },
          },
        },
      ]);

      return res.json({
        success: true,
        totalAmount: data && data[0] && data[0].amount ? data[0].amount : 0,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-adminSaayamAmount',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for app cause request list
  public async findUserFoodRequestsNew(
    body: any,
    res: any,
  ): Promise<FoodRequestModel[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', body);

      const where = [];
      let geoNear = [];
      let query;
      let userD: any = {};
      let communityList = true;
      let includeBlocked = false;
      if (
        !_.isEmpty(body) &&
        !_.isEmpty(body.user_id) &&
        !_.isUndefined(body.user_id)
      ) {
        const userDetail = await this.userModel
          .findOne({ _id: body.user_id })
          .lean();
        query = {
          $or: [
            {
              ngo_donor_ids: { $in: [ObjectID(body.user_id)] },
            },
            {
              ngo_volunteer_ids: { $in: [ObjectID(body.user_id)] },
            },
            {
              donor_id: { $in: [ObjectID(body.user_id)] },
            },
            {
              volunteer_id: { $in: [ObjectID(body.user_id)] },
            },
            // { ngo_ids: { $in: [ObjectID(requestList.user_id)] } },
          ],
          status: { $nin: ['delivered', 'cancelled'] },
          is_deleted: { $ne: true },
        };

        if (
          !_.isEmpty(userDetail) &&
          !_.isEmpty(userDetail.ngo_data) &&
          !_.isUndefined(userDetail.ngo_data) &&
          !_.isEmpty(userDetail.ngo_data._id) &&
          !_.isUndefined(userDetail.ngo_data._id)
        ) {
          query['$or'].push(
            { ngo_ids: { $in: [ObjectID(userDetail.ngo_data._id)] } },
            { donor_ngo_id: ObjectID(userDetail.ngo_data._id) },
            { user_ngo_id: ObjectID(userDetail.ngo_data._id) },
            { volunteer_ngo_id: ObjectID(userDetail.ngo_data._id) },
          );
        }

        if (!_.isUndefined(body.just_for_you) && body.just_for_you == 1) {
          query['$or'].push({
            status: 'approve',
          });
        } else {
          query['$or'].push({
            status: 'approve',
            user_id: { $ne: ObjectID(body.user_id) },
            user_ngo_id: { $ne: ObjectID(userDetail?.ngo_data?._id) },
            'admins.user_id': { $ne: ObjectID(body?.user_id) },
          });
        }

        userD = {
          _id: body.user_id,
          ngo_id: userDetail?.ngo_data?._id,
        };

        //Filter for my request screen data
        if (!_.isUndefined(body.my_request) && body.my_request) {
          includeBlocked = true;
          communityList = false;
          query = {
            $or: [
              { user_id: ObjectID(body.user_id) },
              {
                user_ngo_id: ObjectID(userDetail?.ngo_data?._id),
                status: { $ne: 'draft' },
              },
              {
                admins: {
                  $elemMatch: {
                    user_id: ObjectID(body.user_id),
                    is_deleted: { $ne: true },
                  },
                },
                status: 'approve',
              },
            ],
            is_deleted: { $ne: true },
          };
        } else {
          where.push({
            $or: [
              {
                'country_data.country': body.country
                  ? body.country
                  : userDetail?.country_data?.country,
              },
              { category_slug: 'start-fund' },
            ],
          });

          const country = body.country;

          const region = await this.commonService.getRegionFromCountryCode(
            country,
          );

          if (region != '') {
            where.push({
              $or: [{ regions: { $in: [region] } }, { regions: { $size: 0 } }],
            });
          }

          where.push({
            $or: [
              { countries: { $in: [country] } },
              { countries: { $size: 0 } },
            ],
          });
        }
        if (
          (!_.isUndefined(body.home_screen) && body.home_screen) ||
          (!_.isUndefined(body.near_by) && body.near_by)
        ) {
          where.push({
            status: 'approve',
            category_slug: {
              $ne: 'hunger',
            },
          });
        }
        //Filter request based on race and religion
        if (!_.isUndefined(body.just_for_you) && body.just_for_you) {
          if (
            userDetail &&
            userDetail.race &&
            !_.isUndefined(userDetail.race) &&
            userDetail.race !== 'Prefer Not To Say'
          ) {
            where.push({
              'form_data.race': userDetail.race,
            });
          }
          if (
            userDetail &&
            userDetail.religion &&
            !_.isUndefined(userDetail.religion) &&
            userDetail.religion !== 'Prefer Not To Say'
          ) {
            where.push({
              'form_data.religion': userDetail.religion,
            });
          }
        }
      } else {
        //guest user request list
        query = {
          status: 'approve',
          is_deleted: { $ne: true },
          $or: [
            { 'country_data.country': body.country },
            { category_slug: 'start-fund' },
          ],
        };
      }

      if (!_.isUndefined(body) && !_.isEmpty(body)) {
        //Filter for request for
        if (body.request_for && !_.isUndefined(body.request_for)) {
          let query = {};
          if (body.request_for === 'self') {
            query = {
              $or: [
                { 'form_data.food_for_myself': true },
                { 'form_data.request_for_self': true },
              ],
            };
          } else if (body.request_for === 'other') {
            query = {
              $or: [
                { 'form_data.food_for_myself': false },
                { 'form_data.request_for_self': false },
              ],
            };
          }
          where.push(query);
        }

        //Filter for created request between from date to end date
        if (body.start_date && !_.isUndefined(body.start_date)) {
          const startDate = new Date(body.start_date + 'T00:00:00.000Z');
          where.push({
            createdAt: {
              $gte: startDate,
            },
          });
        }

        if (body.end_date && !_.isUndefined(body.end_date)) {
          const endDate = new Date(body.end_date + 'T23:59:59.000Z');
          where.push({
            createdAt: {
              $lte: endDate,
            },
          });
        }

        //Filter for request status
        if (!_.isUndefined(body.status) && body.status) {
          const filterArray = body.status;
          const statusArray = body.status;

          if (filterArray.includes('ongoing')) {
            statusArray.splice(statusArray.indexOf('ongoing'), 1);
            statusArray.push(
              'approve',
              'donor_accept',
              'volunteer_accept',
              'waiting_for_volunteer',
              'pickup',
            );
          }
          if (filterArray.includes('complete')) {
            statusArray.splice(statusArray.indexOf('complete'), 1);
            statusArray.push('complete', 'delivered');
          }
          if (filterArray.includes('reject')) {
            statusArray.splice(statusArray.indexOf('reject'), 1);
            statusArray.push('cancelled', 'reject');
          }
          const query = {
            status: {
              $in: statusArray,
            },
          };
          where.push(query);
        }
        if (
          !_.isUndefined(body.status) &&
          body.status &&
          body.status === 'featured'
        ) {
          where.push({
            is_featured: true,
          });
        }

        //Filter for selected causes requets
        if (
          !_.isUndefined(body.category_slug) &&
          !_.isEmpty(body.category_slug)
        ) {
          where.push({
            category_slug: { $in: body.category_slug },
          });
        }

        if (!_.isEmpty(where)) {
          query['$and'] = where;
        }

        //Filter for find near by fundraiser requests
        if (
          !_.isUndefined(body.user_lat) &&
          body.user_lat != '' &&
          !_.isUndefined(body.user_long) &&
          body.user_long != ''
        ) {
          const maximumRadius = await this.queueService.getSetting(
            'maximum-radius',
          );

          const maximumRadInMeter = !_.isUndefined(body.maximum_radius)
            ? Number(body.maximum_radius)
            : maximumRadius;

          const latitude = Number(body.user_lat) || 0;
          const longitude = Number(body.user_long) || 0;
          geoNear = [
            {
              $geoNear: {
                near: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                },
                distanceField: 'distance',
                distanceMultiplier: 0.001,
                key: 'location',
                maxDistance: maximumRadInMeter * 1000,
                minDistance: 0,
                spherical: true,
              },
            },
          ];

          userD.user_lat = latitude;
          userD.user_long = longitude;
          userD.maximum_radius = maximumRadInMeter;
        }

        //Filter for find requests which contains remaining amount between selected remaining amount
        if (
          !_.isUndefined(body.remaining_amt_from) &&
          body.remaining_amt_from !== '' &&
          !_.isUndefined(body.remaining_amt_to) &&
          body.remaining_amt_to !== ''
        ) {
          query['form_data.remaining_amount'] = {
            $gte: body.remaining_amt_from,
            $lte: body.remaining_amt_to,
          };
        }

        //Filter for find requests thar are expired soon
        if (
          !_.isUndefined(body.fundraiser_closing_soon) &&
          body.fundraiser_closing_soon == true
        ) {
          const closingInDays = await this.queueService.getSetting(
            'fundraiser-closing-soon-in-days',
          );

          const closingDate = moment()
            .tz('UTC')
            .add(closingInDays, 'd')
            .endOf('day')
            .toISOString();
          query['form_data.expiry_date'] = {
            $gte: new Date(),
            $lte: new Date(closingDate),
          };
        }

        //Filter for find urgent requests
        if (!_.isUndefined(body.is_urgent) && body.is_urgent == true) {
          query['form_data.urgent_help_status'] = 'approve';
        }
      }

      const sortData = ['_id', 'createdAt', 'approve_time'];

      const Union = {
        $unionWith: {
          coll: 'fund',
        },
      };
      const total = await this.requestModel.aggregate([
        Union,
        ...geoNear,
        {
          $lookup: {
            from: 'ngo', // collection name in db
            localField: 'user_ngo_id',
            foreignField: '_id',
            as: 'ngoData',
          },
        },
        {
          $set: {
            countries: {
              $ifNull: ['$countries', []],
            },
            regions: {
              $ifNull: ['$regions', []],
            },
            admins: {
              $ifNull: ['$admins', []],
            },
            category_slug: {
              $ifNull: ['$category_slug', 'start-fund'],
            },
          },
        },
        { $match: query },
        {
          $unwind: {
            path: '$ngoData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: { 'ngoData.is_deleted': { $ne: true } },
        },
        {
          $group: {
            _id: '$_id',
            ngoDatas: { $first: '$ngoData' },
          },
        },
        {
          $project: {
            _id: '$request_data._id',
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
          },
        },
        {
          $unwind: {
            path: '$ngo_Data',
            preserveNullAndEmptyArrays: includeBlocked,
          },
        },
        { $count: 'count' },
      ]);

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      if (!_.isUndefined(body.home_screen) && body.home_screen) {
        const result = await this.queueService.getSetting(
          'home-screen-per-page',
        );
        body.per_page = !_.isEmpty(result) ? result : 5;
      }

      let {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        body.page,
        body.per_page,
        total_record,
        sortData,
        body.sort_type,
        'createdAt',
      );

      if (communityList) {
        const sortList = {
          'form_data.urgent_help': -1,
          approve_time: -1,
        };
        sort = sortList;
      } else {
        const sortList = {
          sort: 1,
          _id: -1,
        };
        sort = sortList;
      }

      const data = await this.commonService.getAllRequestListWithTransactionNew(
        query,
        sort,
        start_from,
        per_page,
        userD,
        includeBlocked,
      );

      return res.json({
        data,
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
        'src/controller/request/request.service.ts-findUserFoodRequests',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for send invite to user
  public async sendInvite(sendInviteDto: SendInviteDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        sendInviteDto,
      );
      const user_id = this.request.user._id;
      const requestData = await this.requestModel
        .findOne({
          _id: ObjectID(sendInviteDto.request_id),
          user_id: ObjectID(user_id),
        })
        .select({
          _id: 1,
          category_slug: 1,
          user_id: 1,
          category_name: 1,
          reference_id: 1,
          admins: 1,
        })
        .lean();
      if (_.isEmpty(requestData)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const newAdmins: any = requestData?.admins ? requestData?.admins : [];
        const userIDs = [];
        sendInviteDto.admins.map((item: any) => {
          item.user_id = ObjectID(item.user_id);
          item.status = 'pending';
          item.created_at = new Date();
          item.updated_at = new Date();
          userIDs.push(item.user_id);
          newAdmins.push(item);
        });
        await this.requestModel
          .findByIdAndUpdate(requestData._id, { admins: newAdmins })
          .lean();
        const title = await this.commonService.changeString(
          mConfig.noti_title_invite_in_fundraiser,
          { '{{cause}}': requestData.category_name },
        );

        const msg = await this.commonService.changeString(
          mConfig.noti_msg_invite_in_fundraiser,
          {
            '{{cause}}': requestData.category_name,
            '{{refId}}': requestData.reference_id,
          },
        );
        const input: any = {
          title: title,
          type: 'fundraiser_admin',
          requestId: requestData._id,
          categorySlug: requestData.category_slug,
          requestUserId: requestData.user_id,
          message: msg,
          additionalData: {
            status: 'pending',
            request_admin: true,
          },
        };

        await this.commonService.sendAllNotification(
          userIDs,
          input,
          false,
          true,
        );
        return res.json({
          success: true,
          message: mConfig.send_invite,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-sendInvite',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for user to accept/reject fundraiser invitation
  public async verifyFundraiserInvite(
    verifyFundraiserInvite: VerifyFundraiserInvite,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        verifyFundraiserInvite,
      );
      const userDetail = this.request.user;
      const reqData: any = await this.requestModel
        .findOne({
          _id: ObjectID(verifyFundraiserInvite.request_id),
          'admins.user_id': this.request.user._id,
        })
        .select({
          _id: 1,
          user_id: 1,
          reference_id: 1,
          category_name: 1,
          category_slug: 1,
          'form_data.title_of_fundraiser': 1,
          admins: 1,
        })
        .lean();
      if (_.isEmpty(reqData)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const findUser = reqData.admins.find(
          (i: any) => i.user_id.toString() == userDetail._id.toString(),
        );
        if (!_.isEmpty(findUser) && findUser.status == 'approve') {
          const message = await this.commonService.changeString(
            mConfig.already_join_in_fundraiser,
            { '{{cause}}': reqData.category_name },
          );

          return res.json({
            success: false,
            message,
          });
        } else {
          let notiTitle;
          let notiMsg;
          let status;
          let newUpdatedData;
          const updateData = {
            '{{uname}}': userDetail.first_name + ' ' + userDetail.last_name,
            '{{cause}}': reqData.category_name,
            '{{refId}}': reqData.reference_id,
          };
          if (verifyFundraiserInvite.status === 'approve') {
            status = 'approve';
            newUpdatedData = {
              $set: {
                'admins.$.status': 'approve',
                'admins.$.join_time': new Date(),
                'admins.$.updated_at': new Date(),
              },
            };

            //set notification text for fundraiser user
            notiTitle = mConfig.noti_title_fundraiser_invite_accepted;
            notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_fundraiser_invite_accepted,
              updateData,
            );
          } else if (verifyFundraiserInvite.status === 'reject') {
            status = 'reject';
            newUpdatedData = {
              $set: {
                'admins.$.status': 'reject',
                'admins.$.reject_time': new Date(),
                'admins.$.updated_at': new Date(),
              },
            };

            //set notification text for fundraiser user
            notiTitle = mConfig.noti_title_fundraiser_invite_rejected;
            notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_fundraiser_invite_rejected,
              updateData,
            );
          }

          await this.requestModel
            .findOneAndUpdate(
              {
                _id: ObjectID(verifyFundraiserInvite.request_id),
                'admins.user_id': this.request.user._id,
              },
              newUpdatedData,
              { new: true },
            )
            .select({ _id: 1 })
            .lean();

          await this.corporateNotification
            .updateMany(
              {
                user_id: ObjectID(userDetail._id),
                request_id: ObjectID(reqData._id),
                'additional_data.status': 'pending',
              },
              {
                $set: {
                  'additional_data.status': status,
                },
              },
            )
            .lean();

          //send notification to fundraiser created user
          const input: any = {
            title: notiTitle,
            type: 'fundraiser_admin',
            requestId: reqData._id,
            categorySlug: reqData.category_slug,
            message: notiMsg,
            userId: reqData.user_id,
            requestUserId: reqData.user_id,
          };
          this.commonService.notification(input);

          //send notification to admin
          if (verifyFundraiserInvite.status === 'approve') {
            const input1: any = {
              title: notiTitle,
              type: reqData.category_slug,
              requestId: reqData._id,
              message: notiMsg,
            };
            this.commonService.sendAdminNotification(input1);
          }

          return res.json({
            success: true,
            message:
              verifyFundraiserInvite.status === 'approve'
                ? mConfig.invite_accepted
                : mConfig.invite_rejected,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-verifyFundraiserInvite',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get user detail by email and number
  public async userByMailPhone(getUserByMailDto: GetUserByMailDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        getUserByMailDto,
      );
      const userId = this.request.user._id;
      const query: any = {
        $or: [
          {
            phone: new RegExp(getUserByMailDto.phone.trim(), 'i'),
          },
          {
            email: new RegExp(getUserByMailDto.phone.trim(), 'i'),
          },
          {
            user_name: new RegExp(getUserByMailDto.phone.trim(), 'i'),
          },
        ],
        is_deleted: false,
        is_guest: { $ne: true },
        _id: { $ne: ObjectID(userId) },
      };

      if (
        !_.isUndefined(getUserByMailDto.active_type) &&
        !_.isEmpty(getUserByMailDto.active_type) &&
        getUserByMailDto.active_type === 'corporate'
      ) {
        query['$and'] = [
          { corporate_id: ObjectID(getUserByMailDto.corporate_id) },
        ];
      }

      if (
        !_.isUndefined(getUserByMailDto.admins) &&
        !_.isEmpty(getUserByMailDto.admins)
      ) {
        query.stringID = { $nin: getUserByMailDto.admins };
      }

      const existUser = await this.userModel.aggregate(
        [
          {
            $addFields: {
              stringID: { $toString: '$_id' },
              user_name: { $concat: ['$first_name', ' ', '$last_name'] },
            },
          },
          { $match: query },
          {
            $lookup: {
              from: 'requests',
              let: {
                id: '$_id',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$_id', ObjectID(getUserByMailDto.request_id)],
                        },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    admins: 1,
                  },
                },
              ],
              as: 'v',
            },
          },
          {
            $unwind: {
              path: '$v',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              display_name: 1,
              user_name: 1,
              first_name: 1,
              last_name: 1,
              email: 1,
              phone: 1,
              phone_code: 1,
              phone_country_short_name: 1,
              image: {
                $ifNull: [
                  { $concat: [authConfig.imageUrl, 'user/', '$image'] },
                  null,
                ],
              },
              is_deleted: 1,
              invited: {
                $sum: {
                  $map: {
                    input: '$v.admins',
                    as: 'admin',
                    in: {
                      $cond: [
                        {
                          $and: [
                            {
                              $eq: ['$$admin.user_id', '$_id'],
                            },
                            {
                              $eq: ['$$admin.status', 'pending'],
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              admin: {
                $sum: {
                  $map: {
                    input: '$v.admins',
                    as: 'admin',
                    in: {
                      $cond: [
                        {
                          $and: [
                            {
                              $eq: ['$$admin.user_id', '$_id'],
                            },
                            {
                              $eq: ['$$admin.status', 'approve'],
                            },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            },
          },
          { $limit: 10 },
          { $sort: { first_name: 1 } },
        ],
        { collation: authConfig.collation },
      );

      if (_.isEmpty(existUser)) {
        return res.json({
          success: false,
          message: mConfig.User_not_found,
          data: [],
        });
      } else {
        return res.json({
          success: true,
          data: existUser,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-userByMailPhone',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //fundraiser admin list
  public async adminList(id: string, param: any, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {};
      const query: any = {
        is_deleted: { $ne: true },
        $or: [{ 'admins.status': param.status }],
      };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        if (!_.isUndefined(filter.name) && filter.name) {
          match['$or'] = [
            { user_name: new RegExp(filter.name, 'i') },
            { 'user_data.email': new RegExp(filter.name, 'i') },
            { 'user_data.phone': new RegExp(filter.name, 'i') },
          ];
        }
      }

      const addFields = {
        $addFields: {
          user_name: {
            $concat: ['$user_data.first_name', ' ', '$user_data.last_name'],
          },
        },
      };
      const total = await this.requestModel
        .aggregate([
          {
            $match: { _id: ObjectID(id) },
          },
          {
            $unwind: '$admins',
          },
          {
            $match: query,
          },
          {
            $lookup: {
              from: 'user',
              localField: 'admins.user_id',
              foreignField: '_id',
              as: 'user_data',
            },
          },
          {
            $unwind: '$user_data',
          },
          addFields,
          {
            $match: match,
          },
          { $count: 'count' },
        ])
        .exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      const sortData = {
        _id: '_id',
      };

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
      const adminsData = await this.requestModel
        .aggregate([
          addFields,
          {
            $match: { _id: ObjectID(id) },
          },
          {
            $unwind: '$admins',
          },
          {
            $match: query,
          },
          {
            $lookup: {
              from: 'user',
              localField: 'admins.user_id',
              foreignField: '_id',
              as: 'user_data',
            },
          },
          {
            $unwind: '$user_data',
          },
          {
            $lookup: {
              from: 'fundraiser_activity_log',
              let: { id: '$_id', userId: '$user_data._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$user_id', '$$userId'] },
                        { $eq: ['$request_id', '$$id'] },
                      ],
                    },
                  },
                },
              ],
              as: 'log_data',
            },
          },
          addFields,
          {
            $match: match,
          },
          {
            $project: {
              _id: 1,
              user_id: '$admins.user_id',
              user_name: 1,
              email: '$user_data.email',
              phone: '$user_data.phone',
              phone_code: '$user_data.phone_code',
              phone_country_short_name: '$user_data.phone_country_short_name',
              user_image: {
                $concat: [authConfig.imageUrl, 'user/', '$user_data.image'],
              },
              allow_to_edit_details: '$admins.allow_to_edit_details',
              allow_to_update_status: '$admins.allow_to_update_status',
              allow_to_change_bank_details:
                '$admins.allow_to_change_bank_details',
              status: '$admins.status',
              created_at: '$admins.created_at',
              updated_at: '$admins.updated_at',
              join_time: '$admins.join_time',
              activity_log_count: { $size: '$log_data' },
            },
          },
          { $skip: start_from },
          { $limit: per_page },
        ])
        .exec();

      return res.json({
        data: adminsData,
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
        'src/controller/request/request.service.ts-adminList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for remove admin from fundraiser
  public async removeAdmin(removeAdminDto: RemoveAdminDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        removeAdminDto,
      );
      const userDetail = this.request.user;
      const result: any = await this.requestModel
        .findOneAndUpdate(
          {
            _id: ObjectID(removeAdminDto.id),
            is_deleted: { $ne: true },
            admins: {
              $elemMatch: {
                user_id: ObjectID(removeAdminDto.user_id),
                status: { $in: ['pending', 'approve'] },
              },
            },
          },
          {
            $set: {
              'admins.$.status': 'remove',
              'admins.$.remove_time': new Date(),
              'admins.$.updated_time': new Date(),
            },
          },
          { new: true },
        )
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          user_id: 1,
          reference_id: 1,
          category_name: 1,
          category_slug: 1,
          admins: 1,
        })
        .lean();

      if (!result) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        //send notification to user
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_removed_from_fundraiser,
          {
            '{{uname}}': userDetail.display_name,
            '{{cause}}': result.category_name,
            '{{refId}}': result.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_removed_from_fundraiser,
          type: 'fundraiser_admin',
          categorySlug: result.category_slug,
          requestId: result._id,
          message: msg,
          userId: removeAdminDto.user_id,
          requestUserId: result.user_id,
        };

        await this.commonService.notification(input);

        return res.send({
          success: true,
          message: mConfig.Admin_removed,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-removeAdmin',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for return fundraiser admin count status wise
  public async manageAdminCount(request_id, res: any) {
    try {
      const data = await this.requestModel.aggregate([
        { $match: { _id: ObjectID(request_id) } },
        {
          $project: {
            pending_admins: {
              $sum: {
                $map: {
                  input: '$admins',
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
                  input: '$admins',
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
                  input: '$admins',
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
                  input: '$admins',
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
          },
        },
      ]);
      return res.json({ success: true, data: data[0] });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-manageAdminCount',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for manage request permission
  public async managePermission(
    managePermissionDto: ManagePermissionDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        managePermissionDto,
      );
      const reqData: any = await this.requestModel
        .findOne({
          _id: ObjectID(managePermissionDto.request_id),
          is_deleted: { $ne: true },
          'admins.user_id': ObjectID(managePermissionDto.user_id),
          'admins.status': { $in: ['pending', 'approve'] },
        })
        .select({
          _id: 1,
          reference_id: 1,
          user_id: 1,
          category_slug: 1,
          category_name: 1,
          fundraiser_name: '$form_data.title_of_fundraiser',
        })
        .lean();

      if (!reqData) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const inviteVolunteerData = {
          'admins.$.allow_to_update_status':
            managePermissionDto.allow_to_update_status,
          'admins.$.allow_to_edit_details':
            managePermissionDto.allow_to_edit_details,
          'admins.$.allow_to_change_bank_details':
            managePermissionDto.allow_to_change_bank_details,
          'admins.$.updated_at': new Date(),
        };

        await this.requestModel
          .updateOne(
            {
              _id: ObjectID(managePermissionDto.request_id),
              'admins.user_id': ObjectID(managePermissionDto.user_id),
            },
            inviteVolunteerData,
          )
          .lean();

        //send hidden notification to volunteer
        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_fundraiser_manage_permission,
          {
            '{{cause}}': reqData.category_name,
          },
        );
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_fundraiser_permission_changed,
          {
            '{{cause}}': reqData.category_name,
            '{{refId}}': reqData.reference_id,
          },
        );

        const input: any = {
          title: notiTitle,
          type: 'manage-permission',
          requestId: reqData._id,
          categorySlug: reqData.category_slug,
          requestUserId: reqData.user_id,
          message: notiMsg,
          userId: managePermissionDto.user_id,
        };
        this.commonService.notification(input);

        return res.json({
          success: true,
          message: mConfig.manage_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-managePermission',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for Check uhid
  public async checkUser(checkUhidDto: CheckUhidDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        checkUhidDto,
      );
      const obj = {};
      const array = [];
      const key = checkUhidDto.column;
      const value = checkUhidDto.value;
      let modelName: any = this.requestModel;
      let categorySlug = checkUhidDto.category_slug;
      const userDetail = this.request.user;

      if (categorySlug === 'fund') {
        modelName = this.fundModel;
        categorySlug = 'start-fund';
      } else if (categorySlug === 'drive') {
        modelName = this.driveModel;
        categorySlug = 'saayam-drive';
      }

      obj[key] = value;
      obj['form_data.' + key] = value;
      array.push(obj);

      const query: any = {
        user_id: userDetail._id,
        status: { $nin: ['draft', 'close'] },
        is_deleted: { $ne: true },
        category_slug: categorySlug,
        $or: array,
      };

      const uhidCount = await modelName.count(query).lean();

      if (uhidCount > 0) {
        return res.json({
          success: false,
          message: checkUhidDto.column + ' already exist',
        });
      } else {
        return res.json({
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-checkUser',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  public async lastRequestHistory(request_id, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'get',
        request_id,
      );

      const data = await this.requestHistoryModel.aggregate([
        { $match: { request_id: ObjectID(request_id) } },
        { $unset: 'form_data.images' },
        {
          $project: {
            image_url: authConfig.imageUrl + 'request/',
            _id: 1,
            form_data: 1,
            location: 1,
            previous_status: 1,
          },
        },
        { $sort: { _id: -1 } },
      ]);

      if (data && !_.isEmpty(data[0])) {
        return res.json({ success: true, data: data[0] });
      } else {
        return res.json({ success: false, message: mConfig.No_data_found });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-lastRequestHistory',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get request category_slug
  public async getCategorySlug(request_id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        request_id,
      );

      const request: any = await this.requestModel
        .findOne({
          _id: ObjectID(request_id),
        })
        .select({ category_slug: 1 })
        .lean();

      if (!request) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        return res.json({
          success: true,
          data: request,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/request.service.ts-getCategorySlug',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
