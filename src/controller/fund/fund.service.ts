/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import admin, { ServiceAccount } from 'firebase-admin';
import { Fund, FundDocument } from './entities/fund.entity';
import { VerifyFundDto } from './dto/verify-fund.dto';
import mConfig from '../../config/message.config.json';
import { QueueService } from '../../common/queue.service';
import { CommonService } from '../../common/common.service';
import firebaseJson from '../../config/firebase.config.json';
import { ErrorlogService } from '../error-log/error-log.service';
import { UpdateFundCausesDto } from './dto/update-fund-causes.dto';
import { authConfig } from '../../config/auth.config';
import { PaymentProcessDto } from './dto/payment-process.dto';
import { StripeService } from 'src/stripe/stripe.service';
import { FundDonateDto } from './dto/fund-donate.dto';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
import { GetUserByMailDto } from './dto/get-user.dto';
import { ExchangeRatesDto } from './dto/exchange-rates.dto';
import { User, UserDocument } from '../users/entities/user.entity';
import {
  Notification,
  NotificationDocument,
} from '../notification/entities/notification.entity';
import {
  PaymentProcessDocument,
  PaymentProcessModel,
} from '../donation/entities/payment-process.entity';
import { RequestService } from '../request/request.service';
import {
  CommonSetting,
  CommonSettingDocument,
} from '../setting/entities/common-setting.entity';
import {
  TransactionModel,
  TransactionDocument,
} from '../donation/entities/transaction.entity';
import { ViewReceiptDto } from './dto/view-receipt.dto';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../request/entities/cause-request.entity';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.entity';
import { LogService } from 'src/common/log.service';
import {
  CurrencyDocument,
  CurrencyModel,
} from '../currency/entities/currency.entity';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class FundService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private jwtService: JwtService,
    private httpService: HttpService,
    private readonly queueService: QueueService,
    private readonly usersService: UsersService,
    private readonly requestService: RequestService,
    private readonly stripeService: StripeService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Fund.name) private fundModel: Model<FundDocument>,
    @InjectModel(PaymentProcessModel.name)
    private paymentProcessModel: Model<PaymentProcessDocument>,
    @InjectModel(CommonSetting.name)
    private commonSettingModel: Model<CommonSettingDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
    @InjectModel(Ngo.name)
    private ngoModel: Model<NgoDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
  ) {}

  //Api for Create Fund
  public async fundCreate(createFundDto: any, res: any): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        createFundDto,
      );

      let data = JSON.parse(createFundDto.data);

      const userDetail = this.request.user;
      let countryData = userDetail.country_data;
      const formData: any = {
        form_data: {
          files: {},
          images: {},
        },
        user_id: ObjectID(userDetail._id),
        active_type: createFundDto.active_type || null,
        fund_causes: createFundDto.fund_causes,
        regions: createFundDto.regions,
        countries: createFundDto.countries,
        admins: createFundDto.admins,
        category_slug: 'start-fund',
      };
      const currentDate = new Date();
      // If user create request as ngo role then add ngo id
      if (createFundDto.active_type === 'ngo') {
        formData.user_ngo_id = ObjectID(userDetail.ngo_data._id);
        countryData = userDetail.ngo_data.country_data;
      }
      // If user create request as corporate role then add corporate id
      else if (createFundDto.active_type === 'corporate') {
        formData.corporate_id = ObjectID(userDetail.corporate_data._id);
        countryData = userDetail.corporate_data.country_data;
      }
      if (createFundDto.form_type === 'draft') {
        formData.status = 'draft';
      } else {
        const autoApprove = await this.queueService.getSetting(
          'auto-approve-fund',
        );
        if (autoApprove.toLowerCase() == 'yes') {
          formData.status = 'approve';
          formData.approve_time = currentDate;
        } else {
          formData.status = 'pending';
          if (
            createFundDto.active_type === 'corporate' &&
            userDetail.corporate_data &&
            _.includes(
              userDetail?.corporate_data?.permissions,
              'auto_approve_fund',
            )
          ) {
            formData.status = 'approve';
          }
        }
      }
      formData.createdAt = currentDate;
      formData.updatedAt = currentDate;

      //Call checkValidation function for inputs validation
      const { data1, formData1, haveError } =
        await this.requestService.checkValidation(
          data,
          formData,
          null,
          createFundDto.form_type,
          createFundDto.active_type,
          'fund',
          userDetail,
        );

      data = JSON.stringify(data1);
      formData1.form_settings = data;
      formData1.country_data = {
        country: countryData.country,
        country_code: countryData.country_code,
        currency: countryData.currency[0].symbol,
        currency_code: countryData.currency[0].name,
      };
      formData1.country_code = countryData.country_code;

      // //If there is an error in inputs validation then return error
      if (haveError) {
        return res.json({
          success: false,
          data,
        });
      }
      if (createFundDto.form_type !== 'draft') {
        // Call generateUniqueId function for generate short reference id for request
        const referenceId = await this.commonService.generateUniqueId(
          countryData.country_code,
        );
        formData1.reference_id = referenceId;
      }

      const defaultAdmin = [
        {
          user_id: ObjectID(this.request.user._id),
          invite_fund_admin: true,
          donate_to_fundraiser: true,
          fund_organizer: true,
          allow_edit: true,
          max_donate_amount: null,
        },
      ];

      formData1.admins = defaultAdmin;
      const notiAdmins = [];
      if (createFundDto.admins && !_.isEmpty(createFundDto.admins)) {
        const admins = createFundDto.admins;
        const newAdmins = [];
        admins.map((data) => {
          if (data != this.request.user._id.toString()) {
            newAdmins.push({
              user_id: ObjectID(data),
              invite_fund_admin: false,
              donate_to_fundraiser: false,
              fund_organizer: false,
              allow_edit: false,
              max_donate_amount: null,
            });
            notiAdmins.push(data);
          }
        });
        formData1.admins = newAdmins.concat(defaultAdmin);
      }

      let result;
      if (
        createFundDto.draft_id &&
        !_.isUndefined(createFundDto.draft_id) &&
        !_.isEmpty(createFundDto.draft_id)
      ) {
        result = await this.fundModel
          .findByIdAndUpdate(
            { _id: createFundDto.draft_id },
            { $set: formData1 },
            { new: true },
          )
          .lean();
      } else {
        const createFund = new this.fundModel(formData1);
        result = await createFund.save();
      }
      if (_.isEmpty(result)) {
        return res.json({
          success: false,
          message: mConfig.Invalid,
        });
      } else {
        if (formData1.form_data && formData1.form_data.files) {
          const files = formData1.form_data.files;

          // All images are in "requestData.files" move upload images rom tmp to request folder
          for (const key in files) {
            files[key].map(async (item) => {
              // await this.commonService.moveImageIntoSitefolder(item, 'request');
              await this.commonService.uploadFileOnS3(
                item,
                'fund/' + result._id,
              );
            });
          }
        }

        // Remove files from request folder
        if (
          !_.isEmpty(createFundDto.removed_files) &&
          createFundDto.removed_files
        ) {
          const removedFiles = createFundDto.removed_files;
          await Promise.all(
            removedFiles.map(async (item: any) => {
              await this.commonService.unlinkFileFunction(
                'fund/' + result._id,
                item,
              );
            }),
          );
        }

        if (!_.isEmpty(notiAdmins) && result.status != 'draft') {
          const title = await this.commonService.changeString(
            mConfig.noti_title_fund_created,
            { '{{fund_name}}': result?.form_data?.title_of_fundraiser || '' },
          );
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_fund_created,
            {
              '{{uname}}': userDetail.display_name,
              '{{fund_name}}': result?.form_data?.title_of_fundraiser || '',
              '{{refId}}': result.reference_id,
            },
          );
          //send notification to admins
          const input: any = {
            title: title,
            type: 'fund',
            fundId: result._id,
            categorySlug: 'fund',
            requestUserId: result.user_id,
            message: msg,
          };
          //remove user_id from array
          this.commonService.sendAllNotification(notiAdmins, input);

          const admMsg = await this.commonService.changeString(
            mConfig.noti_msg_fund_create,
            {
              '{{uname}}': userDetail.display_name,
              '{{fund_name}}': result?.form_data?.title_of_fundraiser || '',
            },
          );

          const input2: any = {
            title: mConfig.noti_title_fund_create,
            type: 'fund',
            categorySlug: 'fund',
            fundId: result._id,
            message: admMsg,
          };
          this.commonService.sendAdminNotification(input2);
        }
        return res.json({
          message:
            createFundDto.form_type === 'main'
              ? mConfig.fund_created
              : mConfig.Draft_saved,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-fundCreate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update fund causes
  public async updateFundCauses(
    updateFundCausesDto: UpdateFundCausesDto,
    res: any,
  ): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateFundCausesDto,
      );
      const updateData = {
        fund_causes: updateFundCausesDto.causes,
      };

      const fundData = await this.fundModel
        .findByIdAndUpdate(updateFundCausesDto.fund_id, updateData, {
          new: true,
        })
        .select({ _id: 1 })
        .lean();

      if (!fundData) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        return res.json({
          message: mConfig.fund_cause_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-updateFundCauses',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api For Fund List
  public async getFundList(body, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', body);

      let country = [];
      const userDetail = this.request.user;

      let region = [];
      const match: any = {
        is_deleted: { $ne: true },
        status: 'approve',
      };

      if (
        !_.isUndefined(body.corporate) &&
        body.corporate == 1 &&
        !_.isUndefined(userDetail._id)
      ) {
        match.active_type = 'corporate';
        match.corporate_id = ObjectID(userDetail?.corporate_data?._id);
      } else {
        match.active_type = { $ne: 'corporate' };
      }
      if (!_.isEmpty(body.country) && body.country != 'all') {
        country = body.country;
        let regionData = await this.currencyModel
          .find({
            $or: [
              { country: { $in: country } },
              { country_code: { $in: country } },
            ],
          })
          .select('region')
          .lean();
        region = await regionData.map((item) => item.region);
      }

      const where = [];
      if (!_.isEmpty(region)) {
        where.push({
          $or: [{ regions: { $in: region } }, { regions: { $size: 0 } }],
        });
      }
      where.push({
        $or: [{ countries: { $in: country } }, { countries: { $size: 0 } }],
      });
      if (!_.isUndefined(body.search)) {
        where.push({
          'form_data.title_of_fundraiser': new RegExp(body.search, 'i'),
        });
      }
      if (!_.isEmpty(body.category_slug) && body.category_slug != 'all') {
        where.push({
          fund_causes: { $in: body.category_slug },
        });
      }

      if (!_.isEmpty(where)) {
        match['$and'] = where;
      }
      const sortData = {
        _id: '_id',
        createdAt: 'createdAt',
        'form_data.title_of_fundraiser': 'form_data.title_of_fundraiser',
      };

      if (
        (!_.isUndefined(body.sort_by) && body.sort_by == 'asce') ||
        body.sort_by == 'desc'
      ) {
        body.sort = 'form_data.title_of_fundraiser';
        body.sort_type = body.sort_by == 'asce' ? 1 : -1;
      }

      if (
        (!_.isUndefined(body.sort_by) && body.sort_by == 'new_to_old') ||
        body.sort_by == 'old_to_new'
      ) {
        body.sort = 'createdAt';
        body.sort_type = body.sort_by == 'old_to_new' ? 1 : -1;
      }
      const total = await this.fundModel
        .aggregate([
          {
            $match: match,
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
          {
            $match: {
              'ngoData.is_deleted': { $ne: true },
            },
          },
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
        body.page,
        body.per_page,
        total_record,
        sortData,
        body.sort_type,
        body.sort,
      );
      const result = await this.fundModel.aggregate([
        {
          $match: match,
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
        {
          $match: {
            'ngoData.is_deleted': { $ne: true },
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
              {
                $project: {
                  _id: 1,
                  converted_amt: 1,
                  donor_user_id: 1,
                },
              },
            ],
            as: 'donations',
          },
        },
        {
          $lookup: {
            from: 'user',
            let: { user_id: '$user_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$user_id'] }],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  image: 1,
                },
              },
            ],
            as: 'userData',
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
                      { $eq: ['$category_slug', '$$category_slug'] },
                      { $eq: ['$user_id', ObjectID(userDetail._id)] },
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
          $unwind: {
            path: '$userData',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            _id: 1,
            fund_type: 1,
            fund_causes: 1,
            createdAt: 1,
            corporate_id: 1,
            active_type: 1,
            status: 1,
            category_slug: 'start-fund',
            raised: { $sum: '$donations.converted_amt' },
            user_id: '$userData._id',
            user_name: {
              $concat: ['$userData.first_name', ' ', '$userData.last_name'],
            },
            user_image: {
              $ifNull: [
                {
                  $concat: [authConfig.imageUrl, 'user/', '$userData.image'],
                },
                null,
              ],
            },
            image_url: {
              $concat: [
                authConfig.imageUrl,
                'fund/',
                { $toString: '$_id' },
                '/',
              ],
            },
            country_data: 1,
            reference_id: 1,
            'form_data.title_of_fundraiser': '$form_data.title_of_fundraiser',
            'form_data.describe_your_fund': '$form_data.describe_your_fund',
            'form_data.how_the_funds_will_be_used':
              '$form_data.how_the_funds_will_be_used',
            'form_data.files.photos': {
              $map: {
                input: '$form_data.files.photos',
                as: 'photo',
                in: {
                  $concat: [
                    authConfig.imageUrl,
                    'fund/',
                    { $toString: '$_id' },
                    '/',
                    { $toString: '$$photo' },
                  ],
                },
              },
            },
            total_donors: {
              $size: { $setUnion: ['$donations.donor_user_id', []] },
            },
            is_bookmark: {
              $cond: {
                if: { $gt: ['$bookmarkData', null] },
                then: true,
                else: false,
              },
            },
          },
        },
        { $sort: sort },
        { $skip: start_from },
        { $limit: per_page },
      ]);

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
        'src/controller/fund/fund.service.ts-getFundList',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api For ngo Fund List
  public async getNgoFundList(body, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', body);

      const match: any = {
        is_deleted: { $ne: true },
        status: 'approve',
        active_type: 'ngo',
        user_ngo_id: ObjectID(body.ngo_id),
      };

      if (body.home_screen && body.home_screen == 1) {
        const result = await this.queueService.getSetting(
          'home-screen-per-page',
        );
        body.per_page = !_.isEmpty(result) ? result : 5;
      }
      const total_record = await this.fundModel.countDocuments(match).exec();
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
        null,
        body.sort_type,
        body.sort,
      );

      const result = await this.fundModel.aggregate(
        [
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
                {
                  $project: {
                    _id: 1,
                    converted_amt: 1,
                    donor_user_id: 1,
                  },
                },
              ],
              as: 'donations',
            },
          },
          {
            $lookup: {
              from: 'user',
              let: { user_id: '$user_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$_id', '$$user_id'] }],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    first_name: 1,
                    last_name: 1,
                    image: 1,
                  },
                },
              ],
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
            $match: match,
          },
          {
            $project: {
              _id: 1,
              fund_type: 1,
              fund_causes: 1,
              createdAt: 1,
              corporate_id: 1,
              active_type: 1,
              status: 1,
              category_slug: 'start-fund',
              raised: { $sum: '$donations.converted_amt' },
              user_id: '$userData._id',
              user_name: {
                $concat: ['$userData.first_name', ' ', '$userData.last_name'],
              },
              user_image: {
                $ifNull: [
                  {
                    $concat: [authConfig.imageUrl, 'user/', '$userData.image'],
                  },
                  null,
                ],
              },
              image_url: {
                $concat: [
                  authConfig.imageUrl,
                  'fund/',
                  { $toString: '$_id' },
                  '/',
                ],
              },
              country_data: 1,
              reference_id: 1,
              'form_data.title_of_fundraiser': '$form_data.title_of_fundraiser',
              'form_data.describe_your_fund': '$form_data.describe_your_fund',
              'form_data.how_the_funds_will_be_used':
                '$form_data.how_the_funds_will_be_used',
              'form_data.files.photos': {
                $map: {
                  input: '$form_data.files.photos',
                  as: 'photo',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'fund/',
                      { $toString: '$_id' },
                      '/',
                      { $toString: '$$photo' },
                    ],
                  },
                },
              },
              total_donors: {
                $size: { $setUnion: ['$donations.donor_user_id', []] },
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
        'src/controller/fund/fund.service.ts-getNgoFundList',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api For Default Fund List
  public async getDefaultFundList(body, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        body,
      );
      const getLimit = await this.queueService.getSetting(
        'home-screen-per-page',
      );
      const user = this.request.user;
      const limit = !_.isEmpty(getLimit) ? Number(getLimit) : 5;
      const result = await this.fundModel.aggregate(
        [
          {
            $match: {
              is_default: true,
              is_deleted: { $ne: true },
              status: 'approve',
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
                {
                  $project: {
                    _id: 1,
                    converted_amt: 1,
                    donor_user_id: 1,
                  },
                },
              ],
              as: 'donations',
            },
          },
          {
            $lookup: {
              from: 'user',
              let: { user_id: '$user_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$_id', '$$user_id'] }],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    first_name: 1,
                    last_name: 1,
                    image: 1,
                  },
                },
              ],
              as: 'userData',
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
                          $eq: ['$user_id', ObjectID(user?._id)],
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
            $unwind: {
              path: '$userData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              fund_type: 1,
              fund_causes: 1,
              createdAt: 1,
              corporate_id: 1,
              active_type: 1,
              status: 1,
              category_slug: 'start-fund',
              raised: { $sum: '$donations.converted_amt' },
              user_id: '$userData._id',
              user_name: {
                $concat: ['$userData.first_name', ' ', '$userData.last_name'],
              },
              user_image: {
                $ifNull: [
                  {
                    $concat: [authConfig.imageUrl, 'user/', '$userData.image'],
                  },
                  null,
                ],
              },
              image_url: {
                $concat: [
                  authConfig.imageUrl,
                  'fund/',
                  { $toString: '$_id' },
                  '/',
                ],
              },
              country_data: 1,
              reference_id: 1,
              'form_data.title_of_fundraiser': '$form_data.title_of_fundraiser',
              'form_data.describe_your_fund': '$form_data.describe_your_fund',
              'form_data.how_the_funds_will_be_used':
                '$form_data.how_the_funds_will_be_used',
              'form_data.files.photos': {
                $map: {
                  input: '$form_data.files.photos',
                  as: 'photo',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'fund/',
                      { $toString: '$_id' },
                      '/',
                      { $toString: '$$photo' },
                    ],
                  },
                },
              },
              total_donors: {
                $size: { $setUnion: ['$donations.donor_user_id', []] },
              },
              is_bookmark: {
                $cond: {
                  if: { $gt: ['$bookmarkData', null] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          { $limit: limit },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        data: result,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-getDefaultFundList',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api For My Fund
  public async getMyFundList(param, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const user = this.request.user;
      const user_id = user._id;
      const match: any = { is_deleted: { $ne: true } };
      const region = [];
      let country = [];

      match['$or'] = [
        { user_id: user_id },
        {
          user_ngo_id: ObjectID(user?.ngo_data?._id),
          status: { $ne: 'draft' },
        },
        {
          admins: {
            $elemMatch: { user_id: user_id, is_deleted: { $ne: true } },
          },
          status: 'approve',
        },
      ];

      if (
        !_.isEmpty(param) &&
        !_.isUndefined(param.corporate) &&
        param.corporate == 1
      ) {
        match.active_type = 'corporate';
        match.corporate_id = ObjectID(user?.corporate_data?._id);
      } else {
        match.active_type = { $ne: 'corporate' };
      }

      if (
        param.country &&
        !_.isEmpty(param.country) &&
        param.country != 'all'
      ) {
        country = param.country;
        await Promise.all(
          country.map(async (c) => {
            const d = await this.commonService.getRegionFromCountryCode(c);
            if (!region.includes(d)) {
              region.push(d);
            }
          }),
        );
      }

      const where = [];
      if (!_.isEmpty(region)) {
        where.push({
          $or: [{ regions: { $in: region } }, { regions: { $size: 0 } }],
        });
      }
      // where.push({
      //   $or: [{ countries: { $in: country } }, { countries: { $size: 0 } }],
      // });

      if (param.search && !_.isUndefined(param.search)) {
        where.push({
          'form_data.title_of_fundraiser': new RegExp(param.search, 'i'),
        });
      }

      if (
        param.category_slug &&
        !_.isEmpty(param.category_slug) &&
        param.category_slug != 'all'
      ) {
        where.push({
          fund_causes: { $in: param.category_slug },
        });
      }

      if (
        (!_.isUndefined(param.sort_by) && param.sort_by == 'asce') ||
        param.sort_by == 'desc'
      ) {
        param.sort = 'form_data.title_of_fundraiser';
        param.sort_type = param.sort_by == 'asce' ? 1 : -1;
      }

      param.sort = 'createdAt';
      param.sort_type = param.sort_by && param.sort_by == 'old_to_new' ? 1 : -1;

      if (!_.isEmpty(where)) {
        match['$and'] = where;
      }
      const total_record = await this.fundModel.countDocuments(match).exec();
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

      const result = await this.fundModel.aggregate(
        [
          {
            $lookup: {
              from: 'user',
              let: { user_id: '$user_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$_id', '$$user_id'] }],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    first_name: 1,
                    last_name: 1,
                    image: 1,
                  },
                },
              ],
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
                      $and: [
                        { $eq: ['$fund_id', '$$id'] },
                        { $eq: ['$transaction_type', 'fund-received'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    converted_amt: 1,
                    donor_user_id: 1,
                  },
                },
              ],
              as: 'donations',
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
                          $eq: ['$user_id', ObjectID(user_id)],
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
            $match: match,
          },
          {
            $unwind: {
              path: '$userData',
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $project: {
              _id: 1,
              fund_type: 1,
              // form_data: 1,
              fund_causes: 1,
              category_slug: 'start-fund',
              corporate_id: 1,
              active_type: 1,
              createdAt: 1,
              raised: { $sum: '$donations.converted_amt' },
              country_data: 1,
              reference_id: 1,
              allow_edit_fund: 1,
              'form_data.title_of_fundraiser': '$form_data.title_of_fundraiser',
              'form_data.describe_your_fund': '$form_data.describe_your_fund',
              'form_data.how_the_funds_will_be_used':
                '$form_data.how_the_funds_will_be_used',
              'form_data.files.photos': {
                $map: {
                  input: '$form_data.files.photos',
                  as: 'photo',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'fund/',
                      { $toString: '$_id' },
                      '/',
                      { $toString: '$$photo' },
                    ],
                  },
                },
              },
              status: 1,
              admins: 1,
              allow_edit: {
                $cond: {
                  if: {
                    $or: [{ $eq: [user_id, '$userData._id'] }],
                  },
                  then: true,
                  else: false,
                },
              },
              user_id: '$userData._id',
              user_name: {
                $concat: ['$userData.first_name', ' ', '$userData.last_name'],
              },
              image_url: {
                $concat: [
                  authConfig.imageUrl,
                  'fund/',
                  { $toString: '$_id' },
                  '/',
                ],
              },
              user_image: {
                $ifNull: [
                  {
                    $concat: [authConfig.imageUrl, 'user/', '$userData.image'],
                  },
                  null,
                ],
              },
              total_donors: {
                $size: { $setUnion: ['$donations.donor_user_id', []] },
              },
              is_bookmark: {
                $cond: {
                  if: { $gt: ['$bookmarkData', null] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $sort: {
              status: 1,
              createdAt: param.sort_type,
            },
          },
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
        'src/controller/fund/fund.service.ts-getFundList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete Fund
  public async deleteFund(fundId: string, res: any): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        fundId,
      );
      const findFund: any = await this.fundModel
        .findByIdAndUpdate(fundId, {
          status: 'cancel',
          is_deleted: true,
          deletedAt: new Date(),
        })
        .select({
          _id: 1,
          form_data: 1,
          user_id: 1,
          admins: 1,
          status: 1,
        })
        .lean();

      if (!findFund) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        if (findFund.status !== 'draft') {
          const userData = this.request.user;
          await this.transferFund(fundId, userData);

          await this.notificationModel.deleteMany({
            fund_id: fundId,
            type: 'fund',
          });

          const allAdminIds = [];
          findFund.admins.map((admin) => {
            const admin_id = admin.user_id.toString();
            if (
              admin.is_deleted != true &&
              admin_id != userData._id.toString()
            ) {
              allAdminIds.push(admin_id);
            }
          });

          const title = await this.commonService.changeString(
            mConfig.noti_title_fund_deleted,
            { '{{fund_name}}': findFund.form_data.title_of_fundraiser },
          );
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_fund_deleted,
            {
              '{{uname}}': userData.display_name,
              '{{fund_name}}': findFund.form_data.title_of_fundraiser,
            },
          );
          //send notification to admins
          const input: any = {
            title: title,
            type: 'fund',
            fundId: findFund._id,
            categorySlug: 'fund',
            requestUserId: findFund.user_id,
            message: msg,
          };
          this.commonService.sendAllNotification(allAdminIds, input);
          this.commonService.sendAdminNotification(input);
        }

        return res.send({
          success: true,
          message: mConfig.fund_deleted,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-deleteFund',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for report fund
  public async reportFund(id: string, description: string, res: any) {
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

      const addData: any = {
        user_id: userId,
        user_name: uname,
        description,
        added_time: new Date(),
      };

      const data = await this.fundModel
        .findByIdAndUpdate(
          { _id: id },
          { $push: { report_fund: addData } },
          { new: true },
        )
        .lean();

      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const updateData1 = {
          '{{uname}}': uname,
          '{{id}}': data._id,
        };
        const reportTitle = await this.commonService.changeString(
          mConfig.noti_title_report_fund,
          updateData1,
        );
        const reportMsg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': description },
        );

        //send notification to Admin
        const input: any = {
          title: reportTitle,
          type: 'fund',
          fundId: data._id,
          message: reportMsg,
        };
        this.commonService.sendAdminNotification(input);

        return res.json({
          message: mConfig.Reported_successfully,
          data,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-reportFund',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get Fund profile details
  public async getFundData(
    list_type: any,
    id: string,
    param,
    res: any,
  ): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', {
        id,
      });

      const userDetail = this.request.user;

      let match: any = {
        _id: ObjectID(id),
        is_deleted: { $ne: true },
      };

      const lookup: any = [
        {
          $lookup: {
            from: 'categories',
            localField: 'fund_causes',
            foreignField: 'category_slug',
            as: 'causes',
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
                    $and: [{ $eq: ['$fund_id', '$$id'] }],
                  },
                },
              },
            ],
            as: 'donations',
          },
        },
        {
          $lookup: {
            from: 'user', // collection name in db
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_data',
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
                        $eq: ['$user_id', ObjectID(userDetail?._id)],
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

      let project: any = {
        _id: 1,
        reference_id: 1,
        fund_type: 1,
        form_data: 1,
        corporate_id: 1,
        active_type: 1,
        status: 1,
        category_slug: 'start-fund',
        allow_edit_fund: 1,
        user_id: 1,
        country_data: 1,
        causes: {
          $map: {
            input: '$causes',
            as: 'cause',
            in: {
              name: '$$cause.name',
              category_slug: '$$cause.category_slug',
              image: {
                $concat: [
                  authConfig.imageUrl,
                  'category-image/',
                  '$$cause.image',
                ],
              },
            },
          },
        },
        cause_image_url: authConfig.imageUrl + 'category-image/',
        raised: {
          $sum: {
            $map: {
              input: '$donations',
              as: 'donation',
              in: {
                $cond: [
                  { $eq: ['$$donation.transaction_type', 'fund-received'] },
                  '$$donation.converted_amt',
                  0,
                ],
              },
            },
          },
        },
        donated: {
          $sum: {
            $map: {
              input: '$donations',
              as: 'donation',
              in: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$$donation.transaction_type', 'fund-donated'] },
                      { $ne: ['$$donation.saayam_community', true] },
                    ],
                  },
                  '$$donation.converted_amt',
                  0,
                ],
              },
            },
          },
        },
        createdAt: 1,
        approve_time: 1,
        reject_time: 1,
        reject_reason: 1,
        photos: {
          $map: {
            input: '$form_data.files.photos',
            as: 'photo',
            in: {
              $concat: [
                authConfig.imageUrl,
                'fund/',
                { $toString: '$_id' },
                '/',
                { $toString: '$$photo' },
              ],
            },
          },
        },
        admins_count: {
          $sum: {
            $map: {
              input: '$admins',
              as: 'admin',
              in: {
                $cond: [{ $eq: ['$$admin.is_deleted', true] }, 0, 1],
              },
            },
          },
        },
        'user_data.first_name': 1,
        'user_data.last_name': 1,
        'user_data.image_url': authConfig.imageUrl + 'user/',
        'user_data.image': {
          $concat: [authConfig.imageUrl, 'user/', '$user_data.image'],
        },
        admins: {
          $filter: {
            input: '$admins',
            as: 'admin',
            cond: { $ne: ['$$admin.is_deleted', true] },
          },
        },
        life_impacted_ids: {
          $map: {
            input: '$donations',
            as: 'donation',
            in: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$$donation.transaction_type', 'fund-donated'] },
                    { $ne: ['$$donation.saayam_community', true] },
                    {
                      $or: [
                        { $eq: ['$$donation.is_user_ngo', true] },
                        { $ne: ['$$donation.to_fund_id', null] },
                        { $ne: ['$$donation.request_id', null] },
                      ],
                    },
                  ],
                },
                {
                  _id: '$$donation._id',
                  request_id: { $toString: '$$donation.request_id' },
                  to_fund_id: { $toString: '$$donation.to_fund_id' },
                  user_id: { $toString: '$$donation.user_id' },
                },
                null,
              ],
            },
          },
        },
        total_donors: {
          $size: {
            $setUnion: ['$total_donors.donor_user_id', []],
          },
        },
        is_bookmark: {
          $cond: {
            if: { $gt: [{ $size: '$bookmarkData' }, 0] }, // Check if bookmarks array is not empty
            then: true, // Bookmarks exist
            else: false, // No bookmarks
          },
        },
      };

      if (
        !_.isEmpty(userDetail) &&
        !_.isUndefined(userDetail._id) &&
        list_type == 'app'
      ) {
        const fundReqLookup = {
          $lookup: {
            from: 'fund_help_request',
            localField: '_id',
            foreignField: 'fund_id',
            as: 'fund_requests',
          },
        };
        lookup.push(fundReqLookup);

        const reqLookup = {
          $lookup: {
            from: 'requests',
            let: {
              causes: '$fund_causes',
              existId: '$fund_requests.request_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ['$category_slug', '$$causes'] },
                      {
                        $eq: ['$user_id', ObjectID(userDetail._id)],
                      },
                      { $eq: ['$status', 'approve'] },
                      {
                        $not: [{ $in: ['$_id', '$$existId'] }],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'request_info',
          },
        };
        lookup.push(reqLookup);

        project['report_count'] = {
          $sum: {
            $map: {
              input: '$report_fund',
              as: 'report',
              in: {
                $cond: [
                  {
                    $eq: ['$$report.user_id', ObjectID(param.user_id)],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        };

        project['total_fundraisers'] = { $size: '$request_info' };
        project['help_requests'] = { $size: '$fund_requests' };
      }

      if (list_type == 'admin') {
        match = {
          _id: ObjectID(id),
        };
        project = {
          _id: 1,
          reference_id: 1,
          fund_type: 1,
          usage: 1,
          summary: 1,
          countries: 1,
          regions: 1,
          user_id: 1,
          status: 1,
          country_data: 1,
          allow_edit_fund: 1,
          'causes.name': 1,
          'causes.slug': 1,
          form_data: 1,
          report_fund: 1,
          image_url: {
            $concat: [authConfig.imageUrl, 'fund/', { $toString: '$_id' }, '/'],
          },
          raised: {
            $sum: {
              $map: {
                input: '$donations',
                as: 'donation',
                in: {
                  $cond: [
                    { $eq: ['$$donation.transaction_type', 'fund-received'] },
                    '$$donation.converted_amt',
                    0,
                  ],
                },
              },
            },
          },
          donated: {
            $sum: {
              $map: {
                input: '$donations',
                as: 'donation',
                in: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ['$$donation.transaction_type', 'fund-donated'],
                        },
                        { $ne: ['$$donation.saayam_community', true] },
                      ],
                    },
                    '$$donation.converted_amt',
                    0,
                  ],
                },
              },
            },
          },
          createdAt: 1,
          approve_time: 1,
          reject_time: 1,
          reject_reason: 1,
          is_deleted: 1,
          is_default: 1,
          donors: {
            $sum: {
              $map: {
                input: '$donations',
                as: 'donation',
                in: {
                  $cond: [
                    { $eq: ['$$donation.transaction_type', 'fund-received'] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        };
      }

      const fund = await this.fundModel
        .aggregate([
          {
            $match: match,
          },
          ...lookup,
          {
            $addFields: {
              user_data: {
                $cond: {
                  if: { $ne: ['$user_data', []] }, // Check if user_data is not empty
                  then: { $arrayElemAt: ['$user_data', 0] }, // Set user_data to the first element
                  else: {}, // Keep user_data as is if it's empty
                },
              },
            },
          },
          {
            $addFields: {
              total_donors: {
                $filter: {
                  input: '$donations',
                  as: 'donation',
                  cond: {
                    $eq: ['$$donation.transaction_type', 'fund-received'],
                  },
                },
              },
            },
          },
          {
            $project: project,
          },
        ])
        .exec();

      if (!_.isEmpty(fund)) {
        let lifecount = 0;
        if (!_.isEmpty(fund[0].life_impacted_ids)) {
          let removeNullcount = fund[0].life_impacted_ids.filter((n) => n);
          let lifes = [];
          removeNullcount.map(async (life) => {
            if (life.request_id != null) {
              lifes.push(life.request_id);
            } else if (life.to_fund_id != null) {
              lifes.push(life.to_fund_id);
            } else if (life.user_id != null) {
              lifes.push(life.user_id);
            }
          });
          let removeDuplicate = [...new Set(lifes)];
          lifecount = removeDuplicate.length;
        }
        delete fund[0].life_impacted_ids;

        const today: any = new Date().toISOString().slice(0, 10);
        const startDate: any = new Date(
          fund[0].createdAt.toISOString().slice(0, 10),
        );
        const endDate: any = new Date(today);
        const diffInMs: any = endDate - startDate;
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        fund[0].funded_in_days = diffInDays > 0 ? diffInDays + 1 : 1;
        fund[0].life_impacted = lifecount;
        return res.json({
          success: true,
          data: fund[0],
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
        'src/controller/fund/fund.service.ts-getFundData',
        param,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for invite admin
  public async inviteAdmin(
    id: string,
    adminData: any,
    res: any,
  ): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        adminData,
      );
      const userDetail = this.request.user;
      const findFund: any = await this.fundModel
        .findOne({
          _id: ObjectID(id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          admins: 1,
          form_data: 1,
        })
        .lean();

      if (!findFund) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        let existingAdmins = findFund.admins;
        const previousAdmins = []; //old deleted admin data
        const previousAdminsId = [];
        let oldAdmins = []; //last and updated both data id

        existingAdmins.map((admin) => {
          let newData = admin;
          let admin_id = admin.user_id.toString();
          if (adminData.admins.includes(admin_id)) {
            //this condition for is deleted admin
            delete admin.is_deleted;
            previousAdmins.push(newData);
            previousAdminsId.push(admin_id);
          } else {
            previousAdmins.push(newData);
          }
          oldAdmins.push(admin_id);
        });

        const newAdmins = [];
        if (adminData.admins && !_.isEmpty(adminData.admins)) {
          const admin = adminData.admins;
          admin.map((data) => {
            if (!oldAdmins.includes(data)) {
              //if new user id not exist
              newAdmins.push({
                user_id: ObjectID(data),
                invite_fund_admin: false,
                donate_to_fundraiser: false,
                fund_organizer: false,
                max_donate_amount: null,
              });
            }
          });
        }
        const updatedAdmins: any = previousAdmins.concat(newAdmins);
        await this.fundModel
          .findOneAndUpdate(
            {
              _id: ObjectID(id),
            },
            {
              admins: updatedAdmins,
            },
          )
          .lean();
        if (!_.isEmpty(adminData.admins)) {
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_fund_inviteAdmin,
            {
              '{{uname}}': userDetail.display_name,
              '{{fund_name}}': findFund?.form_data?.title_of_fundraiser || '',
            },
          );
          //send notification to admins
          const input: any = {
            title: mConfig.noti_title_fund_inviteAdmin,
            type: 'fund',
            fundId: ObjectID(findFund._id),
            categorySlug: 'fund',
            message: msg,
          };
          this.commonService.sendAllNotification(adminData.admins, input);
          return res.json({
            success: true,
            message: mConfig.fund_admin_added_successfully,
          });
        } else {
          return res.json({
            success: true,
            message: mConfig.admin_not_selected,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-inviteAdmin',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for invite admin
  public async adminList(
    id: string,
    type: any,
    param: any,
    res: any,
  ): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {};
      // let query = [];
      const query: any = {
        is_deleted: { $ne: true },
        $or: [
          { 'admins.is_deleted': false },
          { 'admins.is_deleted': { $exists: false } },
        ],
      };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        // const where = [];
        if (!_.isUndefined(filter.list_type) && filter.list_type) {
          if (filter.list_type == 'organizer') {
            query['admins.fund_organizer'] = true;
          } else if (filter.list_type == 'admin') {
            query['admins.fund_organizer'] = false;
          }
        }

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
      const total = await this.fundModel
        .aggregate([
          {
            $match: { _id: ObjectID(id) },
          },
          {
            $unwind: '$admins',
          },
          {
            $lookup: {
              from: 'transactions',
              let: { id: '$_id', admins: '$admins' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$fund_id', '$$id'] },
                        { $eq: ['$transaction_type', 'fund-donated'] },
                        { $eq: ['$donor_user_id', '$$admins.user_id'] },
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
            $match: query,
          },
          {
            $lookup: {
              from: 'user', // collection name in db
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
      const adminsData = await this.fundModel
        .aggregate([
          addFields,
          {
            $match: { _id: ObjectID(id) },
          },
          {
            $unwind: '$admins',
          },
          {
            $lookup: {
              from: 'transactions',
              let: { id: '$_id', admins: '$admins' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$fund_id', '$$id'] },
                        { $eq: ['$transaction_type', 'fund-donated'] },
                        { $eq: ['$donor_user_id', '$$admins.user_id'] },
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
            $match: query,
          },
          {
            $lookup: {
              from: 'user', // collection name in db
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
              fund_organizer: '$admins.fund_organizer',
              admin_permission: '$admins',
              user_donated: { $sum: '$donations.converted_amt' },
              donated_count: { $size: '$donations' },
            },
          },
          { $sort: { fund_organizer: -1 } },
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
        'src/controller/fund/fund.service.ts-adminList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for remove admin
  public async removeAdmin(
    id: string,
    admin_id: string,
    res: any,
  ): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id, admin_id },
      );
      if (_.isUndefined(admin_id) || admin_id == '') {
        return res.json({
          success: false,
          message: 'Admin Id is required',
        });
      }

      const findFund: any = await this.fundModel
        .findOneAndUpdate(
          {
            _id: id,
            'admins.user_id': ObjectID(admin_id),
            is_deleted: { $ne: true },
          },
          {
            $set: {
              'admins.$.is_deleted': true,
              'admins.$.invite_fund_admin': false,
              'admins.$.donate_to_fundraiser': false,
              'admins.$.fund_organizer': false,
              'admins.$.max_donate_amount': null,
            },
          },
        )
        .select({ _id: 1, 'form_data.title_of_fundraiser': 1 })
        .lean();

      if (!findFund) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_fund_removeAdmin,
          {
            '{{fund_name}}': findFund?.form_data?.title_of_fundraiser,
          },
        );
        //send notification to admins
        const input: any = {
          title: mConfig.noti_title_fund_removeAdmin,
          type: 'fund',
          fundId: findFund._id,
          categorySlug: 'fund',
          message: msg,
          userId: ObjectID(admin_id),
        };
        await this.commonService.notification(input);

        return res.json({
          success: true,
          message: mConfig.fund_admin_removed,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-removeAdmin',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for leave Fund
  public async leaveFund(fundId: string, res: any): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        fundId,
      );
      const user_id = this.request.user._id;
      const findFund = await this.fundModel
        .findOneAndUpdate(
          {
            _id: ObjectID(fundId),
            'admins.user_id': ObjectID(user_id),
            is_deleted: { $ne: true },
          },
          { 'admins.$.is_deleted': true },
        )
        .lean();

      if (!findFund) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        return res.send({
          success: true,
          message: mConfig.fund_leave,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-leaveFund',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for manage fund permission
  public async managePermission(
    id: string,
    adminData: any,
    res: any,
  ): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        adminData,
      );
      const findFund: any = await this.fundModel
        .findOne({
          _id: ObjectID(id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          reference_id: 1,
          user_id: 1,
          fund_name: '$form_data.title_of_fundraiser',
        })
        .lean();

      if (!findFund) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const inviteAdminData = {
          user_id: ObjectID(adminData.user_id),
          invite_fund_admin: adminData.invite_fund_admin,
          donate_to_fundraiser: adminData.donate_to_fundraiser,
          fund_organizer: adminData.fund_organizer,
          max_donate_amount: adminData.max_donate_amount,
        };

        await this.fundModel
          .updateOne(
            {
              _id: ObjectID(id),
              'admins.user_id': ObjectID(adminData.user_id),
            },
            { 'admins.$': inviteAdminData },
          )
          .lean();

        //send notification to admin

        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_fund_manage_permission,
          {
            '{{fund_name}}': findFund.fund_name,
            '{{refId}}': findFund.reference_id,
          },
        );

        const input: any = {
          title: mConfig.noti_title_fund_manage_permission,
          type: 'manage-permission',
          fundId: findFund._id,
          categorySlug: 'fund',
          requestUserId: findFund.user_id,
          message: notiMsg,
          userId: adminData.user_id,
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
        'src/controller/fund/fund.service.ts-managePermission',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async paymentProcess(paymentProcessDto: PaymentProcessDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        paymentProcessDto,
      );

      const userData = this.request.user;
      const data = await this.fundModel
        .findOne({
          _id: paymentProcessDto.id,
          status: 'approve',
          is_deleted: { $ne: true },
        })
        .select({ _id: 1 })
        .lean();
      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let paymentGateway = process.env.DEFAULT_PAYMENT_GATEWAY || 'aauti';
        const country = userData.country_data.country;

        const findSetting = await this.commonService.getCommonSetting(country);

        let serviceFee;
        let transactionFee;
        let manageFees;
        if (!_.isEmpty(findSetting)) {
          serviceFee = Number(findSetting.form_data.service_fee);
          transactionFee = Number(findSetting.form_data.transaction_fee);
          manageFees = findSetting.form_data.manage_fees;
          paymentGateway = findSetting.form_data.payment_gateway;
        }

        const fixedAmount = Number(paymentProcessDto.amount.toFixed(10));
        let tipAmount = 0;
        let tipCharge = 0;
        let transactionAmount = 0;
        let transactionCharge = 0;
        let totalAmount = fixedAmount;
        let tipIncluded = false;
        let actualAmount = 0;

        if (
          serviceFee >= 0 &&
          !_.isUndefined(serviceFee) &&
          transactionFee >= 0 &&
          !_.isUndefined(transactionFee)
        ) {
          if (paymentProcessDto.service_charge !== serviceFee) {
            const updateData1 = {
              '{{type}}': 'service',
              '{{service_charge}}': paymentProcessDto.service_charge,
              '{{value}}': serviceFee,
            };

            const msg1 = await this.commonService.changeString(
              mConfig.Sayaam_changed_charges,
              updateData1,
            );
            return res.json({
              message: msg1,
              serviceChargeError: true,
              success: false,
            });
          } else if (paymentProcessDto.transaction_charge !== transactionFee) {
            const updateData1 = {
              '{{type}}': 'transaction',
              '{{service_charge}}': paymentProcessDto.transaction_charge,
              '{{value}}': transactionFee,
            };

            const msg1 = await this.commonService.changeString(
              mConfig.Sayaam_changed_charges,
              updateData1,
            );
            return res.json({
              message: msg1,
              serviceChargeError: true,
              success: false,
            });
          } else {
            tipCharge = serviceFee;
            transactionCharge = transactionFee;
            tipAmount = Number(((tipCharge / 100) * fixedAmount).toFixed(10));
            transactionAmount = Number(
              ((transactionCharge / 100) * fixedAmount).toFixed(10),
            );
            if (manageFees === 'exclude') {
              totalAmount += Number(tipAmount) + Number(transactionAmount);
              actualAmount = fixedAmount;
            } else if (manageFees === 'include') {
              actualAmount =
                fixedAmount - Number(tipAmount) - Number(transactionAmount);
            }
            tipIncluded = true;
          }
        } else {
          return res.json({
            message: mConfig.Sayaam_removed_service_charges,
            serviceChargeError: true,
            success: false,
          });
        }

        const stripeId = await this.stripeService.stripeUserId(userData);
        const countryData = {
          country: userData.country_data.country,
          country_code: userData.country_data.country_code,
          currency: paymentProcessDto.currency,
          currency_code: paymentProcessDto.currency_code,
        };
        let exchange_rate = paymentProcessDto.exchange_rate
          ? paymentProcessDto.exchange_rate
          : 1;
        const insertData: any = {
          user_id: userData._id,
          fund_id: paymentProcessDto.id,
          amount: actualAmount.toFixed(10),
          is_contribute_anonymously:
            paymentProcessDto.is_contribute_anonymously,
          is_tax_benefit: paymentProcessDto.is_tax_benefit,
          claim_tax: paymentProcessDto.claim_tax,
          tax_number: paymentProcessDto.tax_number,
          active_type: paymentProcessDto.active_type,
          transaction_type: paymentProcessDto.transaction_type,
          country_data: countryData,
          tip_included: tipIncluded,
          tip_charge: tipCharge,
          tip_amount: tipAmount,
          transaction_charge: transactionCharge,
          transaction_amount: transactionAmount,
          total_amount: totalAmount.toFixed(10),
          payment_gateway: paymentGateway,
          // title_of_fundraiser: data.form_data.title_of_fundraiser,
          stripe_customer_id: stripeId,
          note: paymentProcessDto.note,
          manage_fees: manageFees,
          amount_usd: paymentProcessDto.amount_usd
            ? paymentProcessDto.amount_usd
            : null,
          exchange_rate: exchange_rate,
          currency_code: countryData.currency_code,
        };
        insertData.converted_total_amt = totalAmount * exchange_rate;
        insertData.converted_amt = actualAmount * exchange_rate;

        if (countryData.currency_code == 'USD') {
          insertData.amount_usd = actualAmount;
        }
        if (
          paymentProcessDto.active_type == 'corporate' &&
          (userData.is_corporate || userData.is_corporate_user)
        ) {
          insertData.corporate_id = userData.corporate_data._id;
        }

        const createData = await new this.paymentProcessModel(insertData);
        const newRequest: any = await createData.save();
        if (_.isEmpty(newRequest)) {
          return res.json({
            message: mConfig.Please_try_again,
            success: false,
          });
        } else {
          let aautiPaymentStatus = false;
          if (paymentGateway === 'aauti') {
            aautiPaymentStatus =
              await this.commonService.checkAautiPaymentStatus();
          }
          return res.json({
            success: true,
            data: newRequest,
            aautiPayment: aautiPaymentStatus,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-paymentProcess',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for verify Fund in admin
  public async verifyFund(
    fundId: string,
    verifyFundDto: VerifyFundDto,
    res: any,
  ): Promise<Fund> {
    try {
      let notiMsg;

      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        verifyFundDto,
      );

      const fund: any = await this.fundModel
        .findById(fundId, {
          _id: 1,
          user_id: 1,
          fund_name: 1,
          admins: 1,
          reference_id: 1,
          'form_data.title_of_fundraiser': 1,
        })
        .lean();
      if (!_.isEmpty(fund)) {
        const updateData: any = {
          $set: {
            status: verifyFundDto.status,
          },
        };

        if (
          verifyFundDto.status == 'approve' ||
          verifyFundDto.status == 'reverify'
        ) {
          if (verifyFundDto.status == 'reverify') {
            updateData['$set']['status'] = 'approve';
          }
          updateData['$set']['approve_time'] = new Date();

          notiMsg = mConfig.noti_msg_fund_approved;
        } else if (verifyFundDto.status == 'reject') {
          updateData.allow_edit_fund = verifyFundDto.allow_edit_fund
            ? verifyFundDto.allow_edit_fund
            : false;
          updateData['$set']['reject_reason'] = verifyFundDto.reject_reason;
          updateData['$set']['reject_time'] = new Date();

          notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_reason,
            { '{{reason}}': verifyFundDto.reject_reason },
          );
        }

        await this.fundModel
          .findByIdAndUpdate({ _id: ObjectID(fundId) }, updateData, {
            new: true,
          })
          .lean();

        const status =
          verifyFundDto.status === 'approve'
            ? 'approved'
            : verifyFundDto.status === 'reject'
            ? 'rejected'
            : 'verified';
        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_fund_verify,
          {
            '{{fund_name}}': fund?.form_data?.title_of_fundraiser || '',
            '{{status}}': status,
          },
        );

        //send notification to fund admins
        const input: any = {
          title: notiTitle,
          type: 'fund',
          fundId: fund._id,
          fundUserId: fund.user_id,
          message: notiMsg,
        };

        if (!_.isEmpty(fund.admins)) {
          const adminIds = fund.admins.map((item) => {
            return item.user_id;
          });
          this.commonService.sendAllNotification(adminIds, input);
        }

        //Add Activity Log
        const logData = {
          action: 'verify',
          entity_id: fund._id,
          entity_name: 'Verify Fund',
          description: `Fund has been ${status} - ${fund?.reference_id || ''}`,
        };

        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message:
            verifyFundDto.status === 'approve'
              ? mConfig.Fund_approved
              : verifyFundDto.status === 'reject'
              ? mConfig.Fund_rejected
              : mConfig.Fund_reverify,
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
        'src/controller/fund/fund.service.ts-verifyFund',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get fund list in admin
  public async adminFundList(param, res: any): Promise<Fund[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      let match: any = {
        status: { $ne: 'draft' },
        is_deleted: { $ne: true },
      };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const user_type = [];

        if (!_.isUndefined(filter.cancel) && filter.cancel == 1) {
          match = {
            is_deleted: true,
            status: { $ne: 'draft' },
          };
        }
        if (!_.isUndefined(filter.reported) && filter.reported) {
          where.push({ report_fund: { $ne: [] } });
        }
        if (!_.isUndefined(filter.only_user) && filter.only_user) {
          let value = filter.only_user;
          value = value == 'true' || value == true || value == 1 ? true : false;
          user_type.push('user', 'volunteer', 'donor');
        }
        if (!_.isUndefined(filter.only_corporate) && filter.only_corporate) {
          let value = filter.only_corporate;
          value = value == 'true' || value == true || value == 1 ? true : false;
          user_type.push('corporate');
        }
        if (!_.isEmpty(user_type)) {
          where.push({ active_type: { $in: user_type } });
        }
        if (!_.isUndefined(filter.fund_causes) && filter.fund_causes) {
          const query = await this.commonService.filter(
            'contains',
            filter.fund_causes,
            'fund_causes',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.reference_id) && filter.reference_id) {
          const query = await this.commonService.filter(
            'contains',
            filter.reference_id,
            'reference_id',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.fund_title) && filter.fund_title) {
          const query = await this.commonService.filter(
            'contains',
            filter.fund_title,
            'form_data.title_of_fundraiser',
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
        if (!_.isUndefined(filter.regions) && filter.regions) {
          const query = await this.commonService.filter(
            'contains',
            filter.regions,
            'regions',
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
        if (!_.isUndefined(filter.approve_time) && filter.approve_time) {
          const query = await this.commonService.filter(
            'date',
            filter.approve_time,
            'approve_time',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const str_fields = [
            'reference_id',
            'form_data.title_of_fundraiser',
            'active_type',
            'fund_causes',
            'regions',
            'approve_time',
            'createdAt',
            'updatedAt',
            'status',
          ];

          query = await this.commonService.getGlobalFilter(
            str_fields,
            filter.search,
          );
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
        reference_id: 'reference_id',
        fund_title: 'form_data.title_of_fundraiser',
        active_type: 'active_type',
        fund_causes: 'fund_causes',
        regions: 'regions',
        approve_time: 'approve_time',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        status: 'status',
      };

      const total_record = await this.fundModel.countDocuments(match).exec();
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

      const data = await this.fundModel
        .find(match)
        .select({ form_settings: 0, admins: 0 })
        .sort(sort)
        .skip(start_from)
        .limit(per_page)
        .lean();

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
        'src/controller/fund/fund.service.ts-adminFundList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api For Fund List
  public async getFundDonors(id, param, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const match = {};
      const where = [];
      where.push({ fund_id: ObjectID(id) });
      where.push({ transaction_type: 'fund-received' });

      if (!_.isEmpty(where)) {
        match['$and'] = where;
      }
      const sortData = {
        _id: '_id',
      };
      const total_record = await this.fundModel.countDocuments(match).exec();
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

      const result = await this.transactionModel.aggregate(
        [
          {
            $lookup: {
              from: 'user', // collection name in db
              localField: 'donor_user_id',
              foreignField: '_id',
              as: 'userData',
            },
          },
          {
            $match: match,
          },
          {
            $unwind: {
              path: '$userData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              'userData._id': '$userData._id',
              'userData.user_name': '$userData.display_name',
              'userData.first_name': '$userData.first_name',
              'userData.last_name': '$userData.last_name',
              'userData.location': '$userData.location',
              'userData.email': '$userData.email',
              'userData.is_deleted': '$userData.is_deleted',
              'userData.is_guest': '$userData.is_guest',
              'userData.phone': '$userData.phone',
              'userData.phone_code': '$userData.phone_code',
              'userData.phone_country_short_name':
                '$userData.phone_country_short_name',
              'userData.image': {
                $ifNull: [
                  {
                    $concat: [authConfig.imageUrl, 'user/', '$userData.image'],
                  },
                  null,
                ],
              },
              transaction_amount: '$amount',
              currency: '$currency',
              createdAt: '$createdAt',
              is_contribute_anonymously: '$is_contribute_anonymously',
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
        'src/controller/fund/fund.service.ts-getFundDonors',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async generateReceipt(receiptDto: ViewReceiptDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        receiptDto,
      );
      const userData = this.request.user;

      const query: any = { _id: ObjectID(receiptDto.transaction_id) };

      const transactiondetail: any = await this.transactionModel
        .findOne(query, { resp: 0 })
        .lean();

      if (!_.isEmpty(transactiondetail)) {
        const getSaayamContact = await this.queueService.getSetting(
          'saayam-contact-no',
        );
        const getSaayamEmail = await this.queueService.getSetting(
          'saayam-email',
        );
        if (getSaayamContact && !_.isEmpty(getSaayamContact)) {
          transactiondetail.saayam_contact = getSaayamContact;
        } else {
          transactiondetail.saayam_contact = '+001 12345 254';
        }
        if (getSaayamEmail && !_.isEmpty(getSaayamEmail)) {
          transactiondetail.saayam_email = getSaayamEmail;
        } else {
          transactiondetail.saayam_email = 'help@saayam.com';
        }
        return res.json({
          success: true,
          data: transactiondetail,
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
        'src/controller/donate/donate.service.ts-generateReceipt',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api For Fund List
  public async getFundDonated(type, id, param, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const match = {};
      const where = [];
      where.push({ fund_id: ObjectID(id) });
      where.push({
        transaction_type: 'fund-donated',
        saayam_community: { $exists: false },
      });

      if (!_.isUndefined(param.user_id) && param.user_id != '') {
        where.push({ donor_user_id: ObjectID(param.user_id) });
      }
      if (!_.isUndefined(type) && type == 'help_request') {
        where.push({ fund_help_request_id: { $exists: true } });
      }

      if (!_.isEmpty(where)) {
        match['$and'] = where;
      }
      const sortData = {
        _id: '_id',
      };

      const lookup = {
        $lookup: {
          from: 'user',
          localField: 'donor_user_id',
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

      const total = await this.transactionModel
        .aggregate([{ $match: match }, lookup, unwind, { $count: 'count' }])
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

      const result = await this.transactionModel.aggregate(
        [
          {
            $match: match,
          },
          lookup,
          unwind,
          {
            $lookup: {
              from: 'fund',
              localField: 'to_fund_id',
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
            $lookup: {
              from: 'requests',
              localField: 'request_id',
              foreignField: '_id',
              as: 'reqData',
            },
          },
          {
            $unwind: {
              path: '$reqData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'ngo',
              localField: 'ngo_id',
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
          {
            $project: {
              ngo_id: {
                $cond: {
                  if: { $eq: ['$is_user_ngo', true] },
                  then: '$user_id',
                  else: null,
                },
              },
              user_name: {
                $concat: ['$userData.first_name', ' ', '$userData.last_name'],
              },
              user_image: {
                $ifNull: [
                  {
                    $concat: [authConfig.imageUrl, 'user/', '$userData.image'],
                  },
                  null,
                ],
              },
              user_id: '$userData._id',
              fund_id: 1,
              request_id: 1,
              title_of_fundraiser: '$campaign_name',
              category_name: 1,
              to_fund_id: 1,
              is_user_ngo: 1,
              transaction_type: 1,
              transaction_amount: '$amount',
              currency: '$currency',
              createdAt: '$createdAt',
              is_deleted: {
                $cond: {
                  if: {
                    $gt: ['$reqData', null],
                  },
                  then: '$reqData.is_deleted',
                  else: {
                    $cond: {
                      if: {
                        $gt: ['$ngoData', null],
                      },
                      then: '$ngoData.is_deleted',
                      else: '$fundData.is_deleted',
                    },
                  },
                },
              },
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
        'src/controller/fund/fund.service.ts-getFundDonated',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for Cancel fund
  public async cancelFund(id: string, res: any): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const findFund: any = await this.fundModel
        .findOneAndUpdate(
          { _id: ObjectID(id), is_deleted: { $ne: true } },
          { status: 'cancel' },
        )
        .select({
          _id: 1,
          form_data: 1,
          user_id: 1,
          admins: 1,
        })
        .lean();

      if (!findFund) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const userData = this.request.user;
        await this.transferFund(id, userData);

        const allAdminIds = [];
        findFund.admins.map((admin) => {
          const admin_id = admin.user_id.toString();
          if (admin.is_deleted != true) {
            allAdminIds.push(admin_id);
          }
        });

        const title = await this.commonService.changeString(
          mConfig.noti_title_fund_cancel,
          { '{{fund_name}}': findFund.form_data.title_of_fundraiser },
        );
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_fund_cancel,
          {
            '{{uname}}': userData.display_name,
            '{{fund_name}}': findFund.form_data.title_of_fundraiser,
          },
        );
        //send notification to admins
        const input: any = {
          title: title,
          type: 'fund',
          fundId: findFund._id,
          categorySlug: 'fund',
          requestUserId: findFund.user_id,
          message: msg,
        };
        this.commonService.sendAllNotification(allAdminIds, input);
        this.commonService.sendAdminNotification(input);

        return res.json({
          success: true,
          message: mConfig.fund_cancelled,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-cancelFund',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get edit Fund details
  public async getFundDataById(id: string, res: any): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      //find new form from categories table
      const project = {
        fund_causes: 1,
        country_code: 1,
        form_settings: 1,
        form_data: 1,
        status: 1,
        active_type: 1,
        user_id: 1,
        reference_id: 1,
        approve_time: 1,
        admins: 1,
        photos: {
          $map: {
            input: '$form_data.files.photos',
            as: 'photo',
            in: {
              $concat: [
                authConfig.imageUrl,
                'fund/',
                { $toString: '$_id' },
                '/',
                { $toString: '$$photo' },
              ],
            },
          },
        },
        video: {
          $map: {
            input: '$form_data.files.video',
            as: 'video',
            in: {
              $concat: [
                authConfig.imageUrl,
                'fund/',
                { $toString: '$_id' },
                '/',
                '$$video',
              ],
            },
          },
        },
        countries: 1,
        regions: 1,
      };
      const fund = await this.fundModel
        .aggregate([
          {
            $match: { _id: ObjectID(id), is_deleted: { $ne: true } },
          },
          {
            $lookup: {
              from: 'currency', // collection name in db
              localField: 'countries',
              foreignField: 'country_code',
              as: 'countries_data',
            },
          },
          {
            $lookup: {
              from: 'regions', // collection name in db
              localField: 'regions',
              foreignField: 'region',
              as: 'regions_data',
            },
          },
          {
            $addFields: {
              admins: {
                $filter: {
                  input: '$admins',
                  as: 'admins',
                  cond: {
                    $ne: ['$$admins.is_deleted', true],
                  },
                },
              },
              countries: {
                $map: {
                  input: '$countries_data',
                  as: 'country',
                  in: {
                    name: '$$country.country',
                    country_code: '$$country.country_code',
                  },
                },
              },
              regions: {
                $map: {
                  input: '$regions_data',
                  as: 'region',
                  in: {
                    _id: '$$region._id',
                    region: '$$region.region',
                  },
                },
              },
            },
          },
          {
            $project: project,
          },
          {
            $lookup: {
              from: 'user', // collection name in db
              localField: 'admins.user_id',
              foreignField: '_id',
              as: 'user_data',
            },
          },
          {
            $addFields: {
              admins: {
                $map: {
                  input: '$user_data',
                  as: 'user',
                  in: {
                    _id: '$$user._id',
                    name: '$$user.first_name',
                    image: {
                      $concat: [authConfig.imageUrl, 'user/', '$$user.image'],
                    },
                    phone: '$$user.phone',
                    phone_code: '$$user.phone_code',
                    email: '$$user.email',
                  },
                },
              },
            },
          },
          {
            $project: project,
          },
        ])
        .exec();

      if (!_.isEmpty(fund) && !_.isEmpty(fund[0])) {
        return res.json({
          success: true,
          data: fund[0],
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
        'src/controller/fund/fund.service.ts-getFundDataById',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for Update Fund
  public async fundUpdate(fundid, updateFundDto: any, res: any): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateFundDto,
      );

      const existFund: any = await this.fundModel
        .findOne({
          _id: ObjectID(fundid),
          is_deleted: { $ne: true },
        })
        .lean();

      if (!existFund) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let data = JSON.parse(updateFundDto.data);

        const userDetail = this.request.user;
        const formData: any = {
          form_data: {
            files: {},
            images: {},
          },
          user_id: ObjectID(userDetail._id),
          active_type: updateFundDto.active_type || null,
          country_code: existFund.country_code,
          fund_causes: updateFundDto.fund_causes,
          regions: updateFundDto.regions,
          countries: updateFundDto.countries,
          admins: updateFundDto.admins,
        };

        formData.updatedAt = new Date();

        //Call checkValidation function for inputs validation
        const { data1, formData1, haveError } =
          await this.requestService.checkValidation(
            data,
            formData,
            null,
            'main',
            updateFundDto.active_type,
            'fund',
            userDetail,
          );

        data = JSON.stringify(data1);
        formData1.form_settings = data;

        // //If there is an error in inputs validation then return error
        if (haveError) {
          return res.json({
            success: false,
            data,
          });
        }

        let existingAdmins = existFund.admins;
        const previousAdmins = [];
        let defaultAdminIds = [];
        let allAdminIds = [];

        existingAdmins.map((admin) => {
          let newData = admin;
          let admin_id = admin.user_id.toString();
          if (updateFundDto.admins.includes(admin_id)) {
            delete admin.is_deleted;
            previousAdmins.push(newData);
            allAdminIds.push(admin_id);
          } else {
            newData.is_deleted = true;
            previousAdmins.push(newData);
          }
          defaultAdminIds.push(admin_id);
        });

        const newAdmins = [];
        if (updateFundDto.admins && !_.isEmpty(updateFundDto.admins)) {
          const admins = updateFundDto.admins;
          admins.map((data) => {
            if (!defaultAdminIds.includes(data)) {
              newAdmins.push({
                user_id: ObjectID(data),
                invite_fund_admin: false,
                donate_to_fundraiser: false,
                fund_organizer: false,
                allow_edit: false,
                max_donate_amount: null,
              });
              allAdminIds.push(data);
            }
          });
        }
        formData1.admins = previousAdmins.concat(newAdmins);

        if (existFund.status == 'reject') {
          formData1.status = 'waiting_for_verify';
        }

        await this.fundModel
          .findByIdAndUpdate(fundid, { $set: formData1 })
          .lean();

        if (formData1.form_data && formData1.form_data.files) {
          const files = formData1.form_data.files;

          // All images are in "requestData.files" move upload images rom tmp to request folder
          for (const key in files) {
            files[key].map(async (item) => {
              // await this.commonService.moveImageIntoSitefolder(item, 'request');
              await this.commonService.uploadFileOnS3(item, 'fund/' + fundid);
            });
          }
        }

        // Remove files from request folder
        if (
          !_.isEmpty(updateFundDto.removed_files) &&
          updateFundDto.removed_files
        ) {
          const removedFiles = updateFundDto.removed_files;
          await Promise.all(
            removedFiles.map(async (item: any) => {
              await this.commonService.unlinkFileFunction(
                'fund/' + fundid,
                item,
              );
            }),
          );
        }

        if (!_.isEmpty(allAdminIds)) {
          const title = await this.commonService.changeString(
            mConfig.noti_title_fund_updated,
            {
              '{{fund_name}}': data?.form_data?.title_of_fundraiser
                ? data.form_data.title_of_fundraiser
                : existFund.form_data.title_of_fundraiser,
            },
          );
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_fund_updated,
            {
              '{{uname}}': userDetail.display_name,
              '{{fund_name}}': data?.form_data?.title_of_fundraiser
                ? data.form_data.title_of_fundraiser
                : existFund.form_data.title_of_fundraiser,
            },
          );
          //send notification to admins
          const input: any = {
            title: title,
            type: 'fund',
            fundId: existFund._id,
            categorySlug: 'fund',
            requestUserId: existFund.user_id,
            message: msg,
          };
          this.commonService.sendAllNotification(allAdminIds, input);
        }
        let msg;
        if (existFund.status == 'reject') {
          msg = await this.commonService.changeString(
            mConfig.noti_admin_msg_fund_reverify,
            {
              '{{fund_name}}': data?.form_data?.title_of_fundraiser || '',
            },
          );
        } else {
          msg = await this.commonService.changeString(
            mConfig.noti_admin_msg_fund_updated,
            {
              '{{fund_name}}': data?.form_data?.title_of_fundraiser || '',
            },
          );
        }

        const input: any = {
          title: mConfig.noti_admin_title_fund_updated,
          type: 'fund',
          fundId: existFund._id,
          message: msg,
        };
        this.commonService.sendAdminNotification(input);

        return res.json({
          message: mConfig.fund_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-fundUpdate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for verify Fundraiser request for app
  public async fundReverify(fundId: string, res: any): Promise<Fund> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        fundId,
      );
      const userData = this.request.user;
      const updateData = {
        $set: {
          status: 'waiting_for_verify',
        },
        $unset: {
          reject_time: 1,
          reject_reason: 1,
        },
      };
      const fund: any = await this.fundModel
        .findOneAndUpdate(
          { _id: ObjectID(fundId), status: 'reject' },
          updateData,
          {
            new: true,
          },
        )
        .exec();

      if (!_.isEmpty(fund)) {
        const allAdminIds = fund.admins.map((item) => {
          if (item.user_id.toString !== userData._id.toString) {
            return item.user_id;
          }
        });
        if (!_.isEmpty(allAdminIds)) {
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_fund_reverify,
            {
              '{{uname}}': userData.display_name,
              '{{fund_name}}': fund?.form_data?.title_of_fundraiser,
            },
          );
          //send notification to admins
          const input: any = {
            title: mConfig.noti_admin_title_fund_reverify,
            type: 'fund',
            fundId: fund._id,
            categorySlug: 'fund',
            requestUserId: fund.user_id,
            message: msg,
          };
          this.commonService.sendAllNotification(allAdminIds, input);
        }

        //send notification to admin
        const msg = await this.commonService.changeString(
          mConfig.noti_admin_msg_fund_reverify,
          {
            '{{fund_name}}': fund?.form_data?.title_of_fundraiser || '',
          },
        );
        const input: any = {
          title: mConfig.noti_admin_title_fund_reverify,
          type: 'fund',
          fundId: fund._id,
          message: msg,
        };
        this.commonService.sendAdminNotification(input);

        return res.json({
          success: true,
          message: mConfig.Reverify_fund,
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
        'src/controller/fund/fund.service.ts-fundReverify',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async fundDonate(fundDonateDto: FundDonateDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        fundDonateDto,
      );

      const userData = this.request.user;
      const fund_id = fundDonateDto.fund_id;
      const data: any = await this.fundModel
        .findOne({
          _id: fund_id,
          status: 'approve',
          is_deleted: { $ne: true },
        })
        .select({ _id: 1, 'form_data.title_of_fundraiser': 1, country_data: 1 })
        .lean();

      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const amount = Number(fundDonateDto.amount.toFixed(10));

        // const fund_bal = await this.commonService.getFundBalance(fund_id);
        // if (amount > fund_bal) {
        //   return res.json({
        //     message: mConfig.not_sufficient_amount_in_fund,
        //     success: false,
        //   });
        // }

        const user_fund_bal = await this.commonService.getUserFundBalance(
          fund_id,
          userData._id,
        );

        if (user_fund_bal < amount) {
          return res.json({
            message: mConfig.user_fund_limit_exceed,
            success: false,
          });
        }
        const fixedAmount = Number(fundDonateDto.amount.toFixed(10));

        const stripeId = await this.stripeService.stripeUserId(userData);
        const countryData = data.country_data;
        let newRequest: any;
        let exchange_rate = fundDonateDto.exchange_rate
          ? fundDonateDto.exchange_rate
          : 1;
        const insertData: any = {
          fund_id: fundDonateDto.fund_id,
          amount: fixedAmount,
          is_contribute_anonymously: fundDonateDto.is_contribute_anonymously,
          is_tax_benefit: false,
          claim_tax: false,
          tax_number: '',
          active_type: fundDonateDto.active_type,
          country_data: countryData,
          tip_included: false,
          tip_charge: 0,
          tip_amount: 0,
          transaction_charge: 0,
          transaction_amount: 0,
          total_amount: fixedAmount,
          payment_gateway: 'stripe',
          stripe_customer_id: stripeId,
          note: fundDonateDto.note,
          manage_fees: 'include',
          status: 'complete',
          payment_status: 'completed',
          currency: countryData.currency,
          paymentMethod: 'fund',
          donor_id: userData._id,
          donor_user_id: userData._id,
          donor_name: userData.first_name + ' ' + userData.last_name,
          receipt_number: await this.commonService.nextReceiptNum(userData._id),
          is_donor_ngo: false,
          amount_usd: fundDonateDto.amount_usd
            ? fundDonateDto.amount_usd
            : null,
          converted_amt: fixedAmount,
          converted_total_amt: fixedAmount,
          exchange_rate: exchange_rate,
          currency_code: countryData.currency_code,
        };
        if (countryData.currency_code == 'USD') {
          insertData.amount_usd = fixedAmount;
        }
        let converted_amt = (
          Number(fundDonateDto.amount) * exchange_rate
        ).toFixed(10);

        if (
          !_.isUndefined(fundDonateDto.request_id) &&
          fundDonateDto.request_id != ''
        ) {
          let causeRequest: any = await this.causeRequestModel.aggregate([
            { $match: { _id: ObjectID(fundDonateDto.request_id) } },
            {
              $lookup: {
                from: 'categories',
                localField: 'category_slug',
                foreignField: 'category_slug',
                as: 'categoryData',
              },
            },
            {
              $unwind: '$categoryData',
            },
            {
              $project: {
                _id: 1,
                user_ngo_id: 1,
                user_id: 1,
                uname: 1,
                'form_data.goal_amount': 1,
                title_of_fundraiser: '$form_data.title_of_fundraiser',
                category_slug: 1,
                category_name: 1,
                total_donation: 1,
                total_donors: 1,
                status: 1,
                country_data: 1,
                reference_id: 1,
                category_id: '$categoryData._id',
              },
            },
          ]);
          if (!_.isEmpty(causeRequest) && !_.isEmpty(causeRequest[0])) {
            causeRequest = causeRequest[0];
            let userId;
            let uName;
            if (causeRequest.user_ngo_id) {
              const ngoData = await this.ngoModel
                .findOne({ _id: ObjectID(causeRequest.user_ngo_id) })
                .select({ ngo_name: '$form_data.ngo_name' })
                .lean();

              userId = causeRequest.user_ngo_id;
              uName = ngoData?.ngo_name;
            } else {
              userId = causeRequest.user_id;
              uName = causeRequest.uname;
            }

            insertData.is_user_ngo = causeRequest.user_ngo_id ? true : false;
            insertData.user_id = userId;
            insertData.user_name = uName;
            insertData.request_id = fundDonateDto.request_id;
            insertData.transaction_type = 'fund-donated';
            insertData.goal_amount = causeRequest.form_data.goal_amount;
            insertData.category_name = causeRequest.category_name;
            insertData.category_id = causeRequest.category_id;
            insertData.campaign_name = causeRequest.title_of_fundraiser;
            insertData.fund_help_request_id =
              fundDonateDto.fund_help_request_id;

            const createDonateData = await new this.transactionModel(
              insertData,
            );
            newRequest = await createDonateData.save();

            insertData.transaction_type = 'donation';
            // insertData.converted_amt = fundDonateDto.amount_usd
            //   ? fundDonateDto.amount_usd
            //   : fixedAmount;
            // insertData.converted_total_amt = fundDonateDto.amount_usd
            //   ? fundDonateDto.amount_usd
            //   : fixedAmount;
            insertData.converted_total_amt = converted_amt;
            insertData.converted_amt = converted_amt;
            const createReceiveData = await new this.transactionModel(
              insertData,
            );
            await createReceiveData.save();

            let newTransactionAmount = insertData.converted_amt;
            await this.commonService.updateRequestDonationData(
              causeRequest,
              newTransactionAmount,
            );

            const input: any = {
              title: mConfig.noti_title_Payment_was_successful,
              type: causeRequest.category_slug,
              requestId: causeRequest._id,
              categorySlug: causeRequest.category_slug,
              requestUserId: causeRequest.user_id,
            };

            const updateData1 = {
              '{{fund_name}}': data.form_data.title_of_fundraiser,
              '{{amount}}':
                newRequest.country_data &&
                newRequest.country_data.country == 'India'
                  ? newRequest.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : newRequest.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
              '{{currency_symbol}}': newRequest.currency,
              '{{refId}}': causeRequest.reference_id,
              '{{ngo_name}}': newRequest.category_name + ' Request',
              '{{category}}': newRequest.category_name,
            };

            const msg1 = await this.commonService.changeString(
              mConfig.donor_noti_msg_donate_fund_to_ngo,
              updateData1,
            );

            //send notification to donor
            const removeNotiIds = [userData._id];
            input.message = msg1;
            input.userId = userData._id;
            await this.commonService.notification(input);
            //send notification to user
            if (
              !removeNotiIds
                .map((s) => s.toString())
                .includes(causeRequest.user_id.toString())
            ) {
              const donate_my_request = await this.commonService.changeString(
                mConfig.user_noti_msg_donate_fund_to_request,
                updateData1,
              );
              input.message = donate_my_request;
              input.userId = causeRequest.user_id;
              removeNotiIds.push(causeRequest.user_id);
              await this.commonService.notification(input);
            }

            //send notification to trustee of ngo
            if (causeRequest.is_user_ngo) {
              const notiUser = await this.commonService.getNgoUserIds(
                causeRequest.user_ngo_id,
                causeRequest.user_id,
              );
              if (
                notiUser &&
                !removeNotiIds
                  .map((s) => s.toString())
                  .includes(notiUser.toString())
              ) {
                const donate_my_request = await this.commonService.changeString(
                  mConfig.user_noti_msg_donate_fund_to_request,
                  updateData1,
                );
                input.message = donate_my_request;
                input.userId = notiUser;
                removeNotiIds.push(notiUser);
                await this.commonService.notification(input);
              }
            }

            //send notification to admin
            const msg = await this.commonService.changeString(
              mConfig.all_noti_msg_donate_fund_to_ngo,
              updateData1,
            );
            input.message = msg;
            this.commonService.sendAdminNotification(input);
            //send notification to all users
            this.commonService.sendAllUsersNotification(
              removeNotiIds,
              input,
              causeRequest.country_data.country,
              true,
            );
            //update request balance
          } else {
            return res.json({
              message: mConfig.No_data_found,
              success: false,
            });
          }
        }
        if (
          !_.isUndefined(fundDonateDto.to_fund_id) &&
          fundDonateDto.to_fund_id != ''
        ) {
          //find fund from to fund id
          const fundData: any = await this.fundModel.aggregate([
            { $match: { _id: ObjectID(fundDonateDto.to_fund_id) } },
            {
              $lookup: {
                from: 'user',
                localField: 'user_id',
                foreignField: '_id',
                as: 'userData',
              },
            },
            {
              $unwind: '$userData',
            },
            {
              $project: {
                user_id: 1,
                title_of_fundraiser: '$form_data.title_of_fundraiser',
                user_name: {
                  $concat: ['$userData.first_name', ' ', '$userData.last_name'],
                },
              },
            },
          ]);

          if (!_.isEmpty(fundData) && !_.isEmpty(fundData[0])) {
            insertData.user_id = fundData[0].user_id;
            insertData.user_name = fundData[0].user_name;
            insertData.transaction_type = 'fund-donated';
            insertData.campaign_name = fundData[0].title_of_fundraiser;
            insertData.to_fund_id = fundDonateDto.to_fund_id;

            const categoryDetail: any = await this.categoryModel
              .findOne({ category_slug: 'start-fund' })
              .select({ _id: 1, name: 1 });
            if (categoryDetail) {
              insertData.category_id = categoryDetail._id;
              insertData.category_name = 'Fund';
            }

            const createDonateData = await new this.transactionModel(
              insertData,
            );
            newRequest = await createDonateData.save();

            insertData.transaction_type = 'fund-received';
            insertData.from_fund_id = fundDonateDto.fund_id;
            insertData.fund_id = fundDonateDto.to_fund_id;
            // insertData.converted_amt = fundDonateDto.amount_usd
            //   ? fundDonateDto.amount_usd
            //   : fixedAmount;
            // insertData.converted_total_amt = fundDonateDto.amount_usd
            //   ? fundDonateDto.amount_usd
            //   : fixedAmount;
            insertData.converted_total_amt = converted_amt;
            insertData.converted_amt = converted_amt;

            const createReceiveData = await new this.transactionModel(
              insertData,
            );
            await createReceiveData.save();
          } else {
            return {
              message: mConfig.No_data_found,
              success: false,
            };
          }
        }

        if (
          !_.isUndefined(fundDonateDto.ngo_id) &&
          fundDonateDto.ngo_id != ''
        ) {
          const ngo: any = await this.ngoModel
            .findById({ _id: fundDonateDto.ngo_id })
            .select({ _id: 1, ngo_name: '$form_data.ngo_name' })
            .lean();

          if (!ngo) {
            return {
              message: mConfig.No_data_found,
              success: false,
            };
          } else {
            insertData.user_id = fundDonateDto.ngo_id;
            insertData.user_name = ngo?.ngo_name;
            insertData.is_user_ngo = true;
            insertData.transaction_type = 'fund-donated';
            insertData.campaign_name = ngo?.ngo_name;

            const createDonateData = await new this.transactionModel(
              insertData,
            );
            newRequest = await createDonateData.save();

            insertData.transaction_type = 'ngo-donation';
            // insertData.converted_amt = fundDonateDto.amount_usd
            //   ? fundDonateDto.amount_usd
            //   : fixedAmount;
            // insertData.converted_total_amt = fundDonateDto.amount_usd
            //   ? fundDonateDto.amount_usd
            //   : fixedAmount;
            insertData.converted_total_amt = converted_amt;
            insertData.converted_amt = converted_amt;
            const createReceiveData = await new this.transactionModel(
              insertData,
            );
            await createReceiveData.save();

            const input: any = {
              title: mConfig.noti_title_Payment_was_successful,
              type: 'ngo',
              ngoId: ngo._id,
            };
            const updateData1 = {
              '{{fund_name}}': data.form_data.title_of_fundraiser,
              '{{amount}}':
                newRequest.country_data &&
                newRequest.country_data.country == 'India'
                  ? newRequest.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : newRequest.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
              '{{ngo_name}}': ngo.ngo_name + 'NGO',
              '{{currency_symbol}}': newRequest.currency,
            };

            //send notification to donor
            const msg1 = await this.commonService.changeString(
              mConfig.donor_noti_msg_donate_fund_to_ngo,
              updateData1,
            );

            //send notification to donor
            const removeNotiIds = [userData._id];
            input.message = msg1;
            input.userId = userData._id;
            await this.commonService.notification(input);

            //send notification to ngo users
            input.title = mConfig.noti_title_ngo_donation;
            const notiUser = await this.commonService.getNgoUserIds(ngo._id);
            if (notiUser) {
              removeNotiIds.push(notiUser);
              updateData1['{{ngo_name}}'] = 'your NGO';
              const msg = await this.commonService.changeString(
                mConfig.all_noti_msg_donate_fund_to_ngo,
                updateData1,
              );
              input.message = msg;
              await this.commonService.sendAllNotification(notiUser, input);
            }

            updateData1['{{ngo_name}}'] = ngo.ngo_name + 'NGO';
            const msg = await this.commonService.changeString(
              mConfig.all_noti_msg_donate_fund_to_ngo,
              updateData1,
            );
            input.message = msg;

            //send notification to all auti users
            this.commonService.sendAllUsersNotification(
              removeNotiIds,
              input,
              null,
              true,
            );

            //send notification to admin
            this.commonService.sendAdminNotification(input);
          }
        }

        const receipt = await this.commonService.getDownloadTemplate(
          'single-receipt-template',
        );
        if (!_.isEmpty(receipt)) {
          newRequest.download = true;
        } else {
          newRequest.download = false;
        }

        return res.json({ success: true, data: newRequest });
        // } else {
        //   return res.json({
        //     message: mConfig.Please_try_again,
        //     success: false,
        //   });
        // }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-fundDonate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api For Fund List
  public async getUserFunds(param, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const user = this.request.user;
      const user_id = user._id;
      const match = {
        is_deleted: { $ne: true },
        status: 'approve',
        $or: [
          { user_id: user_id },
          {
            admins: {
              $elemMatch: {
                user_id: user_id,
                donate_to_fundraiser: true,
                is_deleted: { $ne: true },
              },
            },
          },
        ],
      };

      if (!_.isUndefined(param.fund_id) && param.fund_id != '') {
        match['_id'] = { $ne: ObjectID(param.fund_id) };
      } else if (
        !_.isUndefined(param.help_fund_id) &&
        param.help_fund_id != ''
      ) {
        match['_id'] = { $eq: ObjectID(param.help_fund_id) };
      }

      if (!_.isUndefined(param.corporate) && param.corporate) {
        match['active_type'] = 'corporate';
      } else {
        match['active_type'] = { $ne: 'corporate' };
      }

      const result = await this.fundModel.aggregate(
        [
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
              as: 'received',
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
                        { $eq: ['$transaction_type', 'fund-donated'] },
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
            $match: match,
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
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              reference_id: 1,
              createdAt: 1,
              user_id: 1,
              country_data: 1,
              available_fund: {
                $subtract: [
                  { $sum: '$received.converted_amt' },
                  { $sum: '$donations.converted_amt' },
                ],
              },
              user_donated: {
                $sum: {
                  $map: {
                    input: '$donations',
                    as: 'donation',
                    in: {
                      $cond: [
                        {
                          $and: [
                            {
                              $eq: [
                                '$$donation.transaction_type',
                                'fund-donated',
                              ],
                            },
                            { $eq: ['$$donation.donor_user_id', user_id] },
                            { $ne: ['$$donation.saayam_community', true] },
                          ],
                        },
                        '$$donation.converted_amt',
                        0,
                      ],
                    },
                  },
                },
              },
              admin: {
                $filter: {
                  input: '$admins',
                  as: 'admin',
                  cond: { $eq: ['$$admin.user_id', user_id] },
                },
              },
              'form_data.title_of_fundraiser': '$form_data.title_of_fundraiser',
              'form_data.describe_your_fund': '$form_data.describe_your_fund',
              'form_data.how_the_funds_will_be_used':
                '$form_data.how_the_funds_will_be_used',
              'form_data.files.photos': {
                $map: {
                  input: '$form_data.files.photos',
                  as: 'photo',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'fund/',
                      { $toString: '$_id' },
                      '/',
                      { $toString: '$$photo' },
                    ],
                  },
                },
              },
              status: 1,
            },
          },
          {
            $match: {
              available_fund: { $gt: 0 },
            },
          },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        data: result,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-getUserFunds',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api For Fund dashboard
  public async getFundDashboard(param, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const user = this.request.user;
      const user_id = user._id;
      const match = {};

      match['is_deleted'] = { $ne: true };
      if (!_.isUndefined(param.status) && param.status != '') {
        match['status'] = param.status;
      }
      // match['_id'] = ObjectID('63d7417c0b0d942f651e7015');
      // match['$or'] = [
      //   { user_id: user_id },
      //   {
      //     'admins.user_id': user_id,
      //     'admins.donate_to_fundraiser': true,
      //     'admins.is_deleted': { $ne: true },
      //   },
      // ];

      const result = await this.fundModel.aggregate(
        [
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
                        // { $eq: ['$transaction_type', 'fund-received'] },
                      ],
                    },
                  },
                },
              ],
              as: 'donations',
            },
          },
          {
            $match: match,
          },
          {
            $unwind: {
              path: '$donations',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: '$status',
              received: {
                $sum: {
                  $cond: [
                    { $eq: ['$donations.transaction_type', 'fund-received'] },
                    '$donations.converted_amt',
                    0,
                  ],
                },
              },
              donated: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ['$donations.transaction_type', 'fund-donated'],
                        },
                        { $ne: ['$donations.saayam_community', true] },
                      ],
                    },
                    '$donations.converted_amt',
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              received: 1,
              donated: 1,
              total: 1,
              status: 1,
              available_fund: {
                $subtract: ['$received', '$donated'],
              },
            },
          },
        ],
        { collation: authConfig.collation },
      );

      return res.json({
        data: result,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-getFundDashboard',
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
      const query: any = {
        $or: [
          {
            phone: new RegExp(getUserByMailDto.phone, 'i'),
          },
          {
            email: new RegExp(getUserByMailDto.phone, 'i'),
          },
          {
            user_name: new RegExp(getUserByMailDto.phone, 'i'),
          },
        ],
        is_deleted: false,
        is_guest: { $ne: true },
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
              corporate_id: 1,
              image: {
                $ifNull: [
                  { $concat: [authConfig.imageUrl, 'user/', '$image'] },
                  null,
                ],
              },
              is_deleted: 1,
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
        'src/controller/fund/fund.service.ts-userByMailPhone',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
  public async transferFund(fundId, userData) {
    try {
      const fund_bal = await this.commonService.getFundBalance(fundId);

      if (fund_bal > 0) {
        const findFund: any = await this.fundModel
          .findById({ _id: ObjectID(fundId) })
          .select({
            _id: 1,
            country_data: 1,
          })
          .lean();

        const usdAmount = await this.commonService.getExchangeRate(
          findFund?.country_data?.currency_code,
          'usd',
          Number(fund_bal),
        );

        const uname = userData.display_name
          ? userData.display_name
          : userData.first_name + ' ' + userData.last_name;
        const fixedAmount = Number(fund_bal.toFixed(10));

        const stripeId = await this.stripeService.stripeUserId(userData);
        const countryData = {
          country: userData.country_data.country,
          country_code: userData.country_data.country_code,
          currency: userData.country_data.currency[0].symbol,
          currency_code: userData.country_data.currency[0].name,
        };

        const insertData: any = {
          fund_id: fundId,
          amount: fixedAmount,
          is_contribute_anonymously: true,
          is_tax_benefit: false,
          claim_tax: false,
          tax_number: '',
          active_type: 'user',
          country_data: countryData,
          tip_included: false,
          tip_charge: 0,
          tip_amount: 0,
          transaction_charge: 0,
          transaction_amount: 0,
          total_amount: fixedAmount,
          payment_gateway: 'stripe',
          stripe_customer_id: stripeId,
          note: '',
          manage_fees: 'include',
          status: 'complete',
          payment_status: 'completed',
          currency: countryData.currency,
          paymentMethod: 'fund',
          donor_id: userData._id,
          donor_user_id: userData._id,
          user_name: uname,
          donor_name: userData.first_name + ' ' + userData.last_name,
          receipt_number: await this.commonService.nextReceiptNum(userData._id),
          is_donor_ngo: false,
          transaction_type: 'fund-donated',
          saayam_community: true,
          converted_amt: fixedAmount,
          converted_total_amt: fixedAmount,
          currency_code: findFund?.country_data?.currency_code,
        };
        if (usdAmount['status'] == true) {
          insertData.amount_usd = usdAmount['amount'];
          insertData.exchange_rate = usdAmount['rate'];
        }

        const createDonateData = await new this.transactionModel(insertData);
        await createDonateData.save();
      }

      return true;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-transferFund',
      );
    }
  }

  async getExchangeRates(getUserByMailDto: ExchangeRatesDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        getUserByMailDto,
      );
      const body = getUserByMailDto;
      const amount = body.amount ? body.amount : 0;
      let result = await this.commonService.getExchangeRate(
        body.from,
        body.to,
        amount,
      );
      return res.json({
        success: result['status'],
        amount: result['amount'],
        rate: result['rate'],
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-getExchangeRates',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async addToDefault(fundId: string, type: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { fundId },
      );
      let updateData;
      if (type == 'mark') {
        updateData = {
          $set: {
            is_default: true,
          },
        };
      } else {
        updateData = {
          $unset: {
            is_default: 1,
          },
        };
      }
      const updateFund: any = await this.fundModel
        .findOneAndUpdate(
          {
            _id: ObjectID(fundId),
          },
          updateData,
        )
        .select({ _id: 1 })
        .lean();

      if (!updateFund) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        let msg;
        if (type == 'mark') {
          msg = mConfig.fund_added_to_default;
        } else {
          msg = mConfig.fund_removed_from_default;
        }
        return res.json({
          success: true,
          message: msg,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-addToDefault',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for fund donation list
  public async fundDonationList(param, res: any): Promise<Ngo[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
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
                    { $eq: ['$to_fund_id', '$$id'] },
                    {
                      $eq: ['$donor_id', userData._id],
                    },
                    {
                      $or: [
                        { eventCode: 'AUTHORISATION', success: true },
                        { eventCode: 'Authorised' },
                        { status: 'complete' },
                        { status: 'completed' },
                      ],
                    },
                    { $eq: ['$transaction_type', 'fund-donated'] },
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

      const total = await this.fundModel
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

      const data = await this.fundModel.aggregate([
        lookup,
        {
          $lookup: {
            from: 'user',
            localField: 'user_id',
            foreignField: '_id',
            as: 'userData',
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
                        $eq: ['$user_id', ObjectID(userData._id)],
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
          $unwind: {
            path: '$userData',
            preserveNullAndEmptyArrays: false,
          },
        },
        { $match: match },
        {
          $project: {
            _id: 1,
            fund_type: 1,
            fund_causes: 1,
            createdAt: 1,
            corporate_id: 1,
            active_type: 1,
            status: 1,
            category_slug: 'start-fund',
            user_id: '$userData._id',
            user_name: {
              $concat: ['$userData.first_name', ' ', '$userData.last_name'],
            },
            user_image: {
              $ifNull: [
                {
                  $concat: [authConfig.imageUrl, 'user/', '$userData.image'],
                },
                null,
              ],
            },
            image_url: {
              $concat: [
                authConfig.imageUrl,
                'fund/',
                { $toString: '$_id' },
                '/',
              ],
            },
            country_data: 1,
            donationCount: { $size: '$transactionData' },
            transaction_id: { $first: '$transactionData._id' },
            reference_id: 1,
            'form_data.title_of_fundraiser': '$form_data.title_of_fundraiser',
            'form_data.describe_your_fund': '$form_data.describe_your_fund',
            'form_data.how_the_funds_will_be_used':
              '$form_data.how_the_funds_will_be_used',
            'form_data.files.photos': {
              $map: {
                input: '$form_data.files.photos',
                as: 'photo',
                in: {
                  $concat: [
                    authConfig.imageUrl,
                    'fund/',
                    { $toString: '$_id' },
                    '/',
                    { $toString: '$$photo' },
                  ],
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
            is_deleted: 1,
            is_bookmark: {
              $cond: {
                if: { $gt: ['$bookmarkData', null] },
                then: true,
                else: false,
              },
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
        'src/controller/fund/fund.service.ts-fundDonationList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
