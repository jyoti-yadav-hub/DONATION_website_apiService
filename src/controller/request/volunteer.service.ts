/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import {
  FoodRequestModel,
  FoodRequestDocument,
} from './entities/food-request.entity';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from '../../config/auth.config';
import mConfig from '../../config/message.config.json';
import { QueueService } from '../../common/queue.service';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { CommonService } from '../../common/common.service';
import { AssignVolunteer } from './dto/assign-volunteer.dto';
import { ErrorlogService } from '../error-log/error-log.service';
import { UpdateVolunteerLocation } from './dto/update-volunteer-location.dto';
import { RequestModel, RequestDocument } from './entities/request.entity';
import { VerifyTestimonialDto } from './dto/verify-testimonial.dto';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
import {
  RequestReels,
  RequestReelsDocument,
} from './entities/request-reels.entity';
import { Queue, QueueDocument } from './entities/queue-data.entity';
import {
  TransactionModel,
  TransactionDocument,
} from '../donation/entities/transaction.entity';
import { StripeService } from 'src/stripe/stripe.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { LogService } from '../../common/log.service';
import { FundraiserRequestVerifyDto } from './dto/fundraiser-request-verify.dto';
import {
  FundraiserVerify,
  FundraiserVerifyDocument,
} from './entities/fundraiser-request-verify.entity';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectID = require('mongodb').ObjectID;

