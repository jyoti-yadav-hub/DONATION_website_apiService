/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from '../../config/auth.config';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { LogService } from '../../common/log.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { CreateBookmarkItemsDto } from './dto/create-bookmark-items.dto';
import { ErrorlogService } from '../error-log/error-log.service';
import { Bookmark, BookmarkDocument } from './entities/bookmark.entity';
import { AddToBookmarkDto } from './dto/add-to-bookmark.dto';
import {
  BookmarkItems,
  BookmarkItemsDocument,
} from './entities/bookmark-items.entity';
import { ListDto } from './dto/list-dto.dto';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class BookmarkService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Bookmark.name)
    private bookmarkModel: Model<BookmarkDocument>,
    @InjectModel(BookmarkItems.name)
    private bookmarkItemsModel: Model<BookmarkItemsDocument>,
  ) {}

  ///Api for create user bookmark
  public async createBookmark(
    createBookmarkItemsDto: CreateBookmarkItemsDto,
    res: any,
  ): Promise<BookmarkDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createBookmarkItemsDto,
      );
      const user = this.request.user;

      const checkData = await this.bookmarkItemsModel.aggregate([
        {
          $match: {
            user_id: ObjectID(user._id),
          },
        },
        {
          $group: {
            _id: '$collection_id',
          },
        },
        {
          $lookup: {
            from: 'bookmark',
            localField: '_id',
            foreignField: '_id',
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
          $match: {
            'bookmarkData.name': new RegExp(
              '^' + createBookmarkItemsDto.name + '$',
              'i',
            ),
          },
        },
        { $count: 'count' },
      ]);
      const total_count =
        checkData && checkData[0] && checkData[0].count
          ? checkData[0].count
          : 0;
      if (total_count > 0) {
        return res.json({
          success: false,
          message: 'Collection already exists!',
        });
      }

      const dtl = {
        name: createBookmarkItemsDto.name,
        user_id: user._id,
      };
      const createBookmark = new this.bookmarkModel(dtl);
      const bookmarkData = await createBookmark.save();

      const bookmarkItem: any = await this.bookmarkItemsModel
        .findOne({
          request_id: ObjectID(createBookmarkItemsDto.request_id),
          user_id: user._id,
        })
        .lean();

      if (!bookmarkItem) {
        const dtl = {
          user_id: user._id,
          collection_id: bookmarkData._id,
          request_id: ObjectID(createBookmarkItemsDto.request_id),
          category_slug: createBookmarkItemsDto.category_slug,
        };
        const createBookmarkItem = new this.bookmarkItemsModel(dtl);
        await createBookmarkItem.save();

        return res.json({
          success: true,
          message: mConfig.Item_saved,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.Item_already_saved,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bookmark/bookmark.service.ts-createBookmark',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for item add to bookmark
  public async addToBookmark(
    addToBookmarkDto: AddToBookmarkDto,
    res: any,
  ): Promise<BookmarkItemsDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        addToBookmarkDto,
      );
      const user = this.request.user;
      const bookmarkItem: any = await this.bookmarkItemsModel
        .findOne({
          request_id: ObjectID(addToBookmarkDto.request_id),
          user_id: user._id,
        })
        .lean();

      if (!bookmarkItem) {
        const dtl = {
          user_id: user._id,
          collection_id: addToBookmarkDto.collection_id,
          request_id: ObjectID(addToBookmarkDto.request_id),
          category_slug: addToBookmarkDto.category_slug,
        };
        const createBookmarkItem = new this.bookmarkItemsModel(dtl);
        await createBookmarkItem.save();

        return res.json({
          success: true,
          message: mConfig.Item_saved,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.Item_already_saved,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bookmark/bookmark.service.ts-addToBookmark',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for remove item from bookmark
  public async removeBookmark(
    id: string,
    res: any,
  ): Promise<BookmarkItemsDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const user = this.request.user;

      const result = await this.bookmarkItemsModel
        .findOneAndDelete({ request_id: ObjectID(id), user_id: user._id })
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      return res.json({
        message: mConfig.removed_successfully,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bookmark/bookmark.service.ts-removeBookmark',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for bookmark list
  public async bookmarkList(
    param: any,
    res: any,
  ): Promise<BookmarkItemsDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const user = this.request.user;

      const bookmarkData = await this.bookmarkItemsModel
        .aggregate([
          {
            $match: {
              user_id: user._id,
            },
          },
          {
            $lookup: {
              from: 'bookmark',
              localField: 'collection_id',
              foreignField: '_id',
              as: 'bookmark_data',
            },
          },
          {
            $unwind: '$bookmark_data',
          },
          {
            $lookup: {
              from: 'requests',
              let: { req_id: '$request_id', type: '$category_slug' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$type', '$category_slug'] },
                        { $eq: ['$$req_id', '$_id'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    cover_photo: {
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
              as: 'request_data',
            },
          },
          {
            $lookup: {
              from: 'ngo',
              let: { req_id: '$request_id', type: '$category_slug' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$type', 'ngo'] },
                        { $eq: ['$$req_id', '$_id'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    cover_photo: {
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
              as: 'ngo_data',
            },
          },
          {
            $lookup: {
              from: 'fund',
              let: { req_id: '$request_id', type: '$category_slug' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$type', '$category_slug'] },
                        { $eq: ['$$req_id', '$_id'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    cover_photo: {
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
              as: 'fund_data',
            },
          },
          {
            $lookup: {
              from: 'drives',
              let: { req_id: '$request_id', type: '$category_slug' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$type', '$category_slug'] },
                        { $eq: ['$$req_id', '$_id'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    cover_photo: {
                      $concat: [
                        authConfig.imageUrl,
                        'drive/',
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
              as: 'drive_data',
            },
          },
          {
            $addFields: {
              allData: {
                $setUnion: [
                  '$request_data',
                  '$ngo_data',
                  '$drive_data',
                  '$fund_data',
                ],
              },
            },
          },
          {
            $group: {
              _id: '$collection_id',
              createdAt: { $first: '$$ROOT.bookmark_data.createdAt' },
              collection_name: { $first: '$$ROOT.bookmark_data.name' },
              cover_photos: {
                $push: {
                  $arrayElemAt: ['$$ROOT.allData.cover_photo', 0],
                },
              },
              fund_count: {
                $sum: {
                  $cond: [{ $eq: ['$category_slug', 'start-fund'] }, 1, 0],
                },
              },
              drive_count: {
                $sum: {
                  $cond: [{ $eq: ['$category_slug', 'saayam-drive'] }, 1, 0],
                },
              },
              ngo_count: {
                $sum: {
                  $cond: [{ $eq: ['$category_slug', 'ngo'] }, 1, 0],
                },
              },
              fundraiser_count: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $ne: ['$category_slug', 'start-fund'],
                        },
                        {
                          $ne: ['$category_slug', 'saayam-drive'],
                        },
                        {
                          $ne: ['$category_slug', 'ngo'],
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
          { $sort: { createdAt: -1 } },
        ])
        .exec();
      return res.json({
        success: true,
        data: bookmarkData,
      });
    } catch (error) {
      console.log(
        '🚀 ~ file: bookmark.service.ts:416 ~ BookmarkService ~ error:',
        error,
      );
      this.errorlogService.errorLog(
        error,
        'src/controller/bookmark/bookmark.service.ts-addToBookmark',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for bookmark fundraiser list
  public async bookmarkFundraiserList(
    listDto: ListDto,
    res: any,
  ): Promise<BookmarkItemsDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        listDto,
      );
      const user = this.request.user;

      const total = await this.bookmarkItemsModel.aggregate([
        {
          $match: {
            user_id: ObjectID(user._id),
            collection_id: ObjectID(listDto.collection_id),
            category_slug: { $nin: ['ngo', 'saayam-drive', 'start-fund'] },
          },
        },
        {
          $lookup: {
            from: 'requests',
            let: { req_id: '$request_id', type: '$category_slug' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$type', '$category_slug'] },
                      { $eq: ['$$req_id', '$_id'] },
                      { $ne: ['$is_deleted', true] },
                    ],
                  },
                },
              },
            ],
            as: 'request_data',
          },
        },
        {
          $unwind: {
            path: '$request_data',
            preserveNullAndEmptyArrays: false,
          },
        },
        { $count: 'count' },
      ]);

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;
      const sortData = ['_id', 'createdAt'];

      let {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        listDto.page,
        listDto.per_page,
        total_record,
        sortData,
        listDto.sort_type,
        'createdAt',
      );

      const lookup = [
        {
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
            from: 'requests',
            let: { req_id: '$request_id', type: '$category_slug' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$type', '$category_slug'] },
                      { $eq: ['$$req_id', '$_id'] },
                      { $ne: ['$is_deleted', true] },
                    ],
                  },
                },
              },
            ],
            as: 'request_data',
          },
        },
        {
          $lookup: {
            from: 'fundraiser_verify',
            let: { id: '$request_id' },
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
      ];

      const unwind = [
        {
          $unwind: {
            path: '$request_data',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $unwind: {
            path: '$tData',
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
          request_data: { $first: '$$ROOT.request_data' },
          lastStatus: { $first: '$lastStatus' },
          total_donation: { $sum: '$tData.converted_amt' },
          myDonation: {
            $sum: {
              $cond: {
                if: { $eq: ['$tData.donor_id', ObjectID(user?._id)] },
                then: '$tData.converted_amt',
                else: 0,
              },
            },
          },
          ngoDonation: {
            $sum: {
              $cond: {
                if: { $eq: ['$tData.donor_id', ObjectID(user?.ngo_id)] },
                then: '$tData.converted_amt',
                else: 0,
              },
            },
          },
          total_donors: { $first: '$totalDonors' },
        },
      };
      const data = await this.bookmarkItemsModel.aggregate(
        [
          {
            $match: {
              user_id: ObjectID(user._id),
              collection_id: ObjectID(listDto.collection_id),
              category_slug: { $nin: ['ngo', 'saayam-drive', 'start-fund'] },
            },
          },
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
                      { $eq: ['$$admin.user_id', ObjectID(user?._id)] },
                      { $eq: ['$$admin.status', 'approve'] },
                    ],
                  },
                },
              },
            },
          },
          ...unwind,
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
              view_reasons: '$lastStatus.form_settings',
              other_reason: '$lastStatus.other_reason',
              disaster_links: '$request_data.disaster_links',
              add_location_for_food_donation:
                '$request_data.add_location_for_food_donation',
              is_bookmark: { $toBool: 'true' },
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
                    $concat: [
                      authConfig.imageUrl,
                      'user/',
                      '$request_data.user_image',
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
              image_url: authConfig.imageUrl + 'request/',
              comment_enabled: '$request_data.comment_enabled',
              allow_testimonial: '$request_data.allow_testimonial',
              reject_testimonial_reason: 1,
              testimonial_status: '$request_data.testimonial_status',
              testimonial_video: '$request_data.testimonial_id',
              manage_permission: {
                $cond: {
                  if: {
                    $ne: ['$request_data.manage_permission', null],
                  },
                  then: '$request_data.manage_permission',
                  else: [],
                },
              },
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
        'src/controller/bookmark/bookmark.service.ts-bookmarkFundraiserList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for bookmark fund list
  public async bookmarkFundList(
    listDto: ListDto,
    res: any,
  ): Promise<BookmarkItemsDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        listDto,
      );
      const user = this.request.user;

      const match = {
        user_id: user._id,
        collection_id: ObjectID(listDto.collection_id),
        category_slug: 'start-fund',
      };

      const lookup = {
        from: 'fund',
        let: { req_id: '$request_id', type: '$category_slug' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$$type', '$category_slug'] },
                  { $eq: ['$$req_id', '$_id'] },
                  { $ne: ['$is_deleted', true] },
                ],
              },
            },
          },
        ],
        as: 'fund_data',
      };

      const unwind = {
        path: '$fund_data',
        preserveNullAndEmptyArrays: false,
      };

      const total = await this.bookmarkItemsModel.aggregate([
        {
          $match: match,
        },
        {
          $lookup: lookup,
        },
        {
          $unwind: unwind,
        },
        {
          $lookup: {
            from: 'ngo',
            localField: 'fund_data.user_ngo_id',
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
          $match: { 'ngoData.is_deleted': { $ne: true } },
        },
        {
          $project: {
            _id: 1,
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
            preserveNullAndEmptyArrays: true,
          },
        },
        { $count: 'count' },
      ]);
      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;
      const sortData = ['_id', 'createdAt'];

      const {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        listDto.page,
        listDto.per_page,
        total_record,
        sortData,
        listDto.sort_type,
        listDto.sort,
      );

      const result = await this.bookmarkItemsModel.aggregate(
        [
          {
            $match: match,
          },
          {
            $lookup: {
              from: 'transactions',
              let: { id: '$request_id' },
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
            $lookup: lookup,
          },
          {
            $unwind: unwind,
          },
          {
            $lookup: {
              from: 'user',
              localField: 'fund_data.user_id',
              foreignField: '_id',
              as: 'userData',
            },
          },
          {
            $lookup: {
              from: 'ngo',
              localField: 'fund_data.user_ngo_id',
              foreignField: '_id',
              as: 'ngoData',
            },
          },
          {
            $unwind: {
              path: '$userData',
              preserveNullAndEmptyArrays: false,
            },
          },
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
            $project: {
              _id: '$fund_data._id',
              fund_type: '$fund_data.fund_type',
              fund_causes: '$fund_data.fund_causes',
              createdAt: '$fund_data.createdAt',
              corporate_id: '$fund_data.corporate_id',
              active_type: '$fund_data.active_type',
              status: '$fund_data.status',
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
                  { $toString: '$fund_data._id' },
                  '/',
                ],
              },
              country_data: '$fund_data.country_data',
              reference_id: '$fund_data.reference_id',
              'form_data.title_of_fundraiser':
                '$fund_data.form_data.title_of_fundraiser',
              'form_data.describe_your_fund':
                '$fund_data.form_data.describe_your_fund',
              'form_data.how_the_funds_will_be_used':
                '$fund_data.form_data.how_the_funds_will_be_used',
              'form_data.files.photos': {
                $map: {
                  input: '$fund_data.form_data.files.photos',
                  as: 'photo',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'fund/',
                      { $toString: '$fund_data._id' },
                      '/',
                      { $toString: '$$photo' },
                    ],
                  },
                },
              },
              is_bookmark: { $toBool: 'true' },
              total_donors: {
                $size: { $setUnion: ['$donations.donor_user_id', []] },
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
        'src/controller/bookmark/bookmark.service.ts-bookmarkFundList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for bookmark drive list
  public async bookmarkDriveList(
    listDto: ListDto,
    res: any,
  ): Promise<BookmarkItemsDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        listDto,
      );
      const user = this.request.user;
      const match = {
        user_id: user._id,
        collection_id: ObjectID(listDto.collection_id),
        category_slug: 'saayam-drive',
      };
      const lookup = {
        from: 'drives',
        let: { req_id: '$request_id', type: '$category_slug' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$$type', '$category_slug'] },
                  { $eq: ['$$req_id', '$_id'] },
                  { $ne: ['$is_deleted', true] },
                ],
              },
            },
          },
        ],
        as: 'drive_data',
      };
      const unwind = {
        path: '$drive_data',
        preserveNullAndEmptyArrays: false,
      };

      const addFields = {
        manage_permission: {
          $filter: {
            input: '$drive_data.volunteers',
            as: 'v',
            cond: {
              $eq: ['$$v.user_id', ObjectID(user?._id)],
            },
          },
        },
        goingAttendees: {
          $filter: {
            input: '$drive_data.volunteers',
            as: 'v',
            cond: {
              $and: [
                { $eq: ['$$v.status', 'approve'] },
                { $eq: ['$$v.role', 'attendee'] },
              ],
            },
          },
        },
        existVolunteers: {
          $filter: {
            input: '$drive_data.volunteers',
            as: 'v',
            cond: {
              $ne: ['$$v.role', 'attendee'],
            },
          },
        },
      };

      const total = await this.bookmarkItemsModel.aggregate([
        { $match: match },
        { $lookup: lookup },
        { $unwind: unwind },
        { $addFields: addFields },
        { $count: 'count' },
      ]);
      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;
      const sortData = ['_id', 'createdAt'];

      let {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        listDto.page,
        listDto.per_page,
        total_record,
        sortData,
        listDto.sort_type,
        listDto.sort,
      );

      const result = await this.bookmarkItemsModel.aggregate(
        [
          { $match: match },
          { $lookup: lookup },
          { $unwind: unwind },
          { $addFields: addFields },
          {
            $unwind: {
              path: '$manage_permission',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'user',
              localField: 'drive_data.user_id',
              foreignField: '_id',
              as: 'userData',
            },
          },
          {
            $lookup: {
              from: 'user',
              localField: 'existVolunteers.user_id',
              foreignField: '_id',
              as: 'vUserData',
            },
          },
          {
            $lookup: {
              from: 'user',
              let: {
                volunteers: '$goingAttendees.user_id',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ['$_id', '$$volunteers'],
                    },
                  },
                },
                { $limit: 5 },
                { $sort: { _id: -1 } },
              ],
              as: 'goingAttendeesData',
            },
          },
          {
            $unwind: {
              path: '$userData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'drive_user_event',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$drive_id', '$$id'] },
                        { $eq: ['$user_id', ObjectID(user._id)] },
                      ],
                    },
                  },
                },
              ],
              as: 'eventData',
            },
          },
          {
            $project: {
              _id: '$drive_data._id',
              createdAt: '$drive_data.createdAt',
              status: '$drive_data.status',
              corporate_id: '$drive_data.corporate_id',
              active_type: '$drive_data.active_type',
              category_slug: 'saayam-drive',
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
                  'drive/',
                  { $toString: '$drive_data._id' },
                  '/',
                ],
              },
              event_data: '$eventData',
              country_data: '$drive_data.country_data',
              reference_id: '$drive_data.reference_id',
              'form_data.title_of_fundraiser':
                '$drive_data.form_data.title_of_fundraiser',
              'form_data.drive_location':
                '$drive_data.form_data.drive_location',
              'form_data.add_link': '$drive_data.form_data.add_link',
              'form_data.link_available':
                '$drive_data.form_data.link_available',
              'form_data.date_time': '$drive_dataeform_data.date_time',
              'form_data.start_date_time':
                '$drive_data.form_data.start_date_time',
              'form_data.end_date_time': '$drive_data.form_data.end_date_time',
              is_started: '$drive_data.is_started',
              max_participants: '$drive_data.form_data.max_participants',
              location: '$drive_data.location',
              going_attendees_count: { $size: '$goingAttendees' },
              manage_permission: 1,
              'form_data.files.photos': {
                $map: {
                  input: '$drive_data.form_data.files.photos',
                  as: 'photo',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'drive/',
                      { $toString: '$_id' },
                      '/',
                      '$$photo',
                    ],
                  },
                },
              },
              attendeeData: {
                $map: {
                  input: '$goingAttendeesData',
                  as: 'volunteer',
                  in: {
                    _id: '$$volunteer._id',
                    first_name: '$$volunteer.first_name',
                    last_name: '$$volunteer.last_name',
                    image: {
                      $ifNull: [
                        {
                          $concat: [
                            authConfig.imageUrl,
                            'user/',
                            '$$volunteer.image',
                          ],
                        },
                        null,
                      ],
                    },
                  },
                },
              },
              existVolunteers: {
                $map: {
                  input: '$vUserData',
                  as: 'v',
                  in: {
                    _id: '$$v._id',
                    email: '$$v.email',
                    phone: '$$v.phone',
                    phone_code: '$$v.phone_code',
                  },
                },
              },
              is_bookmark: { $toBool: 'true' },
              is_joined: {
                $cond: {
                  if: {
                    $and: [{ $ne: [user._id, null] }, { $ne: [user._id, ''] }],
                  },
                  then: {
                    $in: [ObjectID(user._id), '$drive_data.volunteers.user_id'],
                  },
                  else: false,
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
        'src/controller/bookmark/bookmark.service.ts-bookmarkDriveList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for bookmark ngo list
  public async bookmarkNgoList(
    listDto: ListDto,
    res: any,
  ): Promise<BookmarkItemsDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        listDto,
      );
      const user = this.request.user;

      const match = {
        user_id: user._id,
        collection_id: ObjectID(listDto.collection_id),
        category_slug: 'ngo',
      };

      const lookup = {
        from: 'ngo',
        let: { req_id: '$request_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$$req_id', '$_id'] },
                  { $eq: ['$ngo_status', 'approve'] },
                  { $ne: ['$is_deleted', true] },
                  { $ne: ['$is_expired', true] },
                ],
              },
            },
          },
        ],
        as: 'ngo_data',
      };

      const unwind = {
        path: '$ngo_data',
        preserveNullAndEmptyArrays: false,
      };

      const total = await this.bookmarkItemsModel.aggregate([
        { $match: match },
        { $lookup: lookup },
        { $unwind: unwind },
        { $count: 'count' },
      ]);

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;
      const sortData = ['_id', 'createdAt'];

      let {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        listDto.page,
        listDto.per_page,
        total_record,
        sortData,
        listDto.sort_type,
        listDto.sort,
      );

      const result = await this.bookmarkItemsModel.aggregate([
        { $match: match },
        { $lookup: lookup },
        { $unwind: unwind },
        {
          $lookup: {
            from: 'favourite-ngo',
            let: { id: '$ngo_data._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ['$user_id', ObjectID(user._id)],
                      },
                      { $eq: ['$ngo_id', '$$id'] },
                    ],
                  },
                },
              },
            ],
            as: 'favouriteData',
          },
        },
        {
          $unwind: {
            path: '$favouriteData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: '$ngo_data._id',
            ngo_cover_image: {
              $concat: [
                authConfig.imageUrl,
                'ngo/',
                { $toString: '$ngo_data._id' },
                '/',
                {
                  $arrayElemAt: [
                    '$ngo_data.form_data.files.ngo_cover_photo',
                    0,
                  ],
                },
              ],
            },
            ngo_name: '$ngo_data.form_data.ngo_name',
            ngo_registration_number:
              '$ngo_data.form_data.registration_certificate_number',
            phone_country_short_name:
              '$ngo_data.form_data.ngo_mobile_number.short_name',
            ngo_address: '$ngo_data.ngo_address',
            first_name: '$ngo_data.form_data.first_name',
            last_name: '$ngo_data.form_data.last_name',
            ngo_phone: '$ngo_data.form_data.ngo_mobile_number.phoneNumber',
            ngo_phone_code:
              '$ngo_data.form_data.ngo_mobile_number.countryCodeD',
            createdAt: '$ngo_data.createdAt',
            is_bookmark: { $toBool: 'true' },
            is_favourite: {
              $cond: {
                if: { $gt: ['$favouriteData', null] },
                then: true,
                else: false,
              },
            },
            index: '$favouriteData.index',
            country_data: '$ngo_data.country_data',
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
        'src/controller/bookmark/bookmark.service.ts-bookmarkNgoList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
