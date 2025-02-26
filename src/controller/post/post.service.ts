import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { authConfig } from 'src/config/auth.config';
import { PostModel, PostDocument } from './entities/post.entity';
import {
  RequestModel,
  RequestDocument,
} from '../request/entities/request.entity';
import { LikeDislikeDto } from './dto/like-dislike.dto';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
import { Drive, DriveDocument } from '../drive/entities/drive.entity';
import { CommentModel, CommentDocument } from './entities/comment.entity';
import { CommentDto } from './dto/comment.dto';
import { FeedListDto } from './dto/feed-list.dto';
import { GetReasonDto } from './dto/get-reason.dto';
import {
  ManageVolunteer,
  ManageVolunteerDocument,
} from '../manage-volunteer/entities/manage-volunteer.entity';

const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class PostService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(PostModel.name) private postModel: Model<PostDocument>,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(Ngo.name)
    private ngoModel: Model<NgoDocument>,
    @InjectModel(Drive.name)
    private driveModel: Model<DriveDocument>,
    @InjectModel(CommentModel.name)
    private commentModel: Model<CommentDocument>,
    @InjectModel(ManageVolunteer.name)
    private manageVolunteerModel: Model<ManageVolunteerDocument>,
  ) {}

  //Api for create post
  public async createPost(createPostDto: CreatePostDto, res) {
    try {
      // Check the request type to determine the model
      let model: any = this.requestModel;
      if (createPostDto.request_type == 'ngo') {
        model = this.ngoModel;
      } else if (createPostDto.request_type == 'drive') {
        model = this.driveModel;
      }

      //Find particular request/drive/ngo data
      const findRequest: any = await model
        .findOne({
          _id: ObjectID(createPostDto.request_id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          user_id: 1,
          trustees_name: 1,
          reference_id: 1,
          category_slug: 1,
          ngo_name: '$form_data.ngo_name',
          request_name: '$form_data.title_of_fundraiser',
        })
        .lean();
      if (!findRequest) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const userData = this.request.user;
        createPostDto.user_id = userData._id;

        //Create new data
        const createPost = new this.postModel(createPostDto);
        const result = await createPost.save();

        // Upload post images from tmp to post folder
        if (createPostDto.photos && !_.isEmpty(createPostDto.photos)) {
          const files: any = createPostDto.photos;

          files.map(async (item) => {
            await this.commonService.uploadFileOnS3(
              item,
              `post/${findRequest._id}/${result._id}`,
            );
          });
        }

        if (createPostDto.request_type == 'ngo') {
          //send notification to ngo trustees
          const ids = findRequest.trustees_name.map((item) => {
            return item._id;
          });
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_ngo_post,
            { '{{ngo}}': findRequest.ngo_name },
          );
          const input: any = {
            message: msg,
            title: mConfig.noti_title_ngo_post,
            type: 'ngo',
            ngoId: findRequest._id,
            userId: ids,
          };

          await this.commonService.sendAllNotification(ids, input);
        } else {
          //Send notification to request user
          const notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_request_post,
            {
              '{{request_name}}': findRequest.request_name,
              '{{refId}}': findRequest.reference_id,
            },
          );

          const notiTitle = await this.commonService.changeString(
            mConfig.noti_title_request_post,
            {
              '{{request}}':
                createPostDto.request_type == 'drive' ? 'Drive' : 'Request',
            },
          );
          const input: any = {
            title: notiTitle,
            type: findRequest.category_slug,
            requestId: findRequest._id,
            categorySlug: findRequest.category_slug,
            message: notiMsg,
            userId: findRequest.user_id,
            requestUserId: findRequest.user_id,
          };

          this.commonService.notification(input, true);
        }

        return res.json({ success: true, message: mConfig.Post_created });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/post/post.service.ts-createPost',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for post like unlike
  public async likeDislike(likeDislikeDto: LikeDislikeDto, res: any) {
    try {
      const userData = this.request.user;
      //Check post exist or not
      const postData: any = await this.postModel
        .findOne({
          _id: ObjectID(likeDislikeDto.post_id),
          is_deleted: { $ne: true },
          is_blocked: { $ne: true },
        })
        .select({ _id: 1, request_type: 1 })
        .lean();
      if (!postData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const existCommentData: any = await this.commentModel
          .findOne({
            post_id: ObjectID(likeDislikeDto.post_id),
            user_id: userData._id,
            type: likeDislikeDto.type,
          })
          .select({ _id: 1 })
          .lean();

        const dtl: any = {
          post_id: likeDislikeDto.post_id,
          user_id: userData._id,
          type: likeDislikeDto.type,
        };
        let msg = '';
        if (likeDislikeDto.type == 'like') {
          if (!existCommentData) {
            //Add record for comment like
            const addComment = new this.commentModel(dtl);
            await addComment.save();
          }
          msg = mConfig.Post_like;
        } else if (likeDislikeDto.type == 'dislike') {
          //delete liked record from db
          if (existCommentData) {
            await this.commentModel.deleteOne(dtl).lean();
          }
          msg = mConfig.Post_dislike;
        }
        return res.json({
          message: msg,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/post/post.service.ts-likeDislike',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for post likes user list
  public async likeUserList(id, param, res: any) {
    try {
      // Define a match query to filter data
      const match = {
        post_id: ObjectID(id),
        type: 'like',
      };

      const sortData = {
        createdAt: 'createdAt',
      };

      // Define a lookup to retrieve related user data
      const lookup = [
        {
          $lookup: {
            from: 'user',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_data',
          },
        },
        {
          $unwind: '$user_data',
        },
      ];

      // Calculate the total count of items
      const total = await this.commentModel
        .aggregate([
          {
            $match: match,
          },
          ...lookup,
          { $count: 'count' },
        ])
        .exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      // Perform pagination and sorting
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
        1,
        'createdAt',
      );

      // Retrieve and process the data
      const data = await this.commentModel
        .aggregate([
          {
            $match: match,
          },
          ...lookup,
          {
            $project: {
              _id: 1,
              user_name: {
                $concat: ['$user_data.first_name', ' ', '$user_data.last_name'],
              },
              createdAt: 1,
              user_image: {
                $concat: [authConfig.imageUrl, 'user/', '$user_data.image'],
              },
            },
          },
          { $sort: sort },
          { $skip: start_from },
          { $limit: per_page },
        ])
        .exec();

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
        'src/controller/post/post.service.ts-likeUserList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for feed list
  public async feedList(id, param: FeedListDto, res: any) {
    try {
      const userData = this.request.user;
      // Check the request type to determine the model
      let model: any = this.requestModel;
      if (param.request_type == 'ngo ') {
        model = this.ngoModel;
      } else if (param.request_type == 'drive') {
        model = this.driveModel;
      }

      // Define a match query to filter data
      const match = {
        request_id: ObjectID(id),
        is_deleted: { $ne: true },
        is_blocked: { $ne: true },
      };

      // Find a specific document in the model
      const findData = await model
        .findOne({ _id: ObjectID(id), is_deleted: { $ne: true } })
        .select({ _id: 1 })
        .lean();
      if (!findData) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const sortData = {
          createdAt: 'createdAt',
        };

        // Define a lookup to retrieve related user data
        const lookup = [
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
                    user_name: {
                      $concat: ['$first_name', ' ', '$last_name'],
                    },
                    user_image: {
                      $concat: [authConfig.imageUrl, 'user/', '$image'],
                    },
                  },
                },
              ],
              as: 'userData',
            },
          },
          {
            $unwind: {
              path: '$userData',
              preserveNullAndEmptyArrays: true,
            },
          },
        ];

        // Calculate the total count of items
        const total = await this.postModel
          .aggregate([
            {
              $match: match,
            },
            { $count: 'count' },
          ])
          .exec();

        const total_record =
          total && total[0] && total[0].count ? total[0].count : 0;

        // Perform pagination and sorting
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
          -1,
          'createdAt',
        );

        // Retrieve and process the data
        const data = await this.postModel
          .aggregate([
            {
              $match: match,
            },
            ...lookup,
            {
              $lookup: {
                from: 'post_comments',
                let: { id: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $ne: ['$is_deleted', true] },
                          { $eq: ['$post_id', '$$id'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'comments',
              },
            },
            {
              $project: {
                _id: 1,
                user_id: 1,
                user_name: '$userData.user_name',
                user_image: '$userData.user_image',
                photos: {
                  $map: {
                    input: '$photos',
                    as: 'photo',
                    in: {
                      $concat: [
                        authConfig.imageUrl,
                        'post/',
                        { $toString: '$request_id' },
                        '/',
                        { $toString: '$_id' },
                        '/',
                        '$$photo',
                      ],
                    },
                  },
                },
                request_id: 1,
                description: 1,
                likes_count: {
                  $sum: {
                    $map: {
                      input: '$comments',
                      as: 'comment',
                      in: {
                        $cond: [{ $eq: ['$$comment.type', 'like'] }, 1, 0],
                      },
                    },
                  },
                },
                is_liked: {
                  $sum: {
                    $map: {
                      input: '$comments',
                      as: 'comment',
                      in: {
                        $cond: [
                          {
                            $and: [
                              { $eq: ['$$comment.type', 'like'] },
                              {
                                $eq: [
                                  '$$comment.user_id',
                                  ObjectID(userData?._id),
                                ],
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
                comments_count: {
                  $sum: {
                    $map: {
                      input: '$comments',
                      as: 'comment',
                      in: {
                        $cond: [{ $eq: ['$$comment.type', 'comment'] }, 1, 0],
                      },
                    },
                  },
                },
                createdAt: 1,
              },
            },
            { $sort: sort },
            { $skip: start_from },
            { $limit: per_page },
          ])
          .exec();

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
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/post/post.service.ts-feedList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for create comment in post
  public async addComment(
    commentDto: CommentDto,
    res: any,
  ): Promise<CommentModel> {
    try {
      const userDetail = this.request.user;

      // Check if the post with the provided post ID exists and is not blocked.
      const data = await this.postModel
        .findOne({
          _id: ObjectID(commentDto.post_id),
          is_blocked: { $ne: true },
        })
        .select({ _id: 1 })
        .lean();

      if (data) {
        const createComment = {
          parent_id: commentDto.parent_id ? commentDto.parent_id : 0,
          comment: commentDto.comment,
          post_id: commentDto.post_id,
          user_id: userDetail._id,
          type: 'comment',
        };

        // Save the new comment to the database.
        const addComment = new this.commentModel(createComment);
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
        'src/controller/post/post.service.ts-addComment',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update comment in post
  public async updateComment(
    id: string,
    comment: string,
    res: any,
  ): Promise<CommentModel> {
    try {
      //find the comment in the database using the provided id and update
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
        'src/controller/post/post.service.ts-updateComment',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete comment in post
  public async deleteComment(id: string, res: any): Promise<CommentModel> {
    try {
      //find the comment in the database using the provided id and add is_delete key
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
        'src/controller/post/post.service.ts-deleteComment',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for list comments of post
  public async commentList(
    id: string,
    param: any,
    res: any,
  ): Promise<Comment[]> {
    try {
      // Define a match query to filter data
      const query: any = {
        parent_id: '0',
        is_deleted: { $ne: true },
        type: 'comment',
        post_id: ObjectID(id),
      };

      if (!_.isUndefined(param.parent_id)) {
        query.parent_id = param.parent_id;
      }

      const sortData = { _id: '_id' };

      // Calculate the total count of items
      const total_record = await this.commentModel.count(query).lean();

      // Perform pagination and sorting
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

      // Retrieve and process the data
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
            from: 'post_comments',
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
        'src/controller/post/post.service.ts-commentList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for report post
  public async reportPost(reportPostDto: GetReasonDto, res: any) {
    try {
      const userDetail = this.request.user;
      const updateData = {
        user_id: userDetail._id,
        user_name: userDetail.display_name,
        description: reportPostDto.reason,
        added_time: new Date(),
      };

      //find the post in the database using the provided id and add report
      const postData: any = await this.postModel
        .findOneAndUpdate(
          {
            _id: reportPostDto.post_id,
            is_deleted: { $ne: true },
            is_blocked: { $ne: true },
          },
          { $addToSet: { report_post: updateData } },
          { new: true },
        )
        .select({ _id: 1, request_type: 1 })
        .lean();

      if (!postData) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        return res.send({
          success: true,
          message: mConfig.Reported_successfully,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/post/post.service.ts-reportPost',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete post
  public async deletePost(id, res) {
    try {
      //find the post in the database using the provided id and add is_delete key
      const result: any = await this.postModel
        .findOneAndUpdate(
          {
            _id: ObjectID(id),
            is_deleted: { $ne: true },
            is_blocked: { $ne: true },
          },
          { is_deleted: true },
          { new: true },
        )
        .select({ _id: 1, request_id: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      return res.json({
        success: true,
        message: mConfig.Post_deleted,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/post/post.service.ts-deletePost',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for block post
  public async blockPost(id: string, res: any) {
    try {
      //find the post in the database using the provided id and add is_blocked key
      const postData: any = await this.postModel
        .findOneAndUpdate(
          {
            _id: ObjectID(id),
            is_deleted: { $ne: true },
            is_blocked: { $ne: true },
          },
          { is_blocked: true },
          { new: true },
        )
        .select({ _id: 1, request_id: 1, request_type: 1, user_id: 1 })
        .lean();
      if (!postData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //find user and block
        if (!_.includes(['ngo', 'drive'], postData.request_type)) {
          //find block post user and block
          await this.requestModel
            .findOneAndUpdate(
              {
                _id: ObjectID(postData.request_id),
                'admins.user_id': ObjectID(postData.user_id),
              },
              {
                $set: {
                  'admins.$.status': 'block',
                  'admins.$.block_time': new Date(),
                },
              },
              { new: true },
            )
            .select({ _id: 1 })
            .lean();

          //find block post user and block
          await this.manageVolunteerModel
            .findOneAndUpdate(
              {
                request_id: ObjectID(postData.request_id),
                volunteer_id: ObjectID(postData.user_id),
              },
              { status: 'block', block_time: new Date() },
              { new: true },
            )
            .select({ _id: 1 })
            .lean();
        }

        //send notification to user
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_post_block,
          {
            '{{post_type}}': postData.request_type,
          },
        );
        const input: any = {
          title: mConfig.noti_title_post_block,
          type: 'block-post',
          requestId: postData._id,
          categorySlug: postData.request_type,
          message: notiMsg,
          userId: postData.user_id,
        };

        this.commonService.notification(input);
        return res.json({
          message: mConfig.noti_title_post_block,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/post/post.service.ts-blockPost',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
