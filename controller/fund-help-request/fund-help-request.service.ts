import { _ } from 'lodash';
import { Model } from 'mongoose';
import moment from 'moment-timezone';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { CreateFundHelpRequestDto } from './dto/create-fund-help-request.dto';
import { UpdateFundHelpRequestDto } from './dto/update-fund-help-request.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { LogService } from 'src/common/log.service';
import { Fund, FundDocument } from '../fund/entities/fund.entity';
import {
  FundHelpRequest,
  FundHelpRequestDocument,
} from './entities/fund-help-request.entity';
import { authConfig } from '../../config/auth.config';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../request/entities/cause-request.entity';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.entity';
import { QueueService } from 'src/common/queue.service';
const ObjectID = require('mongodb').ObjectID;
@Injectable()
export class FundHelpRequestService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly queueService: QueueService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Fund.name) private fundModel: Model<FundDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
    @InjectModel(FundHelpRequest.name)
    private fundHelpRequest: Model<FundHelpRequestDocument>,
  ) {}

  public async create(
    createFundHelpRequestDto: any,
    res: any,
  ): Promise<FundHelpRequest> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createFundHelpRequestDto,
      );
      const user = this.request.user;
      createFundHelpRequestDto.user_id = user._id;
      const createFund = new this.fundHelpRequest(createFundHelpRequestDto);
      const result = await createFund.save();

      if (_.isEmpty(result)) {
        return res.json({
          success: false,
          message: mConfig.Invalid,
        });
      } else {
        //Send notification to all admins which included on fund doc
        const fundData: any = await this.fundModel
          .findOne({ _id: result.fund_id })
          .select({
            _id: 1,
            admins: 1,
            reference_id: 1,
            user_id: 1,
            fund_name: '$form_data.title_of_fundraiser',
          })
          .lean();
        if (fundData) {
          const adminIds = await fundData.admins.map((item: any) => {
            return item.user_id;
          });

          const msg = await this.commonService.changeString(
            mConfig.noti_msg_fund_help_request_create,
            {
              '{{fund_name}}': fundData.fund_name,
              '{{refId}}': fundData.reference_id,
            },
          );

          const input = {
            title: mConfig.noti_title_fund_help_request_create,
            type: 'fund-help-request',
            categorySlug: 'fund',
            requestId: result._id,
            message: msg,
            requestUserId: result.user_id,
          };

          await this.commonService.sendAllNotification(adminIds, input);
          await this.commonService.sendAdminNotification(input);
        }

        return res.json({
          success: true,
          message: mConfig.fund_help_request_created,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund-help-request/fund-help-request.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get user fundraisers list match with fund causes
  public async getFundraisersList(body, res: any) {
    try {
      // do fund wise same fund then don't display again
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', body);

      if (_.isUndefined(body.fund_id) || body.fund_id.length != 24) {
        return res.json({
          success: false,
          message: mConfig.fund_id_is_missing,
        });
      }

      const userDetail = this.request.user;
      const match = {
        is_deleted: { $ne: true },
        status: 'approve',
        _id: ObjectID(body.fund_id),
      };

      const lookup = {
        $lookup: {
          from: 'requests',
          let: { causes: '$fund_causes', fundActiveType: '$active_type' },
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
                      $cond: [
                        { $eq: ['$$fundActiveType', 'corporate'] },
                        { $eq: ['$active_type', 'corporate'] },
                        { $ne: ['$active_type', 'corporate'] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'request_info',
        },
      };

      const lookup2 = {
        $lookup: {
          from: 'fund_help_request',
          let: { id: '$request_info._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$request_id', '$$id'],
                    },
                    { $eq: ['$fund_id', ObjectID(body.fund_id)] },
                  ],
                },
              },
            },
          ],
          as: 'help_request',
        },
      };

      const sortData = {
        _id: '_id',
      };

      const total = await this.fundModel
        .aggregate([
          { $match: match },
          lookup,
          {
            $unwind: '$request_info',
          },
          lookup2,
          { $match: { help_request: { $eq: [] } } },
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

      const result = await this.fundModel.aggregate(
        [
          {
            $match: match,
          },
          lookup,
          {
            $unwind: '$request_info',
          },
          lookup2,
          { $match: { help_request: { $eq: [] } } },
          {
            $project: {
              fund_id: '$_id',
              createdAt: '$request_info.createdAt',
              // raised: { $sum: '$donations.converted_amt' },
              reference_id: '$request_info.reference_id',
              request_id: '$request_info._id',
              title_of_fundraiser:
                '$request_info.form_data.title_of_fundraiser',
              goal_amount: '$request_info.form_data.goal_amount',
              remaining_amount: '$request_info.form_data.remaining_amount',
              category_name: '$request_info.category_name',
              category_slug: '$request_info.category_slug',
              user_id: '$request_info.user_id',
              uname: '$request_info.uname',
              upload_cover_photo: {
                $map: {
                  input: '$request_info.form_data.files.upload_cover_photo',
                  as: 'photo',
                  in: {
                    $concat: [authConfig.imageUrl, 'request/', '$$photo'],
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
        'src/controller/fund-help-request/fund-help-request.service.ts-getFundraisersList',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list of fund help request
  public async findAll(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const query1 = {};
      const match = {
        fund_id: ObjectID(param.fund_id),
      };

      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];

        if (!_.isUndefined(filter.request_id) && filter.request_id) {
          const query = await this.commonService.filter(
            'objectId',
            filter.request_id,
            'request_id',
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
        if (!_.isUndefined(filter.uname) && filter.uname) {
          const query = await this.commonService.filter(
            'contains',
            filter.uname,
            'uname',
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
        if (!_.isUndefined(filter.first_name) && filter.first_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.first_name,
            'first_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.last_name) && filter.last_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.last_name,
            'last_name',
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
          !_.isUndefined(filter.remaining_amount) &&
          filter.remaining_amount
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.remaining_amount,
            'form_data.remaining_amount',
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
            'title_of_fundraiser',
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
        if (!_.isUndefined(filter.raised) && filter.raised) {
          const query = await this.commonService.filter(
            'contains',
            filter.raised,
            'raised',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.category_name) && filter.category_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.category_name,
            'category_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.expiry_date) && filter.expiry_date) {
          const query = await this.commonService.filter(
            'contains',
            filter.expiry_date,
            'form_data.expiry_date',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'reference_id',
            'request_id',
            'uname',
            'first_name',
            'last_name',
            'active_type',
            'title_of_fundraiser',
            'form_data.goal_amount',
            'category_name',
            'form_data.expiry_date',
          ];
          const field = ['form_data.remaining_amount', 'raised'];
          const stringFilter = await this.commonService.getGlobalFilter(
            fields,
            filter.search,
          );
          const numFilter = await this.commonService.getNumberFilter(
            field,
            filter.search,
          );
          query = stringFilter.concat(numFilter);
        }

        if (!_.isUndefined(filter.search) && !_.isEmpty(query)) {
          query1['$or'] = query;
        }
        if (!_.isEmpty(where)) {
          query1['$and'] = where;
        }
      }

      const sortData = {
        _id: '_id',
        request_id: 'request_id',
        reference_id: 'reference_id',
        uname: 'uname',
        urgent_help: 'form_data.urgent_help',
        first_name: 'first_name',
        last_name: 'last_name',
        active_type: 'active_type',
        remaining_amount: 'form_data.remaining_amount',
        title_of_fundraiser: 'title_of_fundraiser',
        goal_amount: 'form_data.goal_amount',
        raised: 'raised',
        category_name: 'category_name',
        expiry_date: 'form_data.expiry_date',
      };

      const lookup = {
        $lookup: {
          from: 'requests',
          let: { req_id: '$request_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$req_id'] },
                    { $ne: ['$is_deleted', true] },
                    { $eq: ['$status', 'approve'] },
                  ],
                },
              },
            },
          ],
          as: 'reqData',
        },
      };
      const unwind = {
        $unwind: {
          path: '$reqData',
          preserveNullAndEmptyArrays: false,
        },
      };

      const tDataLookup = {
        $lookup: {
          from: 'transactions',
          let: { id: '$request_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$request_id', '$$id'] },
                    { $eq: ['$transaction_type', 'donation'] },
                    { $ne: ['$saayam_community', true] },
                    { $gt: ['$fund_help_request_id', null] },
                  ],
                },
              },
            },
          ],
          as: 'tData',
        },
      };
      const project: any = {
        request_id: '$reqData._id',
        reference_id: '$reqData.reference_id',
        user_id: '$reqData.user_id',
        uname: '$reqData.uname',
        'form_data.urgent_help': '$reqData.form_data.urgent_help',
        'form_data.urgent_help_status': '$reqData.form_data.urgent_help_status',
        first_name: '$reqData.form_data.first_name',
        last_name: '$reqData.form_data.last_name',
        active_type: '$reqData.active_type',
        'form_data.remaining_amount': '$reqData.form_data.remaining_amount',
        choose_or_select_institute:
          '$reqData.form_data.choose_or_select_institute',
        reason: 1,
        title_of_fundraiser: '$reqData.form_data.title_of_fundraiser',
        'form_data.goal_amount': '$reqData.form_data.goal_amount',
        upload_cover_photo: {
          $map: {
            input: '$reqData.form_data.files.upload_cover_photo',
            as: 'cover_photo',
            in: {
              $concat: [authConfig.imageUrl, 'request/', '$$cover_photo'],
            },
          },
        },
        'form_data.expiry_date': '$reqData.form_data.expiry_date',
        raised: '$reqData.total_donation',
        category_slug: '$reqData.category_slug',
        category_name: '$reqData.category_name',
        avg_donation: '$reqData.avg_donation',
        country_data: '$reqData.country_data',
      };

      const total = await this.fundHelpRequest
        .aggregate([
          { $match: match },
          lookup,
          unwind,
          { $project: project },
          { $match: query1 },
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
      project.total_donors = { $size: '$tData' };

      const data = await this.fundHelpRequest.aggregate(
        [
          { $match: match },
          lookup,
          unwind,
          tDataLookup,
          { $project: project },
          { $match: query1 },
          { $sort: sort },
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
        'src/controller/fund-help-request/fund-help-request.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get urgent request list for app
  public async findSimilarFundraisers(
    body,
    res: any,
  ): Promise<CauseRequestModel> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', body);

      if (_.isUndefined(body.fund_id) || body.fund_id.length != 24) {
        return res.json({
          success: false,
          message: mConfig.fund_id_is_missing,
        });
      }

      const findFund = await this.fundModel
        .findById(body.fund_id)
        .select({ _id: 1, fund_causes: 1, active_type: 1 })
        .lean();

      if (_.isEmpty(findFund)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }

      const userD: any = {};
      const userDetail = this.request.user;

      if (body.show_data == 1) {
        const result = await this.queueService.getSetting(
          'home-screen-per-page',
        );
        body.per_page = !_.isEmpty(result) ? result : 5;
      }

      const query: any = {
        status: 'approve',
        is_deleted: { $exists: false },
        category_slug: { $in: findFund.fund_causes },
        active_type:
          findFund.active_type == 'corporate'
            ? 'corporate'
            : { $ne: 'corporate' },
      };

      //Filter for selected causes requests
      if (!_.isUndefined(body.category_slug) && body.category_slug) {
        query['category_slug'] = {
          $in: body.category_slug,
        };
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
          from: 'fund',
          let: { cause: '$category_slug' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$cause', '$fund_causes'] },
                    {
                      $eq: ['$_id', ObjectID(body.fund_id)],
                    },
                  ],
                },
              },
            },
          ],
          as: 'fund_info',
        },
      };

      const unwind = {
        $unwind: {
          path: '$fund_info',
          preserveNullAndEmptyArrays: false,
        },
      };

      const lookup2 = {
        $lookup: {
          from: 'ngo', // collection name in db
          localField: 'user_ngo_id',
          foreignField: '_id',
          as: 'ngoData',
        },
      };

      const unwind2 = {
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
      const unwind3 = {
        $unwind: {
          path: '$ngo_Data',
          preserveNullAndEmptyArrays: false,
        },
      };

      const total = await this.causeRequestModel.aggregate([
        ...geoNear,
        { $match: query },
        lookup,
        unwind,
        lookup2,
        unwind2,
        group,
        project,
        unwind3,
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
        body.page,
        body.per_page,
        total_record,
        sortData,
        body.sort_type,
        body.sort,
      );

      if (!_.isEmpty(userDetail) && !_.isUndefined(userDetail._id)) {
        userD['_id'] = userDetail.user_id;
        userD['ngo_id'] = userDetail?.ngo_data?._id;
      }

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
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund-help-request/fund-help-request.service.ts-findSimilarFundraisers',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
