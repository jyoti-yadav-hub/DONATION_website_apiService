import { _ } from 'lodash';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateManualTransferDto } from './dto/create-manual-transfer.dto';
import { UpdateManualTransferDto } from './dto/update-manual-transfer.dto';
import {
  TransactionModel,
  TransactionDocument,
} from '../donation/entities/transaction.entity';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../request/entities/cause-request.entity';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.entity';
import { Fund, FundDocument } from '../fund/entities/fund.entity';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
import { QueueService } from 'src/common/queue.service';
import mConfig from '../../config/message.config.json';
import { CommonService } from 'src/common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { LogService } from 'src/common/log.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { TransactionType } from './dto/create-manual-transfer.dto';
import { RequestManualTransferDto } from './dto/request-manual-transfer.dto';
import { ManualTransfer, status } from './entities/manual-transfer.entity';
import { authConfig } from 'src/config/auth.config';
import { UpdateRequestManualTransferDto } from './dto/update-request-manual-transfer.dto';
import { UserRequestManualTransferDto } from './dto/user-request-manual-transfer.dto';
import { UpdateUserRequestManualTransferDto } from './dto/update-user-request-manual-transfer.dto';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class ManualTransferService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly queueService: QueueService,
    private readonly errorlogService: ErrorlogService,

    @InjectModel(Ngo.name)
    private ngoModel: Model<NgoDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(Fund.name)
    private fundModel: Model<FundDocument>,
    @InjectModel(ManualTransfer.name)
    private manualTransferModel: Model<ManualTransfer>,
  ) {}

  /**
   * function to make transaction for manual transfer
   */
  private async makeManualTransaction(createManualTransferDto) {
    try {
      const userData: any = await this.userModel
        .findOne({
          _id: ObjectID(createManualTransferDto.user_id),
        })
        .select({ _id: 1, country_data: 1 })
        .lean();

      if (!_.isEmpty(userData)) {
        const country_data = {
          country: userData.country_data.country,
          country_code: userData.country_data.country_code,
          currency: createManualTransferDto.currency,
          currency_code: createManualTransferDto.currency_code,
        };

        const transactionData: any = {
          amount: createManualTransferDto.amount,
          total_amount: createManualTransferDto.amount,
          active_type: 'admin-transfer',
          country_data: country_data,
          currency: createManualTransferDto.currency,
          currency_code: createManualTransferDto.currency_code,
          is_contribute_anonymously: false,
          is_tax_benefit: false,
          tax_number: null,
          receipt_number: await this.nextReceiptNum(country_data.country_code),
          tip_charge: 0,
          tip_amount: 0,
          transaction_charge: 0,
          tip_included: false,
          payment_status: 'completed',
          transaction_amount: createManualTransferDto.amount,
          donor_id: ObjectID(createManualTransferDto.user_id),
        };

        let entity_id;
        let entity_name;
        if (
          createManualTransferDto.transaction_type == TransactionType.fundraiser
        ) {
          const causeRequest: any = await this.causeRequestModel
            .findById({ _id: createManualTransferDto.id })
            .select({
              _id: 1,
              user_ngo_id: 1,
              user_id: 1,
              uname: 1,
              'form_data.goal_amount': 1,
              'form_data.title_of_fundraiser': 1,
              category_slug: 1,
              total_donation: 1,
              total_donors: 1,
              goal_amount: 1,
              status: 1,
              country_data: 1,
              reference_id: 1,
            })
            .lean();

          if (!causeRequest) {
            return {
              message: mConfig.No_data_found,
              success: false,
            };
          } else {
            entity_id = causeRequest._id;
            entity_name = 'Request - ' + causeRequest.reference_id;
            let userId = '';
            let uName = '';
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

            transactionData.user_id = userId;
            transactionData.user_name = uName;
            transactionData.request_id = causeRequest._id;
            transactionData.transaction_type = 'donation';
            transactionData.goal_amount = causeRequest.form_data.goal_amount;
            transactionData.is_user_ngo = causeRequest.user_ngo_id
              ? true
              : false;
            transactionData.is_donor_ngo = false;
            transactionData.total_amount = transactionData.total_amount;
            transactionData.campaign_name =
              causeRequest.form_data.title_of_fundraiser;

            const categoryDetail: any = await this.categoryModel
              .findOne({ category_slug: causeRequest.category_slug })
              .select({ _id: 1, name: 1 });
            if (categoryDetail) {
              transactionData.category_id = categoryDetail._id;
              transactionData.category_name = categoryDetail.name;
            }

            await this.commonService.updateRequestDonationData(
              causeRequest,
              createManualTransferDto.amount,
            );
          }
        } else if (
          createManualTransferDto.transaction_type == TransactionType.ngo
        ) {
          const ngo: any = await this.ngoModel
            .findById({ _id: createManualTransferDto.id })
            .select({ _id: 1, ngo_name: '$form_data.ngo_name' })
            .lean();

          if (!ngo) {
            return {
              message: mConfig.No_data_found,
              success: false,
            };
          } else {
            entity_id = ngo._id;
            entity_name = 'NGO - ' + ngo?.ngo_name;
            transactionData.user_id = createManualTransferDto.id;
            transactionData.user_name = ngo?.ngo_name;
            transactionData.transaction_type = 'ngo-donation';
            transactionData.is_user_ngo = true;
            transactionData.total_amount = transactionData.total_amount;
            transactionData.campaign_name = ngo?.ngo_name;
          }
        } else if (
          createManualTransferDto.transaction_type == TransactionType.fund
        ) {
          const fundData: any = await this.fundModel.aggregate([
            { $match: { _id: ObjectID(createManualTransferDto.id) } },
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
                _id: 1,
                user_id: 1,
                title_of_fundraiser: '$form_data.title_of_fundraiser',
                user_name: {
                  $concat: ['$userData.first_name', ' ', '$userData.last_name'],
                },
              },
            },
          ]);
          if (_.isEmpty(fundData) && _.isEmpty(fundData[0])) {
            return {
              message: mConfig.No_data_found,
              success: false,
            };
          } else {
            entity_id = fundData._id;
            entity_name = 'Fund - ' + fundData.reference_id;
            transactionData.user_id = fundData[0].user_id;
            transactionData.user_name = fundData[0].user_name;
            transactionData.to_fund_id = fundData[0]._id;
            transactionData.amount = transactionData.amount;
            transactionData.currency = transactionData.country_data.currency;
            transactionData.transaction_type = 'fund-donated';
            transactionData.is_user_ngo = false;
            transactionData.total_amount = transactionData.total_amount;
            transactionData.campaign_name = fundData[0].title_of_fundraiser;
          }
        }

        const createData = new this.transactionModel(transactionData);
        await createData.save();

        //Add Activity Log
        const logData = {
          action: 'transfer',
          entity_id,
          entity_name: 'Manual Transfer',
          description: `Manually transfer ${createManualTransferDto.amount}${country_data.currency} to ${entity_name}`,
        };
        this.logService.createAdminLog(logData);

        return {
          message: mConfig.Manual_transfer,
          success: true,
          id: createData._id,
        };
      } else {
        return {
          message: mConfig.User_not_found,
          success: false,
        };
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manual-transfer/manual-transfer.service.ts-create',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  /**
   * function to make create manual transaction
   */
  public async create(
    createManualTransferDto: CreateManualTransferDto,
    res: any,
  ) {
    try {
      if (!_.isEmpty(createManualTransferDto.receipt_image)) {
        await this.commonService.uploadFileOnS3(
          createManualTransferDto.receipt_image,
          'manual_transfer_receipt',
        );
      }

      const response = await this.makeManualTransaction(
        createManualTransferDto,
      );

      if (response.success) {
        const manualData: any = {
          status: 'approved',
          request_id: createManualTransferDto.id,
          user_id: ObjectID(createManualTransferDto.user_id),
          created_by: 'admin',
          amount: createManualTransferDto.amount,
          transaction_type: createManualTransferDto.transaction_type,
          transaction_id: createManualTransferDto.transaction_id,
          transaction_date: createManualTransferDto.transaction_date,
          currency_symbol: createManualTransferDto.currency,
          currency: createManualTransferDto.currency_code,
          receipt_image: createManualTransferDto.receipt_image,
          receipt_id: response.id,
        };
        await this.manualTransferModel.create(manualData);
      }

      return res.send(response);
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manual-transfer/manual-transfer.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api to list transaction request listing
  public async listRequest(param, res: any) {
    try {
      let type = param.type;
      let search = param.search;

      if (!type) {
        return res.json({
          success: false,
          message: await this.commonService.changeString(mConfig.Is_required, {
            '{{type}}': 'Transaction type',
          }),
        });
      }

      if (search?.length) {
        let query: any = {};
        let lookup: any = {};
        let lookupMatch: any = {};
        let project: any = {};

        if (type !== 'ngo-donation') {
          lookup = {
            $lookup: {
              from: 'user',
              localField: 'user_id',
              foreignField: '_id',
              as: 'userData',
            },
          };
          lookupMatch = {
            $match: {
              userData: { $ne: [] },
              'userData.is_deleted': { $ne: true },
              'userData.blocked': { $ne: true },
            },
          };
          project = {
            $project: {
              name: '$form_data.title_of_fundraiser',
              _id: 1,
              reference_id: 1,
            },
          };
          query = {
            $or: [
              { reference_id: { $regex: search, $options: 'i' } },
              {
                'form_data.title_of_fundraiser': {
                  $regex: search,
                  $options: 'i',
                },
              },
            ],
            is_deleted: { $ne: true },
          };
        } else {
          query = {
            ngo_name: {
              $regex: search,
              $options: 'i',
            },
            is_deleted: { $ne: true },
          };
          lookup = {
            $lookup: {
              from: 'user',
              localField: '_id',
              foreignField: 'ngo_id',
              as: 'userData',
            },
          };
          lookupMatch = {
            $match: {
              userData: { $ne: [] },
              'userData.is_deleted': { $ne: true },
              'userData.blocked': { $ne: true },
            },
          };
          project = {
            $project: {
              name: '$ngo_name',
              _id: 1,
            },
          };
        }

        let response = [];

        if (type === 'ngo-donation') {
          response = await this.ngoModel
            .aggregate([{ $match: query }, lookup, lookupMatch, project])
            .limit(10);
        } else if (type === 'fund-donation') {
          response = await this.fundModel
            .aggregate([{ $match: query }, lookup, lookupMatch, project])
            .limit(10);
        } else if (type === 'donation') {
          response = await this.causeRequestModel
            .aggregate([{ $match: query }, lookup, lookupMatch, project])
            .limit(10);
        }
        return res.json({
          success: true,
          data: response,
        });
      } else {
        return res.json({
          success: true,
          data: [],
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manual-transfer/manual-transfer.service.ts-listRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  async nextReceiptNum(countryCode) {
    // const user = user;
    const country_code = countryCode;

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

  //Api to create request for manual transfer

  public async createRequest(
    createRequestDto: RequestManualTransferDto | UserRequestManualTransferDto,
    res: any,
  ) {
    try {
      await this.commonService.uploadFileOnS3(
        createRequestDto.receipt_image,
        'manual_transfer_receipt',
      );

      if (createRequestDto instanceof RequestManualTransferDto) {
        createRequestDto['user_id'] = this.request.user._id;
      }
      createRequestDto['created_user_id'] = this.request.user._id;
      await this.manualTransferModel.create(createRequestDto);

      //send notification to admin
      const msg = await this.commonService.changeString(
        mConfig.noti_msg_New_Request_generated,
        {
          '{{user}}':
            this.request.user.first_name + ' ' + this.request.user.last_name,
        },
      );

      const input = {
        message: msg,
        title: mConfig.noti_title_request_generate,
        type: 'manual_transfer_request',
      };
      this.commonService.sendAdminNotification(input);

      return res.json({
        message: mConfig.Request_has_been_sent,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manual-transfer/manual-transfer.service.ts-create-request',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api to update manual request
  public async updateRequest(
    id: string,
    updateRequestDto:
      | UpdateUserRequestManualTransferDto
      | UpdateRequestManualTransferDto,
    res: any,
  ) {
    try {
      if (await this.isValidURL(updateRequestDto?.receipt_image)) {
        delete updateRequestDto.receipt_image;
      } else {
        if (!_.isEmpty(updateRequestDto.receipt_image)) {
          await this.commonService.uploadFileOnS3(
            updateRequestDto.receipt_image,
            'manual_transfer_receipt',
          );
        }
      }

      const requestData = await this.manualTransferModel.findOneAndUpdate(
        {
          _id: ObjectID(id),
          status: 'pending',
        },
        { ...updateRequestDto },
        { new: true },
      );

      if (!requestData) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }

      return res.json({
        success: true,
        message: mConfig.Request_update,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manual-transfer/manual-transfer.service.ts-update-request',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  /**
   * Function to check if string is valid url
   *
   * @param str
   * @returns
   */
  async isValidURL(str: string) {
    try {
      new URL(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Api to list manual request history
  public async getRequest(param, res: any) {
    try {
      const match: any = {
        $and: [
          {
            created_user_id: this.request.user._id,
          },
          {
            status: { $ne: 'cancelled' },
          },
        ],
      };

      if (param.status) {
        match.$and.push({ status: param.status });
      }

      const total = await this.manualTransferModel
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
        '',
        param.sort_type,
        param.sort,
      );

      const requestData = await this.manualTransferModel.aggregate(
        [
          { $match: match },
          {
            $lookup: {
              from: 'requests',
              let: { requestID: '$request_id', transType: '$transaction_type' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$requestID', '$_id'] },
                        { $eq: ['$$transType', 'donation'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    name: '$form_data.title_of_fundraiser',
                    upload_cover_photo: {
                      $concat: [
                        authConfig.imageUrl,
                        'request/',
                        {
                          $arrayElemAt: [
                            '$form_data.files.upload_cover_photo',
                            0,
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
              as: 'requestData',
            },
          },
          {
            $lookup: {
              from: 'ngo',
              let: {
                ngoRequestID: '$request_id',
                transType: '$transaction_type',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$ngoRequestID', '$_id'] },
                        { $eq: ['$$transType', 'ngo-donation'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    name: '$ngo_name',
                    upload_cover_photo: {
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
              ],
              as: 'ngoData',
            },
          },
          {
            $lookup: {
              from: 'fund',
              let: {
                fundRequestID: '$request_id',
                transType: '$transaction_type',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$fundRequestID', '$_id'] },
                        { $eq: ['$$transType', 'fund-donation'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    name: '$form_data.title_of_fundraiser',
                    upload_cover_photo: {
                      $concat: [
                        authConfig.imageUrl,
                        'fund/',
                        { $toString: '$_id' },
                        '/',
                        {
                          $arrayElemAt: ['$form_data.files.photos', 0],
                        },
                      ],
                    },
                  },
                },
              ],
              as: 'fundData',
            },
          },

          {
            $addFields: {
              combinedData: {
                $concatArrays: ['$requestData', '$ngoData', '$fundData'],
              },
            },
          },
          {
            $unwind: {
              path: '$combinedData',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              _id: 1,
              campaign_name: '$combinedData.name',
              upload_cover_photo: '$combinedData.upload_cover_photo',
              status: 1,
              amount: 1,
              country_data: {
                currency: '$currency',
                currency_symbol: '$currency_symbol',
                country_name: '$country_name',
              },
              transaction_id: 1,
              receipt_id: 1,
              transaction_date: 1,
              createdAt: 1,
              transaction_type: 1,
              request_id: 1,
              reject_reason: 1,
              user_email: 1,
              user_name: 1,
              user_phone_code: 1,
              user_phone: 1,
              user_phone_country_short_name: 1,
              user_phone_country_full_name: 1,

              receipt_image: {
                $concat: [
                  authConfig.imageUrl,
                  'manual_transfer_receipt/',
                  '$receipt_image',
                ],
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
        data: requestData,
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
        'src/controller/manual-transfer/manual-transfer.service.ts-get-request',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api to cancel manual request
  public async cancelRequest(id: string, res: any) {
    try {
      const cancelRequest = await this.manualTransferModel
        .findByIdAndDelete(id)
        .lean();
      if (!cancelRequest) {
        return res.json({
          success: false,
          message: mConfig.Something_went_wrong,
        });
      }
      return res.json({
        success: true,
        message: mConfig.title_cancelled_request,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manual-transfer/manual-transfer.service.ts-cancel-request',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  /*
   *Api for fetch list of manual manual-transfer/find
   */
  public async requestListsForAdmin(param: any, res: any) {
    try {
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            operator,
            filter.status,
            'status',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.created_by) && filter.created_by) {
          const query = await this.commonService.filter(
            operator,
            filter.created_by,
            'created_by',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.amount) && filter.amount) {
          const query = await this.commonService.filter(
            operator,
            filter.amount,
            'amount',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.transaction_id) && filter.transaction_id) {
          const query = await this.commonService.filter(
            operator,
            filter.transaction_id,
            'transaction_id',
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
        if (!_.isUndefined(filter.currency_symbol) && filter.currency_symbol) {
          const query = await this.commonService.filter(
            'date',
            filter.currency_symbol,
            'currency_symbol',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.currency) && filter.currency) {
          const query = await this.commonService.filter(
            'date',
            filter.currency,
            'currency',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'created_by',
            'amount',
            'transaction_id',
            'status',
            'currency_symbol',
            'currency',
            'createdAt',
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
        created_by: 'created_by',
        amount: 'amount',
        status: 'status',
        currency_symbol: 'currency_symbol',
        currency: 'currency',
        createdAt: 'createdAt',
        transaction_date: 'transaction_date',
        userName: 'userName',
        transaction_type: 'transaction_type',
        action_date: 'action_date',
      };
      const total_record = await this.manualTransferModel
        .countDocuments(match)
        .exec();
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

      const result = await this.manualTransferModel.aggregate(
        [
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
              status: 1,
              created_by: 1,
              amount: 1,
              action_date: 1,
              transaction_date: 1,
              transaction_id: 1,
              createdAt: 1,
              receipt_image: {
                $concat: [
                  authConfig.imageUrl,
                  'manual_transfer_receipt/',
                  '$receipt_image',
                ],
              },
              currency_symbol: 1,
              currency: 1,
              request_id: 1,
              transaction_type: 1,
              reason: '$reject_reason',
              userName: {
                $concat: [
                  {
                    $ifNull: [
                      {
                        $concat: [' ', '$userData.first_name'],
                      },
                      '',
                    ],
                  },
                  ' ',
                  {
                    $ifNull: [
                      {
                        $concat: [' ', '$userData.last_name'],
                      },
                      '',
                    ],
                  },
                ],
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
        'src/controller/manual-transfer/manual-transfer.service.ts-find-all-request',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  /*
   * Make approve and reject manual transfer request
   */
  async handleRequestStatus(id, approveRejectRequest, res) {
    try {
      let { status, reason } = approveRejectRequest;
      let finalMsg = await this.commonService.changeString(
        mConfig.manual_transfer_request_status,
        {
          '{{status}}': status,
        },
      );

      let final: any = {
        status: status,
        action_date: new Date(),
      };
      if (status === 'rejected') {
        final['reject_reason'] = reason;
        const rejectedData = await this.manualTransferModel.findOneAndUpdate(
          {
            _id: ObjectID(id),
            status: 'pending',
          },
          final,
          { new: true },
        );

        if (!rejectedData) {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        }
        return res.json({
          success: true,
          message: finalMsg,
        });
      }
      const data: any = await this.manualTransferModel.findOne({
        _id: ObjectID(id),
        status: 'pending',
      });

      if (!data) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }

      const mainObj = {
        transaction_type: data.transaction_type,
        id: data.request_id,
        user_id: data.user_id,
        amount: data.amount,
        currency: data.currency_symbol,
        currency_code: data.currency,
      };
      if (
        !_.isUndefined(data.user_phone_code) &&
        !_.isUndefined(data.user_phone)
      ) {
        //If user not exist in saayam then create new user entry
        const isUserExists = await this.createUser(data);
        if (isUserExists.success) {
          mainObj.user_id = isUserExists.user_id;
          final['user_id'] = isUserExists.user_id;
        }
      }

      const manualTransaction = await this.makeManualTransaction(mainObj);

      if (manualTransaction.success) {
        final.receipt_id = manualTransaction.id;
        const transferData: any =
          await this.manualTransferModel.findByIdAndUpdate(id, final, {
            new: true,
          });
      } else {
        return res.json(manualTransaction);
      }

      return res.json({
        success: true,
        message: finalMsg,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manual-transfer/manual-transfer.service.ts-handleRequestStatus-request',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  /**
   * Function to create not existing user
   * @param data
   * @returns
   */
  public async createUser(data) {
    try {
      const user = await this.userModel
        .findOne({
          phone_code: data.user_phone_code,
          phone: data.user_phone,
          is_deleted: false,
        })
        .lean();

      if (!user) {
        const countryData = await this.commonService.getCountry(
          data.user_country_name,
        );
        const dtl: any = {
          first_name: data.user_name,
          display_name: data.user_name,
          phone_code: data.user_phone_code,
          phone: data.user_phone,
          phone_country_full_name: data.user_phone_country_full_name,
          phone_country_short_name: data.user_phone_country_short_name,
          country_data: countryData ? countryData : null,
          default_country: data.user_country_name,
          is_donor: true,
          email: data.user_email,
        };
        const createUser = new this.userModel(dtl);
        await createUser.save();
        return {
          user_id: createUser._id,
          success: true,
        };
      }
      return {
        success: false,
      };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manual-transfer/manual-transfer.service.ts-createUser',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }
}