@Injectable({ scope: Scope.REQUEST })
export class VolunteerService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly queueService: QueueService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly stripeService: StripeService,
    private readonly logService: LogService,
    @InjectModel(FoodRequestModel.name)
    private foodRequestModel: Model<FoodRequestDocument>,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(Ngo.name)
    private ngoModel: Model<NgoDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Queue.name)
    private queueModel: Model<QueueDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(RequestReels.name)
    private requestReelsModel: Model<RequestReelsDocument>,
    @InjectModel(FundraiserVerify.name)
    private fundraiserVerify: Model<FundraiserVerifyDocument>,
  ) {}

  //Api for assign volunteer
  public async assignVolunteer(id, assignVolunteer: AssignVolunteer, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        assignVolunteer,
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
        const userId: any = userDetail._id.toString();
        const userName = userDetail.display_name
          ? userDetail.display_name
          : userDetail.first_name + ' ' + userDetail.last_name;
        if (
          (assignVolunteer.deliver_by_self === true &&
            foodRequest.donor_id.toString() === userId &&
            foodRequest.status === 'donor_accept') ||
          foodRequest.status === 'waiting_for_volunteer'
        ) {
          let address = userDetail.location.city
            ? userDetail.location.city
            : '';
          const lat = userDetail?.current_location?.[1] || assignVolunteer.lat;
          const lng = userDetail?.current_location?.[0] || assignVolunteer.lng;
          if (foodRequest && foodRequest?.donor_ngo_id) {
            const ngoData: any = await this.ngoModel
              .findById({ _id: ObjectID(foodRequest.donor_ngo_id) })
              .select({ _id: 1, ngo_address: 1 })
              .lean();
            address =
              ngoData?.ngo_address && ngoData?.ngo_address?.city
                ? ngoData.ngo_address.city
                : '';
          } else if (
            userDetail &&
            userDetail.is_donor &&
            userDetail.is_restaurant
          ) {
            address =
              userDetail.restaurant_location &&
              userDetail.restaurant_location.city
                ? userDetail.restaurant_location.city
                : '';
          }

          const details: any = {
            deliver_by_self: true,
            status: 'pickup',
            picked_up_time: new Date(),
            volunteer_id: ObjectID(userId),
            volunteer_accept: {
              user_name: userName,
              country_code: userDetail.country_data.country_code,
              phone: userDetail.phone_code + userDetail.phone,
              image: _.isNull(userDetail.image)
                ? userDetail.image
                : authConfig.imageUrl + 'user/' + userDetail.image,
              address,
              lat,
              lng,
              accept_time: new Date(),
            },
            $unset: { noVolunteer: 1 },
          };

          foodRequest.donor_ngo_id
            ? (details.volunteer_ngo_id = foodRequest.donor_ngo_id)
            : false;

          await this.foodRequestModel
            .updateOne({ _id: foodRequest._id }, details)
            .lean();

          let ngo_user_id = '';
          const input: any = {
            title: mConfig.noti_title_food_request_picked,
            type: 'food',
            requestId: foodRequest._id,
            categorySlug: foodRequest.category_slug,
            requestUserId: foodRequest.user_id,
          };

          const updateData1 = {
            '{{refId}}': foodRequest.reference_id,
            '{{userName}}': userName,
          };

          //send notification to user
          if (
            foodRequest.user_id.toString() !== foodRequest.donor_id.toString()
          ) {
            const donor_pickup_itself = await this.commonService.changeString(
              mConfig.noti_msg_donor_pickup_itself,
              updateData1,
            );
            input.message = donor_pickup_itself;
            input.userId = foodRequest.user_id;
            this.commonService.notification(input);
          }
          //send notification to another trustee of user ngo
          if (foodRequest && foodRequest.user_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              foodRequest.user_ngo_id,
              foodRequest.user_id,
            );
            if (
              notiId &&
              notiId.toString() !== foodRequest.donor_id.toString()
            ) {
              const ngo_food_pickup_itself =
                await this.commonService.changeString(
                  mConfig.noti_msg_ngo_food_pickup_itself,
                  updateData1,
                );
              input.message = ngo_food_pickup_itself;
              input.userId = notiId;
              ngo_user_id = notiId;
              this.commonService.notification(input);
            }
          }
          //send notification to trustee of donor ngo
          if (foodRequest && foodRequest.donor_ngo_id) {
            const notiId = await this.commonService.getNgoUserIds(
              foodRequest.donor_ngo_id,
              foodRequest.donor_id,
            );
            if (
              notiId &&
              foodRequest.user_id.toString() !== notiId.toString()
            ) {
              if (
                !ngo_user_id ||
                (ngo_user_id && notiId.toString() !== ngo_user_id.toString())
              ) {
                const food_pickup = await this.commonService.changeString(
                  mConfig.noti_msg_food_pickup,
                  updateData1,
                );
                input.message = food_pickup;
                input.userId = notiId;
                this.commonService.notification(input);
              }
            }
          }

          // const result = await this.queueService.getUserDetail(userId);
          const requestData = await this.commonService.getFoodRequest(
            foodRequest._id,
          );

          return res.json({
            success: true,
            data: requestData,
            // userData: result,
          });
        } else if (
          assignVolunteer.deliver_by_self === false &&
          foodRequest.donor_id.toString() === userId &&
          foodRequest.status == 'donor_accept'
        ) {
          //find data from setting
          const { radiusKm, maxRadiusKm, acceptTimeOut, limit }: any =
            await this.queueService.getRequestSetting(
              foodRequest.country_data.country,
            );

          // check donors available in max radius
          const volunteerData: any = await this.queueService.getVolunteer(
            foodRequest,
            maxRadiusKm,
          );

          let noVolunteer = false;
          if (
            (volunteerData && _.isEmpty(volunteerData.newVolunteers)) ||
            _.isEmpty(volunteerData)
          ) {
            noVolunteer = true;
            await this.foodRequestModel
              .updateOne(
                { _id: foodRequest._id },
                { $set: { noVolunteer: true } },
              )
              .lean();
          } else {
            const order = {
              request_id: foodRequest._id,
              radius_km: radiusKm,
              max_radius_km: maxRadiusKm,
              accept_time_out: acceptTimeOut,
              limit: limit,
            };
            //Insert volunteer in food request and get that user detail
            const response: any =
              await this.queueService.manageFoodRequestForVolunteer(order);
            if (response.removeJob) {
              noVolunteer = true;
            }
          }

          const requestData = await this.commonService.getFoodRequest(
            foodRequest._id,
          );

          let respData: any = {
            message: mConfig.No_volunteer_found,
            noVolunteer: true,
            data: requestData,
            success: false,
          };
          if (!noVolunteer) {
            // const result = await this.queueService.getUserDetail(userId);

            respData = {
              success: true,
              data: requestData,
              // userData: result,
            };
          }
          return res.json(respData);
        } else {
          return res.json({
            message: mConfig.You_are_not_donor_of_this_request,
            success: false,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/volunteer.service.ts-assignVolunteer',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update volunteer location
  public async updateVolunteerLocation(
    id,
    updateVolunteerLocation: UpdateVolunteerLocation,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateVolunteerLocation,
      );

      const foodRequest = await this.foodRequestModel
        .findOne({ _id: ObjectID(id) })
        .select({ _id: 1, volunteer_id: 1, volunteer_accept: 1 })
        .lean();

      if (!foodRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const userDetail = this.request.user;
        if (foodRequest.volunteer_id == userDetail._id.toString()) {
          const updateData: any = {
            volunteer_accept: foodRequest.volunteer_accept,
          };

          updateData.volunteer_accept.lat = updateVolunteerLocation.lat;
          updateData.volunteer_accept.lng = updateVolunteerLocation.lng;

          await this.foodRequestModel
            .updateOne({ _id: foodRequest._id }, updateData)
            .exec();

          const requestData = await this.commonService.getFoodRequest(
            foodRequest._id,
          );

          return res.json({
            success: true,
            data: requestData,
          });
        } else {
          return res.json({
            success: false,
            message: mConfig.You_are_not_volunteer_of_this_request,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/volunteer.service.ts-updateVolunteerLocation',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for upload Thank you video after request complete
  public async uploadTestimonialVideo(file: object, id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const causeRequest = await this.requestModel
        .findOne({ _id: ObjectID(id), status: 'close' })
        .select({
          _id: 1,
          uname: 1,
          category_slug: 1,
          category_name: 1,
          reference_id: 1,
          user_id: 1,
        })
        .lean();

      if (!causeRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const imageId: any = await this.commonService.checkAndLoadImage(
          file,
          'testimonial-video',
        );
        if (!imageId.success) {
          return res.json(imageId);
        }
        const data = {
          name: imageId && imageId.file_name ? imageId.file_name : null,
          request_id: ObjectID(causeRequest._id),
          user_id: ObjectID(causeRequest.user_id),
          status: 'pending',
          video_type: 'testimonial',
        };

        const createReels = new this.requestReelsModel(data);
        const reelsData = await createReels.save();

        await this.requestModel
          .findByIdAndUpdate(
            { _id: ObjectID(causeRequest._id) },
            {
              $set: {
                testimonial_id: ObjectID(reelsData._id),
                allow_testimonial: false,
                testimonial_status: 'pending',
              },
            },
          )
          .lean();

        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_upload_testimonial_video,
          { '{{uname}}': causeRequest.uname },
        );
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_upload_testimonial_video,
          {
            '{{uname}}': causeRequest.uname,
            '{{cause}}': causeRequest.category_name,
            '{{refId}}': causeRequest.reference_id,
          },
        );

        //send notification to admin
        const input: any = {
          title: notiTitle,
          type: 'testimonial',
          requestId: causeRequest._id,
          categorySlug: causeRequest.category_slug,
          message: notiMsg,
        };
        this.commonService.sendAdminNotification(input);
        return res.json({
          success: true,
          message: mConfig.video_uploaded_successfully,
          url: authConfig.imageUrl + 'testimonial-video/' + imageId.file_name,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/volunteer.service.ts-uploadTestimonialVideo',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for verify Testimonial video
  public async verifyTestimonial(
    verifyTestimonialDto: VerifyTestimonialDto,
    res: any,
  ): Promise<RequestDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        verifyTestimonialDto,
      );
      const match = { _id: ObjectID(verifyTestimonialDto.id) };
      const lookup = {
        $lookup: {
          from: 'requests', // collection name in db
          localField: 'request_id',
          foreignField: '_id',
          as: 'causeData',
        },
      };
      let reelsData: any = await this.requestReelsModel
        .aggregate([
          lookup,
          { $unwind: '$causeData' },
          { $match: match },
          {
            $project: {
              _id: 1,
              category_name: '$causeData.category_name',
              reference_id: '$causeData.reference_id',
              category_slug: '$causeData.category_slug',
              request_id: 1,
              user_id: 1,
            },
          },
        ])
        .exec();

      if (!_.isEmpty(reelsData) && !_.isEmpty(reelsData[0])) {
        reelsData = reelsData[0];
        const updateData: any = {
          $set: {
            status: verifyTestimonialDto.status,
          },
        };
        await this.requestReelsModel
          .findByIdAndUpdate(
            { _id: ObjectID(verifyTestimonialDto.id) },
            updateData,
            {
              new: true,
            },
          )
          .lean();

        const updateData1: any = {
          $set: {
            testimonial_status: verifyTestimonialDto.status,
          },
        };

        if (verifyTestimonialDto.status === 'reject') {
          const allowTestimonial = verifyTestimonialDto.allow_testimonial
            ? verifyTestimonialDto.allow_testimonial
            : false;
          updateData1['$set']['allow_testimonial'] = allowTestimonial;
          updateData1['$set']['reject_testimonial_reason'] =
            verifyTestimonialDto.reason;
        }

        await this.requestModel
          .findByIdAndUpdate(
            { _id: ObjectID(reelsData.request_id) },
            updateData1,
            {
              new: true,
            },
          )
          .lean();

        const status =
          verifyTestimonialDto.status === 'approve'
            ? 'approved'
            : verifyTestimonialDto.status === 'reject'
            ? 'rejected'
            : verifyTestimonialDto.status === 'deactivate'
            ? 'deactivated'
            : verifyTestimonialDto.status;

        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_testimonial_video,
          {
            '{{status}}': status,
          },
        );

        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_testimonial_video,
          {
            '{{cause}}': reelsData.category_name,
            '{{refId}}': reelsData.reference_id,
            '{{status}}': status,
          },
        );
        //send notification to user_id
        const input: any = {
          title: notiTitle,
          type: reelsData.category_slug,
          requestId: reelsData.request_id,
          categorySlug: reelsData.category_slug,
          requestUserId: reelsData.user_id,
          message: notiMsg,
          userId: reelsData.user_id,
        };
        this.commonService.notification(input);
        //Add admin log
        const logData = {
          action: 'verify',
          entity_id: verifyTestimonialDto.id,
          request_id: reelsData.request_id,
          entity_name: 'Testimonials',
          description: `Testimonial video has been ${status} successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message:
            verifyTestimonialDto.status === 'approve'
              ? mConfig.Testimonial_approved
              : mConfig.Testimonial_rejected,
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

  // Api for list testimonial video for Admin
  public async testimonialList(
    type,
    param,
    res: any,
  ): Promise<RequestDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      let match;
      if (type === 'admin') {
        match = { video_type: 'testimonial' };
      } else {
        match = {
          video_type: 'testimonial',
          status: 'approve',
        };
      }

      const lookup = {
        $lookup: {
          from: 'requests', // collection name in db
          localField: 'request_id',
          foreignField: '_id',
          as: 'causeData',
        },
      };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        if (!_.isUndefined(filter._id) && filter._id) {
          const query = await this.commonService.filter(
            'objectId',
            filter._id,
            '_id',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.user_name) && filter.user_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.user_name,
            'causeData.uname',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.category_name) && filter.category_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.category_name,
            'causeData.category_name',
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
            'causeData.form_data.title_of_fundraiser',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.video) && filter.video) {
          const query = await this.commonService.filter(
            'contains',
            filter.video,
            'name',
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

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            '_id',
            'causeData.uname',
            'causeData.category_name',
            'causeData.form_data.title_of_fundraiser',
            'name',
            'status',
            'createdAt',
          ];
          query = await this.commonService.getGlobalFilter(
            fields,
            filter.search,
          );
        }

        if (!_.isEmpty(filter.search) && !_.isEmpty(query)) {
          match['$or'] = query;
        }
        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      const sortData = {
        _id: '_id',
        user_name: 'causeData.uname',
        category_name: 'causeData.category_name',
        title_of_fundraiser: 'causeData.form_data.title_of_fundraiser',
        video: 'name',
        status: 'status',
        createdAt: 'createdAt',
      };

      const total = await this.requestReelsModel
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
        sortData,
        param.sort_type,
        param.sort,
      );

      const data = await this.requestReelsModel.aggregate([
        lookup,
        { $unwind: '$causeData' },
        { $match: match },
        { $sort: sort },
        {
          $project: {
            _id: 1,
            user_name: '$causeData.uname',
            category_name: '$causeData.category_name',
            title_of_fundraiser: '$causeData.form_data.title_of_fundraiser',
            video: {
              $concat: [authConfig.imageUrl, 'testimonial-video/', '$name'],
            },
            user_image: {
              $ifNull: [
                {
                  $concat: [
                    authConfig.imageUrl,
                    'user/',
                    '$causeData.user_image',
                  ],
                },
                null,
              ],
            },
            status: 1,
            createdAt: 1,
          },
        },
        { $skip: start_from },
        { $limit: per_page },
      ]);

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
        'src/controller/request/volunteer.service.ts-testimonialList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async testimonial(param, res: any): Promise<RequestDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {
        video_type: 'testimonial',
        status: 'approve',
      };

      const sortData = {
        _id: '_id',
        name: 'name',
        slug: 'slug',
        value: 'value',
        group_name: 'group_name',
        createdAt: 'createdAt',
      };

      const lookup = {
        $lookup: {
          from: 'user',
          let: { id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$id'] },
                    { $ne: ['$is_deleted', true] },
                  ],
                },
              },
            },
          ],
          as: 'user_data',
        },
      };

      const total = await this.requestReelsModel
        .aggregate([
          { $match: match },

          {
            $group: {
              _id: '$user_id',
              storyData: { $push: '$$ROOT' },
            },
          },
          lookup,
          {
            $unwind: {
              path: '$user_data',
              preserveNullAndEmptyArrays: false,
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
        param.page,
        param.per_page,
        total_record,
        sortData,
        param.sort_type,
        param.sort,
      );
      const result = await this.requestReelsModel.aggregate(
        [
          { $match: match },

          {
            $group: {
              _id: '$user_id',
              storyData: { $push: '$$ROOT' },
            },
          },
          lookup,
          {
            $unwind: {
              path: '$user_data',
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $project: {
              user_id: '$user_data._id',
              user_image: {
                $concat: [authConfig.imageUrl, 'user/', '$user_data.image'],
              },
              user_name: {
                $concat: ['$user_data.first_name', ' ', '$user_data.last_name'],
              },
              stories: {
                $map: {
                  input: '$storyData',
                  as: 'story_data',
                  in: {
                    story_id: '$$story_data._id',
                    story_video: {
                      $concat: [
                        authConfig.imageUrl,
                        'testimonial-video/',
                        '$$story_data.name',
                      ],
                    },
                    type: 'video',
                    upload_time: '$$story_data.updatedAt',
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
        'src/controller/setting/setting.service.ts-testimonial',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async transferRequestFund(requestData) {
    try {
      const fixedAmount = Number(requestData.total_donation.toFixed(10));

      if (fixedAmount > 0) {
        const userData: any = await this.userModel
          .findById(requestData.user_id)
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
        const uname = userData.display_name
          ? userData.display_name
          : userData.first_name + ' ' + userData.last_name;

        const stripeId = await this.stripeService.stripeUserId(userData);
        const countryData = requestData.country_data;

        const insertData: any = {
          request_id: requestData._id,
          amount: fixedAmount,
          is_contribute_anonymously: false,
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
          transaction_type: 'donation',
          saayam_community: true,
          category_slug: requestData.category_slug,
          converted_amt: fixedAmount,
          converted_total_amt: fixedAmount,
          currency_code: requestData?.country_data?.currency_code,
        };

        const usdAmount = await this.commonService.getExchangeRate(
          requestData?.country_data?.currency_code,
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
      return true;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/fund/fund.service.ts-transferRequestFund',
      );
    }
  }

  // Api for assign volunteer admin
  public async assignVolunteerForFundraiser(id, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', id);
      const causeRequest = await this.requestModel
        .findOne({
          _id: ObjectID(id),
          status: 'pending',
          category_slug: { $in: ['health', 'education', 'fundraiser'] },
        })
        .select({ _id: 1, country_data: 1 })
        .lean();
      if (!causeRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const result = await this.commonService.getCommonSetting(
          causeRequest.country_data.country,
        );
        let maxRadiusKm = 50;
        if (!_.isEmpty(result) && !_.isEmpty(result.form_data)) {
          const formData = result.form_data;
          maxRadiusKm = formData.max_radius_in_kilometer;
        }

        const addQueueData: any = {
          request_id: causeRequest._id,
          users: [],
          max_radius_km: maxRadiusKm,
          type: 'fundraiser_request',
        };

        await this.queueModel.updateOne(
          { request_id: causeRequest._id },
          addQueueData,
          {
            upsert: true,
          },
        );

        await this.requestModel
          .findByIdAndUpdate(
            { _id: ObjectID(id) },
            { status: 'waiting_for_volunteer' },
          )
          .select({ _id: 1 })
          .lean();

        return res.json({
          success: true,
          message: mConfig.request_send_to_volunteer,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/volunteer.service.ts-assignVolunteerForFundraiser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for fundraiser request volunteer accept
  public async volunteerAccept(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const userDetail = this.request.user;

      const reqData: any = await this.requestModel
        .findById({ _id: id })
        .select({
          _id: 1,
          volunteer_id: 1,
          reference_id: 1,
          user_id: 1,
          category_slug: 1,
          category_name: 1,
        })
        .lean();

      if (!reqData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const updateData = {
          volunteer_id: userDetail._id,
          volunteer_accept_time: new Date(),
          status: 'volunteer_accept',
        };
        await this.requestModel
          .findByIdAndUpdate({ _id: ObjectID(id) }, updateData, {
            new: true,
          })
          .select({
            _id: 1,
          })
          .lean();

        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_req_accept_by_volunteer,
          {
            '{{cause}}': reqData.category_name,
          },
        );
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_req_accept_by_volunteer,
          {
            '{{cause}}': reqData.category_name,
            '{{refId}}': reqData.reference_id,
            '{{uname}}': userDetail.first_name + '' + userDetail.last_name,
          },
        );

        const input: any = {
          title: notiTitle,
          type: 'volunteer_accept',
          requestId: reqData._id,
          categorySlug: reqData.category_slug,
          message: notiMsg,
          userId: reqData.user_id,
        };
        await this.commonService.notification(input);

        const notiTitle2 = await this.commonService.changeString(
          mConfig.noti_title_req_assign_to_volunteer,
          {
            '{{cause}}': reqData.category_name,
          },
        );
        const notiMsg2 = await this.commonService.changeString(
          mConfig.noti_msg_req_assign_to_another_volunteer,
          {
            '{{cause}}': reqData.category_name,
            '{{refId}}': reqData.reference_id,
          },
        );

        const finalVolunteers = reqData.volunteer_id.map((x) => x.toString());
        const volunteersIds = finalVolunteers.filter(
          (item) => item !== userDetail._id.toString(),
        );

        const input1: any = {
          title: notiTitle2,
          type: 'volunteer_accept',
          requestId: reqData._id,
          categorySlug: reqData.category_slug,
          message: notiMsg2,
        };

        this.commonService.sendAllNotification(volunteersIds, input1);

        const notiMsg3 = await this.commonService.changeString(
          mConfig.noti_msg_admin_req_accept_by_volunteer,
          {
            '{{cause}}': reqData.category_name,
            '{{refId}}': reqData.reference_id,
            '{{uname}}': userDetail.first_name + '' + userDetail.last_name,
          },
        );
        //send notification to admin
        const input2: any = {
          title: notiTitle,
          type: 'volunteer_accept',
          requestId: reqData._id,
          categorySlug: reqData.category_slug,
          message: notiMsg3,
        };
        this.commonService.sendAdminNotification(input2);

        return res.send({
          success: true,
          message: mConfig.fundraiser_request_assign_to_you,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/request/volunteer.service.ts-volunteerAccept',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for verify Fundraiser request by volunteer
  public async verifyFundraiserRequest(
    fundraiserRequestVerifyDto: FundraiserRequestVerifyDto,
    res: any,
  ) {
    //need to ask about to make urgent request
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        fundraiserRequestVerifyDto,
      );
      let notiMsg;
      const userDetail = this.request.user;

      const reqData: any = await this.requestModel
        .findById({ _id: fundraiserRequestVerifyDto.request_id })
        .select({
          _id: 1,
          volunteer_id: 1,
          reference_id: 1,
          user_id: 1,
          category_slug: 1,
          category_name: 1,
          user_ngo_id: 1,
          country_data: 1,
          form_data: {
            urgent_help: 1,
          },
        })
        .lean();

      if (_.isEmpty(reqData)) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let requestUserIds = [];
        if (reqData.user_ngo_id) {
          requestUserIds = await this.commonService.getNgoUserIds(
            reqData.user_ngo_id,
          );
        } else {
          requestUserIds.push(reqData.user_id);
        }

        const updateData: any = {
          $set: {
            status: fundraiserRequestVerifyDto.status,
          },
        };
        let status;

        const changeData = {
          '{{category}}': reqData.category_name,
          '{{refId}}': reqData.reference_id,
          '{{uname}}': userDetail.first_name + ' ' + userDetail.last_name,
        };

        if (fundraiserRequestVerifyDto.status == 'approve') {
          status = 'approved';
          changeData['{{status}}'] = status;
          updateData['$set']['approve_time'] = new Date();
          if (reqData?.form_data?.urgent_help) {
            updateData['$set']['form_data.urgent_help_status'] = 'approve';
          }

          const noti_msg = await this.commonService.changeString(
            mConfig.noti_msg_request_arrive,
            changeData,
          );
          //send Notification to all user for new request arrive
          const allInput = {
            message: noti_msg,
            title: mConfig.noti_title_request_arrive,
            type: reqData.category_slug,
            categorySlug: reqData.category_slug,
            requestUserId: reqData.user_id,
            requestId: reqData._id,
          };

          this.commonService.sendAllUsersNotification(
            requestUserIds,
            allInput,
            reqData.country_data.country,
          );
          notiMsg = mConfig.noti_msg_request_approved;
        } else if (fundraiserRequestVerifyDto.status == 'reject') {
          status = fundraiserRequestVerifyDto.block_request
            ? 'blocked'
            : 'rejected';
          changeData['{{status}}'] = status;

          updateData['$set']['reject_time'] = new Date();
          updateData['$set']['block_request'] =
            fundraiserRequestVerifyDto.block_request;
          updateData['$set']['allow_for_reverify'] =
            fundraiserRequestVerifyDto.allow_for_reverify
              ? fundraiserRequestVerifyDto.allow_for_reverify
              : false;

          const noti_msg = await this.commonService.changeString(
            mConfig.noti_msg_request_rejected,
            changeData,
          );
          notiMsg = noti_msg;
        }
        await this.requestModel
          .findByIdAndUpdate({ _id: ObjectID(reqData._id) }, updateData, {
            new: true,
          })
          .select({
            _id: 1,
          })
          .lean();

        //create record in new table and also add note block in table
        const create = new this.fundraiserVerify(fundraiserRequestVerifyDto);
        await create.save();

        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_request_verify,
          changeData,
        );

        //send notification to user_id
        const input: any = {
          title: notiTitle,
          type: reqData.category_slug,
          requestId: reqData._id,
          categorySlug: reqData.category_slug,
          requestUserId: reqData.user_id,
          message: notiMsg,
        };
        this.commonService.sendAllNotification(requestUserIds, input);

        const notiTitle2 = await this.commonService.changeString(
          mConfig.noti_title_admin_request_verify,
          changeData,
        );

        const notiMsg2 = await this.commonService.changeString(
          mConfig.noti_msg_admin_request_verify,
          changeData,
        );

        //send notification to admin
        const input2: any = {
          title: notiTitle2,
          type: reqData.category_slug,
          requestId: reqData._id,
          categorySlug: reqData.category_slug,
          requestUserId: reqData.user_id,
          message: notiMsg2,
        };
        this.commonService.sendAdminNotification(input2);

        //Add Activity Log
        const logData = {
          action: 'verify',
          request_id: reqData._id,
          entity_name: `Verify ${reqData.category_name} Request`,
          description: `${reqData.category_name} request has been ${status} - ${reqData.reference_id}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message:
            fundraiserRequestVerifyDto.status === 'approve'
              ? mConfig.Request_approved
              : mConfig.Request_rejected,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/volunteer/volunteer.service.ts-verifyFundraiserRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
