import { Inject, Injectable } from '@nestjs/common';
import { _ } from 'lodash';
import { CreateDriveDto } from './dto/create-drive.dto';
import { UpdateDriveDto } from './dto/update-drive.dto';
import { QueueService } from '../../common/queue.service';
import { CommonService } from '../../common/common.service';
import { REQUEST } from '@nestjs/core';
import { Comment, CommentDocument } from '../request/entities/comments.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorlogService } from '../error-log/error-log.service';
import { Model } from 'mongoose';
import { Drive, DriveDocument } from './entities/drive.entity';
import { Post, PostDocument } from './entities/drive-post.entity';
import mConfig from '../../config/message.config.json';
import { RequestService } from '../request/request.service';
import { authConfig } from '../../config/auth.config';
import { GetReasonDto } from './dto/get-reason.dto';
import { RemoveAttendeeDto } from './dto/remove-attendee.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { LikeDislikeDto } from './dto/like-dislike.dto';
import { UserDriveEventDto } from './dto/user-drive-event.dto';
import { DeleteUserDriveEventDto } from './dto/delete-user-drive-event.dto';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../request/entities/cause-request.entity';
import { Fund, FundDocument } from '../fund/entities/fund.entity';
import {
  UserDriveEvent,
  UserDriveEventDocument,
} from './entities/user-drive-event.entity';
import { LogService } from 'src/common/log.service';
import { GetUserByMailDto } from './dto/get-user.dto';
import { AddAsVolunteer } from './dto/add-as-volunteer';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.entity';

const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class DriveService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly queueService: QueueService,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly requestService: RequestService,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Fund.name)
    private fundModel: Model<FundDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
    @InjectModel(Drive.name)
    private driveModel: Model<DriveDocument>,
    @InjectModel(Comment.name)
    private commentModel: Model<CommentDocument>,
    @InjectModel(UserDriveEvent.name)
    private userDriveEvent: Model<UserDriveEventDocument>,
    @InjectModel(Post.name)
    private postModel: Model<PostDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  // Api for create drive
  public async createDrive(
    createDriveDto: CreateDriveDto,
    res: any,
  ): Promise<Drive> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        createDriveDto,
      );

      let data = JSON.parse(createDriveDto.data);
      const currentDate = new Date();
      const userDetail = this.request.user;
      let countryData = userDetail.country_data;

      const formData: any = {
        form_data: {
          files: {},
          images: {},
        },
        user_id: ObjectID(userDetail._id),
        active_type: createDriveDto.active_type || null,
        createdAt: currentDate,
        updatedAt: currentDate,
        category_slug: 'saayam-drive',
        fundraiser_ids: createDriveDto.fundraiser_ids,
        fund_ids: createDriveDto.fund_ids,
      };
      formData.status =
        createDriveDto.form_type === 'draft' ? 'draft' : 'approve';
      if (createDriveDto.form_type != 'draft') {
        formData.approve_time = currentDate;
      }
      // If user create request as ngo role then add ngo id
      if (createDriveDto.active_type === 'ngo') {
        formData.user_ngo_id = ObjectID(userDetail.ngo_data._id);
        countryData = userDetail.ngo_data.country_data;
      }
      // If user create request as corporate role then add corporate id
      else if (createDriveDto.active_type === 'corporate') {
        formData.corporate_id = ObjectID(userDetail.corporate_data._id);
        countryData = userDetail.corporate_data.country_data;
      }
      formData.createdAt = currentDate;
      formData.updatedAt = currentDate;

      //Call checkValidation function for inputs validation
      const { data1, formData1, haveError } =
        await this.requestService.checkValidation(
          data,
          formData,
          null,
          createDriveDto.form_type,
          createDriveDto.active_type,
          'drive',
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
      if (createDriveDto.form_type !== 'draft') {
        // Call generateUniqueId function for generate short reference id for request
        const referenceId = await this.commonService.generateUniqueId(
          countryData.country_code,
        );
        formData1.reference_id = referenceId;
      }

      const defaultVolunteer = [
        {
          user_id: ObjectID(userDetail._id),
          role: 'organizer',
          invite_volunteer: true,
          manage_volunteer: true,
          manage_attendees: true,
          edit_drive: true,
          status: 'approve',
          join_time: currentDate,
        },
      ];

      formData1.admins = defaultVolunteer;
      if (createDriveDto.volunteers && !_.isEmpty(createDriveDto.volunteers)) {
        const volunteers = createDriveDto.volunteers;
        const newVolunteers = [];
        volunteers.map((data) => {
          if (data != userDetail._id.toString()) {
            newVolunteers.push({
              user_id: ObjectID(data),
              role: 'volunteer',
              invite_volunteer: false,
              manage_volunteer: false,
              manage_attendees: false,
              edit_drive: false,
              status: 'approve',
              join_time: currentDate,
            });
          }
        });
        formData1.volunteers = defaultVolunteer.concat(newVolunteers);
      }

      let result;
      if (
        createDriveDto.draft_id &&
        !_.isUndefined(createDriveDto.draft_id) &&
        !_.isEmpty(createDriveDto.draft_id)
      ) {
        result = await this.driveModel
          .findByIdAndUpdate(
            { _id: createDriveDto.draft_id },
            { $set: formData1 },
            { new: true },
          )
          .lean();
      } else {
        const createDrive = new this.driveModel(formData1);
        result = await createDrive.save();
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
                'drive/' + result._id,
              );
            });
          }
        }

        // Remove files from request folder
        if (
          !_.isEmpty(createDriveDto.removed_files) &&
          createDriveDto.removed_files
        ) {
          const removedFiles = createDriveDto.removed_files;
          await Promise.all(
            removedFiles.map(async (item: any) => {
              await this.commonService.unlinkFileFunction(
                'drive/' + result._id,
                item,
              );
            }),
          );
        }

        //send notification to admin
        if (result.status != 'draft') {
          const title = await this.commonService.changeString(
            mConfig.noti_title_drive_created,
            {
              '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
            },
          );
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_drive_created,
            {
              '{{uname}}': userDetail.display_name,
              '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
              '{{refId}}': result.reference_id,
            },
          );
          //send notification to admins
          const input: any = {
            title: title,
            type: 'drive',
            requestId: result._id,
            categorySlug: 'drive',
            requestUserId: result.user_id,
            message: msg,
          };
          this.commonService.sendAllNotification(
            createDriveDto.volunteers,
            input,
          );

          const admMsg = await this.commonService.changeString(
            mConfig.noti_msg_drive_create,
            {
              '{{uname}}': userDetail.display_name,
              '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
              '{{refId}}': result?.reference_id,
            },
          );

          const input2: any = {
            title: mConfig.noti_title_drive_create,
            type: 'drive',
            categorySlug: 'drive',
            requestId: result._id,
            message: admMsg,
          };

          this.commonService.sendAdminNotification(input2);
        }
        return res.json({
          message:
            createDriveDto.form_type === 'main'
              ? mConfig.drive_created
              : mConfig.Draft_saved,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update drive
  public async updateDrive(
    id: string,
    updateDriveDto: any,
    res: any,
  ): Promise<Drive> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateDriveDto,
      );

      let existDrive: any = await this.driveModel
        .aggregate([
          {
            $match: {
              _id: ObjectID(id),
              is_deleted: { $ne: true },
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
            $unwind: '$userData',
          },
          {
            $project: {
              _id: 1,
              status: 1,
              start_date_time: { $toDate: '$form_data.start_date_time' },
              volunteers: 1,
              'form_data.title_of_fundraiser': 1,
              user_id: 1,
              reference_id: 1,
              userData: {
                is_donor: '$userData.is_donor',
                is_volunteer: '$userData.is_volunteer',
                is_user: '$userData.is_user',
                time_zone: '$userData.time_zone',
                first_name: '$userData.first_name',
                last_name: '$userData.last_name',
                race: '$userData.race',
                religion: '$userData.religion',
              },
            },
          },
        ])
        .exec();

      if (_.isEmpty(existDrive) && _.isEmpty(existDrive[0])) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        existDrive = existDrive[0];
        if (
          existDrive.start_date_time &&
          existDrive.start_date_time <= new Date() &&
          (existDrive.status == 'ongoing' || existDrive.status == 'approve')
        ) {
          return res.json({
            message: mConfig.Drive_event_started,
            success: false,
          });
        }
        let data = JSON.parse(updateDriveDto.data);

        const userDetail = this.request.user;
        const formData: any = {
          form_data: {
            files: {},
            images: {},
          },
          updatedAt: new Date(),
          fundraiser_ids: updateDriveDto.fundraiser_ids
            ? updateDriveDto.fundraiser_ids
            : [],
          fund_ids: updateDriveDto.fund_ids ? updateDriveDto.fund_ids : [],
        };

        //Call checkValidation function for inputs validation
        const { data1, formData1, haveError } =
          await this.requestService.checkValidation(
            data,
            formData,
            null,
            'main',
            updateDriveDto.active_type,
            'drive',
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

        const existingVolunteers = existDrive.volunteers;
        const previousVolunteers = [];
        const defaultVolunteerIds = [];
        const allVolunteerIds = [];

        //if new then add and if not exist in new volunteer data then remove
        existingVolunteers.map((volunteer: any) => {
          const newData = volunteer;
          const volunteer_id: any = volunteer.user_id.toString();
          if (
            updateDriveDto?.volunteers.includes(volunteer_id) &&
            volunteer.role != 'attendee'
          ) {
            //if role is attendee then add to volunteer
            previousVolunteers.push(newData);
            allVolunteerIds.push(volunteer_id);
          }
          if (volunteer.role == 'attendee') {
            if (updateDriveDto?.volunteers.includes(volunteer_id)) {
              newData.role = 'volunteer';
            }
            previousVolunteers.push(newData);
            allVolunteerIds.push(volunteer_id);
          }

          defaultVolunteerIds.push(volunteer_id);
        });

        const newVolunteers = [];
        if (
          updateDriveDto.volunteers &&
          !_.isEmpty(updateDriveDto.volunteers)
        ) {
          const volunteers = updateDriveDto.volunteers;
          volunteers.map((data) => {
            if (!defaultVolunteerIds.includes(data)) {
              newVolunteers.push({
                user_id: ObjectID(data),
                role: 'volunteer',
                invite_volunteer: false,
                manage_volunteer: false,
                manage_attendees: false,
                edit_drive: false,
                status: 'approve',
                join_time: new Date(),
              });
              allVolunteerIds.push(data);
            }
          });
        }
        formData1.volunteers = previousVolunteers.concat(newVolunteers);

        if (existDrive.status == 'reject') {
          formData1.status = 'waiting_for_verify';
        }

        await this.driveModel.findByIdAndUpdate(id, { $set: formData1 }).lean();

        if (formData1.form_data && formData1.form_data.files) {
          const files = formData1.form_data.files;

          // All images are in "requestData.files" move upload images rom tmp to drive folder
          for (const key in files) {
            files[key].map(async (item) => {
              await this.commonService.uploadFileOnS3(item, 'drive/' + id);
            });
          }
        }

        // Remove files from drive folder
        if (
          !_.isEmpty(updateDriveDto.removed_files) &&
          updateDriveDto.removed_files
        ) {
          const removedFiles = updateDriveDto.removed_files;
          await Promise.all(
            removedFiles.map(async (item: any) => {
              await this.commonService.unlinkFileFunction('drive/' + id, item);
            }),
          );
        }

        if (!_.isEmpty(allVolunteerIds)) {
          const title = await this.commonService.changeString(
            mConfig.noti_title_drive_updated,
            {
              '{{drive_name}}': data?.form_data?.title_of_fundraiser
                ? data.form_data.title_of_fundraiser
                : existDrive.form_data.title_of_fundraiser,
            },
          );
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_drive_updated,
            {
              '{{uname}}': userDetail.display_name,
              '{{drive_name}}': data?.form_data?.title_of_fundraiser
                ? data.form_data.title_of_fundraiser
                : existDrive.form_data.title_of_fundraiser,
              '{{refId}}': existDrive.reference_id,
            },
          );
          //send notification to admins
          const input: any = {
            title: title,
            type: 'drive',
            requestId: existDrive._id,
            categorySlug: 'drive',
            requestUserId: existDrive.user_id,
            message: msg,
          };
          this.commonService.sendAllNotification(allVolunteerIds, input);
        }
        //send notification to admin
        let msg;
        if (existDrive.status == 'reject') {
          msg = await this.commonService.changeString(
            mConfig.noti_admin_msg_drive_reverify,
            {
              '{{drive_name}}': data?.form_data?.title_of_fundraiser || '',
              '{{refId}}': existDrive.reference_id,
            },
          );
        } else {
          msg = await this.commonService.changeString(
            mConfig.noti_admin_msg_drive_updated,
            {
              '{{drive_name}}': data?.form_data?.title_of_fundraiser || '',
              '{{refId}}': existDrive.reference_id,
            },
          );
        }

        const input: any = {
          title: mConfig.noti_admin_title_drive_updated,
          type: 'drive',
          categorySlug: 'drive',
          requestId: existDrive._id,
          message: msg,
        };
        this.commonService.sendAdminNotification(input);

        //send notification to volunteers
        return res.json({
          message: mConfig.drive_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list drive
  public async findAll(body, res) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', body);

      const userDetail = this.request.user;
      let geoNear = [];
      let myRequest = false;
      // add condition for block user (don't see request in list)
      let match: any = {
        status: { $in: ['approve', 'ongoing'] },
        is_deleted: { $ne: true },
        // $or: [
        //   {
        //     $expr: {
        //       $lt: [
        //         { $size: '$volunteers' },
        //         { $toInt: '$form_data.max_participants' },
        //       ],
        //     },
        //     $or: [
        //       {
        //         volunteers: {
        //           $elemMatch: {
        //             user_id: ObjectID(userDetail._id),
        //             status: { $ne: 'block' },
        //           },
        //         },
        //       },
        //       {
        //         'volunteers.user_id': { $ne: ObjectID(userDetail._id) },
        //       },
        //     ],
        //   },
        //   {
        //     $expr: {
        //       $gte: [
        //         { $size: '$volunteers' },
        //         { $toInt: '$form_data.max_participants' },
        //       ],
        //     },
        //     volunteers: {
        //       $elemMatch: {
        //         user_id: ObjectID(userDetail._id),
        //         status: { $ne: 'block' },
        //       },
        //     },
        //   },
        // ],

        // user_id: { $ne: ObjectID(userDetail._id) },
        $or: [
          {
            volunteers: {
              $elemMatch: {
                user_id: ObjectID(userDetail._id),
                status: { $ne: 'block' },
              },
            },
          },
          {
            'volunteers.user_id': { $ne: ObjectID(userDetail._id) },
          },
        ],
      };

      //Filter for my request screen data
      if (!_.isUndefined(body.my_request) && body.my_request) {
        myRequest = true;
        //user id and volunteer id match
        match = {
          $or: [
            { user_id: ObjectID(userDetail._id), status: { $ne: 'cancel' } },
            {
              volunteers: {
                $elemMatch: {
                  user_id: ObjectID(userDetail._id),
                  status: { $ne: 'block' },
                },
              },
              status: { $in: ['approve', 'ongoing'] },
            },
          ],
          is_deleted: { $ne: true },
        };
      }
      // if (body.just_for_you && body.just_for_you == 1) {
      //   delete match.user_id;
      //   // delete match['volunteers.user_id'];
      // }

      if (
        body.country &&
        !_.isUndefined(body.country) &&
        body.country != 'all'
      ) {
        if (Array.isArray(body.country)) {
          match['country_data.country_code'] = { $in: body.country };
        } else {
          match['country_data.country_code'] = body.country;
        }
      }

      if (
        !_.isEmpty(body) &&
        !_.isUndefined(body.corporate) &&
        body.corporate == 1 &&
        !_.isUndefined(userDetail._id)
      ) {
        match.active_type = 'corporate';
        match.corporate_id = ObjectID(userDetail?.corporate_data?._id);
      } else if (!_.isEmpty(body) && !_.isUndefined(body.ngo_id)) {
        match.active_type = 'ngo';
        match.user_ngo_id = ObjectID(body.ngo_id);
      } else {
        match.active_type = { $ne: 'corporate' };
      }

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
      }

      if (body.search && !_.isUndefined(body.search)) {
        match['form_data.title_of_fundraiser'] = new RegExp(body.search, 'i');
      }
      const sortData = {
        _id: '_id',
        createdAt: 'createdAt',
        'form_data.title_of_fundraiser': 'form_data.title_of_fundraiser',
      };

      const addFields = {
        manage_permission: {
          $filter: {
            input: '$volunteers',
            as: 'v',
            cond: {
              $eq: ['$$v.user_id', ObjectID(userDetail?._id)],
            },
          },
        },
        goingAttendees: {
          $filter: {
            input: '$volunteers',
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
            input: '$volunteers',
            as: 'v',
            cond: {
              $ne: ['$$v.role', 'attendee'],
            },
          },
        },
      };

      const total = await this.driveModel
        .aggregate([
          ...geoNear,
          { $match: match },
          { $addFields: addFields },
          {
            $unwind: {
              path: '$manage_permission',
              preserveNullAndEmptyArrays: true,
            },
          },
          { $count: 'count' },
        ])
        .exec();

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
        body.sort,
      );

      if (myRequest) {
        sort = {
          sort: 1,
          'form_data.end_date_time': 1,
          createdAt: 1,
        };
      } else {
        sort = {
          'form_data.start_date_time': 1,
        };
      }

      const sortList = {};
      if (
        (!_.isUndefined(body.sort_by) && body.sort_by == 'asce') ||
        body.sort_by == 'desc'
      ) {
        const sort_data = 'form_data.title_of_fundraiser';
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

      const result = await this.driveModel.aggregate(
        [
          ...geoNear,
          {
            $match: match,
          },
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
              localField: 'user_id',
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
            $unwind: {
              path: '$bookmarkData',
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
                        { $eq: ['$user_id', ObjectID(userDetail._id)] },
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
              _id: 1,
              createdAt: 1,
              status: 1,
              corporate_id: 1,
              active_type: 1,
              category_slug: 'saayam-drive',
              user_id: '$userData._id',
              is_bookmark: {
                $cond: {
                  if: { $gt: ['$bookmarkData', null] },
                  then: true,
                  else: false,
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
              image_url: {
                $concat: [
                  authConfig.imageUrl,
                  'drive/',
                  { $toString: '$_id' },
                  '/',
                ],
              },
              event_data: '$eventData',
              country_data: 1,
              reference_id: 1,
              'form_data.title_of_fundraiser': '$form_data.title_of_fundraiser',
              'form_data.drive_location': '$form_data.drive_location',
              'form_data.add_link': '$form_data.add_link',
              'form_data.link_available': '$form_data.link_available',
              'form_data.date_time': '$form_data.date_time',
              'form_data.start_date_time': '$form_data.start_date_time',
              'form_data.end_date_time': '$form_data.end_date_time',
              is_started: 1,
              max_participants: '$form_data.max_participants',
              location: 1,
              going_attendees_count: { $size: '$goingAttendees' },
              manage_permission: 1,
              'form_data.files.photos': {
                $map: {
                  input: '$form_data.files.photos',
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
              is_joined: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: [userDetail._id, null] },
                      { $ne: [userDetail._id, ''] },
                    ],
                  },
                  then: {
                    $in: [ObjectID(userDetail._id), '$volunteers.user_id'],
                  },
                  else: false,
                },
              },
              sort: {
                $cond: {
                  if: {
                    $in: ['$status', ['ongoing']],
                  },
                  then: 1,
                  else: {
                    $cond: {
                      if: {
                        $in: ['$status', ['approve']],
                      },
                      then: 2,
                      else: {
                        $cond: {
                          if: {
                            $in: ['$status', ['complete']],
                          },
                          then: 4,
                          else: 3,
                        },
                      },
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
        'src/controller/drive/drive.service.ts-findAll',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list ngo drive
  public async ngoDriveList(body, res) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', body);

      const userDetail = this.request.user;

      // add condition for block user (don't see request in list)
      let match: any = {
        status: { $in: ['approve', 'ongoing', 'complete'] },
        is_deleted: { $ne: true },
        active_type: 'ngo',
        user_ngo_id: ObjectID(body.ngo_id),
      };

      const addFields = {
        goingAttendees: {
          $filter: {
            input: '$volunteers',
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
            input: '$volunteers',
            as: 'v',
            cond: {
              $ne: ['$$v.role', 'attendee'],
            },
          },
        },
      };

      const total = await this.driveModel
        .aggregate([
          { $match: match },
          { $addFields: addFields },
          { $count: 'count' },
        ])
        .exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      if (body.home_screen && body.home_screen == 1) {
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
        null,
        body.sort_type,
        body.sort,
      );

      const result = await this.driveModel.aggregate(
        [
          {
            $match: match,
          },
          { $addFields: addFields },
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
              createdAt: 1,
              status: 1,
              corporate_id: 1,
              active_type: 1,
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
                  { $toString: '$_id' },
                  '/',
                ],
              },
              country_data: 1,
              reference_id: 1,
              'form_data.title_of_fundraiser': '$form_data.title_of_fundraiser',
              'form_data.drive_location': '$form_data.drive_location',
              'form_data.add_link': '$form_data.add_link',
              'form_data.link_available': '$form_data.link_available',
              'form_data.date_time': '$form_data.date_time',
              'form_data.start_date_time': '$form_data.start_date_time',
              'form_data.end_date_time': '$form_data.end_date_time',
              is_started: 1,
              max_participants: '$form_data.max_participants',
              location: 1,
              is_bookmark: {
                $cond: {
                  if: { $gt: ['$bookmarkData', null] },
                  then: true,
                  else: false,
                },
              },
              is_joined: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: [userDetail._id, null] },
                      { $ne: [userDetail._id, ''] },
                    ],
                  },
                  then: {
                    $in: [ObjectID(userDetail._id), '$volunteers.user_id'],
                  },
                  else: false,
                },
              },
              going_attendees_count: { $size: '$goingAttendees' },
              'form_data.files.photos': {
                $map: {
                  input: '$form_data.files.photos',
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
              sort: {
                $cond: {
                  if: {
                    $in: ['$status', ['ongoing']],
                  },
                  then: 0,
                  else: {
                    $cond: {
                      if: {
                        $in: ['$status', ['approve']],
                      },
                      then: 1,
                      else: 2,
                    },
                  },
                },
              },
            },
          },
          { $sort: { sort: 1, 'form_data.start_date_time': 1 } },
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
        'src/controller/drive/drive.service.ts-ngoDriveList',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get edit detail
  public async editDrive(id: string, res: any): Promise<Drive> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        id,
      );
      //find new form from categories table
      const project = {
        location: 1,
        country_code: 1,
        form_settings: 1,
        form_data: 1,
        status: 1,
        active_type: 1,
        user_id: 1,
        reference_id: 1,
        approve_time: 1,
        contacts: 1,
        start_date_time: { $toDate: '$form_data.start_date_time' },
        photos: {
          $map: {
            input: '$form_data.files.photos',
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
        video: {
          $map: {
            input: '$form_data.files.video',
            as: 'video',
            in: {
              $concat: [
                authConfig.imageUrl,
                'drive/',
                { $toString: '$_id' },
                '/',
                '$$video',
              ],
            },
          },
        },
        volunteers: 1,
        fund_id: 1,
        fundraiser_id: 1,
        linked_fund_fundraiser: {
          $cond: {
            if: { $ne: ['$fund_id', []] },
            then: true,
            else: {
              $cond: {
                if: { $ne: ['$fundraiser_id', []] },
                then: true,
                else: false,
              },
            },
          },
        },
      };
      const drive = await this.driveModel
        .aggregate([
          {
            $match: { _id: ObjectID(id), is_deleted: { $ne: true } },
          },
          {
            $addFields: {
              volunteers: {
                $filter: {
                  input: '$volunteers',
                  as: 'v',
                  cond: {
                    $ne: ['$$v.role', 'attendee'],
                  },
                },
              },
            },
          },
          {
            $lookup: {
              from: 'user', // collection name in db
              localField: 'volunteers.user_id',
              foreignField: '_id',
              as: 'user_data',
            },
          },
          {
            $addFields: {
              volunteers: {
                $map: {
                  input: '$user_data',
                  as: 'user',
                  in: {
                    _id: '$$user._id',
                    name: {
                      $concat: ['$$user.first_name', '$$user.last_name'],
                    },
                    image: {
                      $concat: [authConfig.imageUrl, 'user/', '$$user.image'],
                    },
                    phone: '$$user.phone',
                    phone_code: '$$user.phone_code',
                    email: '$$user.email',
                  },
                },
              },
              fund_id: {
                $ifNull: ['$fund_ids', []],
              },
              fundraiser_id: {
                $ifNull: ['$fundraiser_ids', []],
              },
            },
          },
          {
            $project: project,
          },
        ])
        .exec();

      if (drive && !_.isEmpty(drive)) {
        if (
          drive[0].start_date_time &&
          drive[0].start_date_time <= new Date() &&
          (drive[0].status == 'ongoing' || drive[0].status == 'approve')
        ) {
          return res.json({
            message: mConfig.Drive_event_started,
            success: false,
          });
        }

        return res.json({
          success: true,
          data: drive[0],
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
        'src/controller/drive/drive.service.ts-editDrive',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for drive details
  public async driveDetails(
    list_type: any,
    id: string,
    param,
    res: any,
  ): Promise<Drive> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', {
        id,
      });
      const userDetail = this.request.user;
      let addFields = {};
      let drive = {};
      const set = {
        contactsData: {
          $map: {
            input: '$limited_contact_users',
            in: {
              $mergeObjects: [
                '$$this',
                {
                  user: {
                    $arrayElemAt: [
                      '$contactsData',
                      {
                        $indexOfArray: ['$contactsData._id', '$$this.user_id'],
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      };
      const project: any = {
        _id: 1,
        country_code: 1,
        form_data: 1,
        corporate_id: 1,
        status: 1,
        active_type: 1,
        user_id: 1,
        reference_id: 1,
        approve_time: 1,
        contacts: 1,
        location: 1,
        photos: {
          $map: {
            input: '$form_data.files.photos',
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
        video: {
          $map: {
            input: '$form_data.files.video',
            as: 'video',
            in: {
              $concat: [
                authConfig.imageUrl,
                'drive/',
                { $toString: '$_id' },
                '/',
                '$$video',
              ],
            },
          },
        },
        image_url: {
          $concat: [authConfig.imageUrl, 'drive/', { $toString: '$_id' }, '/'],
        },
        createdAt: 1,
        reject_time: 1,
        reject_reason: 1,
        block_reason: 1,
        block_time: 1,
        cancelled_time: 1,
        cancelled_reason: 1,
        'user_data.first_name': 1,
        'user_data.last_name': 1,
        event_data: '$eventData',
        'user_data.image_url': authConfig.imageUrl + 'user/',
        'user_data.image': {
          $concat: [authConfig.imageUrl, 'user/', '$user_data.image'],
        },
        manage_permission: 1,
        blockVolunteers: {
          user_id: 1,
          role: 1,
        },
      };

      let match: any = {
        _id: ObjectID(id),
        is_deleted: { $ne: true },
      };

      if (list_type == 'app') {
        addFields = {
          manage_permission: {
            $filter: {
              input: '$volunteers',
              as: 'v',
              cond: {
                $eq: ['$$v.user_id', ObjectID(userDetail?._id)],
              },
            },
          },
          goingAttendees: {
            $filter: {
              input: '$volunteers',
              as: 'v',
              cond: {
                $and: [
                  { $eq: ['$$v.status', 'approve'] },
                  { $eq: ['$$v.role', 'attendee'] },
                ],
              },
            },
          },
          blockVolunteers: {
            $filter: {
              input: '$volunteers',
              as: 'v',
              cond: {
                $eq: ['$$v.status', 'block'],
              },
            },
          },
          contacts: {
            $filter: {
              input: '$volunteers',
              as: 'v',
              cond: {
                $and: [
                  { $eq: ['$$v.status', 'approve'] },
                  { $ne: ['$$v.role', 'attendee'] },
                ],
              },
            },
          },
        };
        project['is_joined'] = {
          $cond: {
            if: {
              $and: [
                { $ne: [userDetail._id, null] },
                { $ne: [userDetail._id, ''] },
                { $gt: ['$volunteers', null] },
              ],
            },
            then: {
              $in: [ObjectID(userDetail._id), '$volunteers.user_id'],
            },
            else: false,
          },
        };
        project['is_reported'] = {
          $cond: {
            if: {
              $and: [
                { $ne: [userDetail._id, null] },
                { $ne: [userDetail._id, ''] },
                { $gt: ['$report_drive', null] },
              ],
            },
            then: {
              $in: [ObjectID(userDetail._id), '$report_drive.user_id'],
            },
            else: false,
          },
        };
        project['attendeeData'] = {
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
        };
        project['contacts'] = {
          $map: {
            input: '$contactsData',
            as: 'volunteer',
            in: {
              _id: '$$volunteer.user._id',
              role: '$$volunteer.role',
              first_name: '$$volunteer.user.first_name',
              last_name: '$$volunteer.user.last_name',
              email: '$$volunteer.user.email',
              phone: '$$volunteer.user.phone',
              phone_code: '$$volunteer.user.phone_code',
              image: {
                $ifNull: [
                  {
                    $concat: [
                      authConfig.imageUrl,
                      'user/',
                      '$$volunteer.user.image',
                    ],
                  },
                  null,
                ],
              },
            },
          },
        };
        project['going_attendees_count'] = { $size: '$goingAttendees' };
        project['is_bookmark'] = {
          $cond: {
            if: { $gt: [{ $size: '$bookmarkData' }, 0] }, // Check if bookmarks array is not empty
            then: true, // Bookmarks exist
            else: false, // No bookmarks
          },
        };

        drive = await this.driveModel
          .aggregate([
            {
              $match: match,
            },
            { $addFields: addFields },
            {
              $unwind: {
                path: '$manage_permission',
                preserveNullAndEmptyArrays: true,
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
            { $unwind: '$user_data' },
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
                          { $eq: ['$user_id', ObjectID(userDetail._id)] },
                        ],
                      },
                    },
                  },
                ],
                as: 'eventData',
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
              $lookup: {
                from: 'user',
                let: { volunteers: '$contacts.user_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $in: ['$_id', '$$volunteers'],
                      },
                    },
                  },
                  { $limit: 3 },
                ],
                as: 'contactsData',
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
            {
              $addFields: {
                limited_contact_users: {
                  $filter: {
                    input: '$contacts',
                    as: 'd',
                    cond: {
                      $in: ['$$d.user_id', '$contactsData._id'],
                    },
                  },
                },
              },
            },
            { $set: set },
            {
              $project: project,
            },
          ])
          .exec();
      } else if (list_type == 'admin') {
        match = {
          _id: ObjectID(id),
        };
        drive = await this.driveModel
          .aggregate([
            {
              $match: match,
            },
            {
              $lookup: {
                from: 'user', // collection name in db
                localField: 'user_id',
                foreignField: '_id',
                as: 'user_data',
              },
            },
            { $unwind: '$user_data' },
            {
              $project: project,
            },
          ])
          .exec();
      }

      if (!_.isEmpty(drive) && !_.isEmpty(drive[0])) {
        const data = drive[0];
        data.category_slug = 'saayam-drive';
        return res.json({
          success: true,
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
        'src/controller/drive/drive.service.ts-driveDetails',
        param,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get drive list in admin
  public async adminDriveList(param, res: any): Promise<Drive[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      let match: any = {
        status: { $ne: 'draft' },
        is_deleted: { $ne: true },
      };
      let condition = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const user_type = [];

        // if (!_.isUndefined(filter.cancel) && filter.cancel == 1) {
        //   match = {
        //     is_deleted: true,
        //     status: { $ne: 'draft' },
        //   };
        // }
        if (!_.isUndefined(filter.reported) && filter.reported) {
          where.push({ report_drive: { $exists: true } });
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
          where.push({ active_type: user_type });
        }
        if (!_.isUndefined(filter.reference_id) && filter.reference_id) {
          const query = await this.commonService.filter(
            'contains',
            filter.reference_id,
            'reference_id',
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
        if (!_.isUndefined(filter.user_name) && filter.user_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.user_name,
            'user_name',
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
        if (!_.isUndefined(filter.country) && filter.country) {
          const query = await this.commonService.filter(
            'contains',
            filter.country,
            'country_data.country',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.status) && filter.status) {
          const filtr = JSON.parse(filter.status).trim().toLowerCase();
          if (filtr.toString() == 'approved') {
            where.push({ status: 'approve' });
          } else if (filtr.toString() == 'cancelled') {
            where.push({ status: 'cancel' });
          } else if (filtr.toString() == 'completed') {
            where.push({ status: 'complete' });
          } else {
            const query = await this.commonService.filter(
              'contains',
              filter.status,
              'status',
            );
            where.push(query);
          }
        }
        let dateFieldsToFilter = ['createdAt', 'updatedAt', 'approve_time'];
        for (let dateField of dateFieldsToFilter) {
          if (!_.isUndefined(filter[dateField]) && filter[dateField]) {
            let tempQry = await this.commonService.filter(
              'date',
              filter[dateField],
              dateField,
            );
            where.push(tempQry);
          }
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const str_fields = [
            'reference_id',
            'form_data.title_of_fundraiser',
            'user_name',
            'country',
            'createdAt',
            'approve_time',
            'updatedAt',
            'status',
          ];

          query = await this.commonService.getGlobalFilter(
            str_fields,
            filter.search,
          );
        }

        if (!_.isEmpty(where)) {
          condition['$and'] = where;
        }
        if (!_.isUndefined(filter.search) && !_.isEmpty(query)) {
          condition['$or'] = query;
        }
      }

      const sortData = {
        _id: '_id',
        reference_id: 'reference_id',
        title_of_fundraiser: 'form_data.title_of_fundraiser',
        user_name: 'user_name',
        country: 'country',
        createdAt: 'createdAt',
        approve_time: 'approve_time',
        updatedAt: 'updatedAt',
        status: 'status',
      };

      const total = await this.driveModel
        .aggregate([
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
            $addFields: {
              user_name: {
                $concat: ['$userData.first_name', ' ', '$userData.last_name'],
              },
            },
          },
          {
            $match: condition,
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

      const data = await this.driveModel
        .aggregate(
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
              $addFields: {
                user_name: {
                  $concat: ['$userData.first_name', ' ', '$userData.last_name'],
                },
              },
            },
            {
              $match: condition,
            },
            {
              $project: {
                _id: 1,
                approve_time: 1,
                createdAt: 1,
                updatedAt: 1,
                status: 1,
                user_id: '$userData._id',
                reference_id: 1,
                country_data: 1,
                country: '$country_data.country',
                user_name: 1,
                form_data: 1,
                active_type: 1,
                going_volunteers_count: {
                  $sum: {
                    $map: {
                      input: '$volunteers',
                      as: 'v',
                      in: {
                        $cond: [
                          {
                            $eq: ['$$v.status', 'approve'],
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
            { $sort: sort },
            { $skip: start_from },
            { $limit: per_page },
          ],
          { collation: authConfig.collation },
        )
        .exec();

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
        'src/controller/drive/drive.service.ts-adminDriveList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for Join Drive
  public async joinDrive(id: string, res: any): Promise<Drive> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const userDetail = this.request.user;

      let result: any = await this.driveModel.aggregate([
        {
          $match: {
            _id: ObjectID(id),
            is_deleted: { $ne: true },
          },
        },
        {
          $project: {
            _id: 1,
            'form_data.title_of_fundraiser': 1,
            user_id: 1,
            max_participants: '$form_data.max_participants',
            attendees: {
              $filter: {
                input: '$volunteers',
                as: 'v',
                cond: {
                  $and: [{ $eq: ['$$v.role', 'attendee'] }],
                },
              },
            },
            reference_id: 1,
            status: 1,
            existVolunteersIds: {
              $map: {
                input: '$volunteers',
                as: 'volunteer',
                in: { $toString: '$$volunteer.user_id' },
              },
            },
          },
        },
      ]);

      if (_.isEmpty(result) && _.isEmpty(result[0])) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        result = result[0];
        if (result.status != 'approve' && result.status != 'ongoing') {
          return res.json({
            success: false,
            message: mConfig.Not_allow_to_join_drive,
          });
        } else if (
          !_.isEmpty(result.max_participants) &&
          !_.isEmpty(result.attendees) &&
          Number(result.max_participants) <= result.attendees.length
        ) {
          return res.json({
            success: false,
            message: mConfig.Drive_max_participants_limit,
          });
        } else if (
          !_.isEmpty(result.existVolunteersIds) &&
          result.existVolunteersIds.includes(userDetail._id.toString())
        ) {
          return res.json({
            success: false,
            message: mConfig.Already_joined_drive,
          });
        }

        const updateData = {
          $push: {
            volunteers: {
              user_id: ObjectID(userDetail._id),
              role: 'attendee',
              invite_volunteer: false,
              manage_volunteer: false,
              manage_attendees: false,
              edit_drive: false,
              status: 'approve',
              join_time: new Date(),
            },
          },
        };

        await this.driveModel
          .findOneAndUpdate(
            {
              _id: ObjectID(id),
              is_deleted: { $ne: true },
            },
            updateData,
          )
          .select({ _id: 1 })
          .lean();

        //send notification to admin and user

        const msg = await this.commonService.changeString(
          mConfig.noti_msg_join_drive,
          {
            '{{uname}}': userDetail.display_name,
            '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
            '{{refId}}': result.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_join_drive,
          type: 'join-drive',
          categorySlug: 'drive',
          requestId: result._id,
          message: msg,
          userId: result.user_id,
        };

        await this.commonService.notification(input);
        this.commonService.sendAdminNotification(input);

        return res.send({
          success: true,
          message: mConfig.drive_join,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-joinDrive',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for leave drive
  public async leaveDrive(id: string, res: any): Promise<Drive> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const userDetail = this.request.user;
      const result: any = await this.driveModel
        .findOneAndUpdate(
          {
            _id: ObjectID(id),
            is_deleted: { $ne: true },
          },
          { $pull: { volunteers: { user_id: ObjectID(userDetail._id) } } },
          { new: true },
        )
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          user_id: 1,
          reference_id: 1,
        })
        .lean();

      if (!result) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        //send notification to admin and user

        const msg = await this.commonService.changeString(
          mConfig.noti_msg_drive_leave,
          {
            '{{uname}}': userDetail.display_name,
            '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
            '{{refId}}': result.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_drive_leave,
          type: 'leave-drive',
          categorySlug: 'drive',
          requestId: result._id,
          message: msg,
          userId: result.user_id,
        };

        await this.commonService.notification(input);
        this.commonService.sendAdminNotification(input);

        return res.send({
          success: true,
          message: mConfig.drive_leave,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-leaveDrive',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for remove attendee from volunteer
  public async removeAttendee(
    removeAttendeeDto: RemoveAttendeeDto,
    res: any,
  ): Promise<Drive> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        removeAttendeeDto,
      );
      const userDetail = this.request.user;
      const result: any = await this.driveModel
        .findOneAndUpdate(
          {
            _id: ObjectID(removeAttendeeDto.id),
            is_deleted: { $ne: true },
          },
          {
            $pull: {
              volunteers: { user_id: ObjectID(removeAttendeeDto.user_id) },
            },
          },
          { new: true },
        )
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          user_id: 1,
          reference_id: 1,
        })
        .lean();

      if (!result) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        //send notification to admin and user

        const msg = await this.commonService.changeString(
          mConfig.noti_msg_remove_attendee,
          {
            '{{uname}}': userDetail.display_name,
            '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
            '{{refId}}': result.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_remove_attendee,
          type: 'remove-attendee',
          categorySlug: 'drive',
          requestId: result._id,
          message: msg,
          userId: removeAttendeeDto.user_id,
          requestUserId: result.user_id,
        };

        await this.commonService.notification(input);
        this.commonService.sendAdminNotification(input);

        return res.send({
          success: true,
          message: mConfig.remove_attendee,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-removeAttendee',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for cancel drive
  public async cancelDrive(cancelDriveDto: GetReasonDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        cancelDriveDto,
      );
      const userDetail = this.request.user;
      const result: any = await this.driveModel
        .findOneAndUpdate(
          { _id: cancelDriveDto.id, is_deleted: { $ne: true } },
          {
            status: 'cancel',
            cancelled_reason: cancelDriveDto.reason,
            cancelled_time: new Date(),
          },
          { new: true },
        )
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          volunteers: 1,
          user_id: 1,
          reference_id: 1,
        })
        .lean();
      if (!result) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        //send notification to admin and volunteers

        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_cancel_drive,
          {
            '{{uname}}': userDetail.display_name,
            '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
            '{{refId}}': result.reference_id,
          },
        );
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          {
            '{{reason}}': cancelDriveDto.reason,
          },
        );
        const input = {
          title: notiTitle,
          type: 'cancel-drive',
          categorySlug: 'drive',
          requestId: result._id,
          message: notiMsg,
          requestUserId: result.user_id,
        };

        const allVolunteerIds = [];
        result.volunteers.map((volunteer) => {
          const volunteer_id = volunteer.user_id.toString();
          if (volunteer_id != userDetail._id.toString()) {
            allVolunteerIds.push(volunteer_id);
          }
        });

        await this.commonService.sendAllNotification(allVolunteerIds, input);
        this.commonService.sendAdminNotification(input);
        return res.send({
          success: true,
          message: mConfig.drive_cancelled,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-cancelDrive',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for report drive
  public async reportDrive(reportDriveDto: GetReasonDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        reportDriveDto,
      );
      const userDetail = this.request.user;
      const updateData = {
        user_id: userDetail._id,
        user_name: userDetail.display_name,
        description: reportDriveDto.reason,
        added_time: new Date(),
      };
      const result: any = await this.driveModel
        .findOneAndUpdate(
          { _id: reportDriveDto.id, is_deleted: { $ne: true } },
          { $addToSet: { report_drive: updateData } },
          { new: true },
        )
        .select({ _id: 1, 'form_data.title_of_fundraiser': 1, reference_id: 1 })
        .lean();
      if (!result) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        //send notification to admin
        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_report_drive,
          {
            '{{uname}}': userDetail.display_name,
            '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
            '{{refId}}': result.reference_id,
          },
        );
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          {
            '{{reason}}': reportDriveDto.reason,
          },
        );

        const input = {
          type: 'report-drive',
          categorySlug: 'drive',
          requestId: result._id,
          title: notiTitle,
          message: notiMsg,
        };
        this.commonService.sendAdminNotification(input);

        return res.send({
          success: true,
          message: mConfig.Reported_successfully,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-reportDrive',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for reported user list of drive for admin
  public async reportDriveUserList(id, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {
        is_deleted: { $ne: true },
        report_drive: { $exists: true },
      };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        if (!_.isUndefined(filter.user_name) && filter.user_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.user_name,
            'report_drive.user_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.description) && filter.description) {
          const query = await this.commonService.filter(
            'contains',
            filter.description,
            'report_drive.description',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.added_time) && filter.added_time) {
          const query = await this.commonService.filter(
            'contains',
            filter.added_time,
            'report_drive.added_time',
          );
          where.push(query);
        }

        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      const sortData = {
        _id: '_id',
        description: 'report_drive.description',
        user_name: 'report_drive.user_name',
        added_time: 'report_drive.added_time',
      };

      const total = await this.driveModel
        .aggregate([
          {
            $match: { _id: ObjectID(id) },
          },
          {
            $unwind: '$report_drive',
          },
          {
            $match: match,
          },
          {
            $lookup: {
              from: 'user', // collection name in db
              localField: 'report_drive.user_id',
              foreignField: '_id',
              as: 'user_data',
            },
          },
          {
            $unwind: '$user_data',
          },
          {
            $match: match,
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

      const data = await this.driveModel
        .aggregate([
          {
            $match: { _id: ObjectID(id) },
          },
          {
            $unwind: '$report_drive',
          },
          {
            $match: match,
          },
          {
            $lookup: {
              from: 'user', // collection name in db
              localField: 'report_drive.user_id',
              foreignField: '_id',
              as: 'user_data',
            },
          },
          {
            $unwind: '$user_data',
          },
          {
            $match: match,
          },
          {
            $project: {
              _id: 1,
              user_id: '$report_drive.user_id',
              user_name: '$user_data.display_name',
              description: '$report_drive.description',
              added_time: '$report_drive.added_time',
              email: '$user_data.email',
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
        'src/controller/drive/drive.service.ts-reportDriveUserList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for block drive
  public async blockDrive(blockDriveDto: GetReasonDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        blockDriveDto,
      );
      const updateData: any = {
        status: 'blocked',
        block_reason: blockDriveDto.reason,
        block_time: new Date(),
      };
      const result: any = await this.driveModel
        .findOneAndUpdate(
          { _id: ObjectID(blockDriveDto.id), is_deleted: { $ne: true } },
          updateData,
          { new: true },
        )
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          reference_id: 1,
          volunteers: 1,
          user_id: 1,
        })
        .lean();

      if (!result) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        //send notification to user and volunteers
        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_block_drive,
          {
            '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
            '{{status}}': 'blocked',
          },
        );

        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': blockDriveDto.reason },
        );
        const input: any = {
          title: notiTitle,
          type: 'block-drive',
          requestId: result._id,
          categorySlug: 'drive',
          message: notiMsg,
          requestUserId: result.user_id,
        };

        const allVolunteerIds = [];
        result.volunteers.map((volunteer) => {
          allVolunteerIds.push(volunteer.user_id);
        });

        this.commonService.sendAllNotification(allVolunteerIds, input);

        //Add Activity Log
        const logData = {
          action: 'block',
          entity_id: result._id,
          entity_name: 'Drive',
          description: `Drive has been blocked - ${result.reference_id}.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Drive_block,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-blockDrive',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for unblock drive
  public async unblockDrive(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const updateData: any = {
        status: 'approve',
        $unset: {
          block_reason: 1,
          block_time: 1,
        },
      };
      const result: any = await this.driveModel
        .findOneAndUpdate(
          {
            _id: ObjectID(id),
            is_deleted: { $ne: true },
            status: 'blocked',
          },
          updateData,
          { new: true },
        )
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          reference_id: 1,
          volunteers: 1,
          user_id: 1,
        })
        .lean();

      if (!result) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        //send notification to user and volunteers
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_block_drive,
          {
            '{{drive_name}}': result?.form_data?.title_of_fundraiser || '',
            '{{status}}': 'unblocked',
            '{{refId}}': result.reference_id,
          },
        );

        const input: any = {
          title: mConfig.noti_title_unblock_drive,
          type: 'unblock-drive',
          requestId: result._id,
          categorySlug: 'drive',
          message: notiMsg,
          requestUserId: result.user_id,
        };

        const allVolunteerIds = [];
        result.volunteers.map((volunteer) => {
          allVolunteerIds.push(volunteer.user_id);
        });

        this.commonService.sendAllNotification(allVolunteerIds, input);

        //Add Activity Log
        const logData = {
          action: 'unblock',
          entity_id: result._id,
          entity_name: 'Drive',
          description: `Drive has been unblocked - ${result.reference_id}.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Drive_unblock,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-unblockDrive',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list volunteer(attendes/blocked)
  public async volunteerList(type, id, param, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match: any = {
        _id: ObjectID(id),
        is_deleted: { $ne: true },
      };
      let query: any = {
        'volunteers.status': 'approve',
      };
      if (type == 'app') {
        query = {
          'volunteers.status': 'approve',
          'volunteers.role': 'attendee',
        };
      }
      const search = {};

      if (param.blocked && param.blocked == 1) {
        query = {
          'volunteers.status': 'block',
        };
      }
      if (param.volunteers && param.volunteers == 1) {
        query['volunteers.role'] = 'volunteer';
      }
      if (param.search && !_.isUndefined(param.search)) {
        search['$or'] = [
          { user_name: new RegExp(param.search, 'i') },
          { 'user_data.email': new RegExp(param.search, 'i') },
          { 'user_data.phone': new RegExp(param.search, 'i') },
        ];
      }

      const addFields = {
        $addFields: {
          user_name: {
            $concat: ['$user_data.first_name', ' ', '$user_data.last_name'],
          },
        },
      };

      const lookup = {
        $lookup: {
          from: 'user', // collection name in db
          localField: 'volunteers.user_id',
          foreignField: '_id',
          as: 'user_data',
        },
      };

      const total = await this.driveModel
        .aggregate([
          {
            $match: match,
          },
          {
            $unwind: '$volunteers',
          },
          {
            $match: query,
          },
          lookup,
          {
            $unwind: '$user_data',
          },
          addFields,
          {
            $match: search,
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
      const volunteersData = await this.driveModel
        .aggregate([
          {
            $match: match,
          },
          {
            $unwind: '$volunteers',
          },
          {
            $match: query,
          },
          lookup,
          {
            $unwind: '$user_data',
          },
          addFields,
          {
            $match: search,
          },
          {
            $project: {
              _id: 1,
              user_id: '$user_data._id',
              display_name: '$user_data.display_name',
              role: '$volunteers.role',
              join_time: '$volunteers.join_time',
              user_name: 1,
              email: '$user_data.email',
              phone: '$user_data.phone',
              phone_code: '$user_data.phone_code',
              phone_country_short_name: '$user_data.phone_country_short_name',
              user_image: {
                $concat: [authConfig.imageUrl, 'user/', '$user_data.image'],
              },
              invite_volunteer: '$volunteers.invite_volunteer',
              manage_volunteer: '$volunteers.manage_volunteer',
              manage_attendees: '$volunteers.manage_attendees',
              edit_drive: '$volunteers.edit_drive',
              sort: {
                $cond: {
                  if: {
                    $eq: ['$volunteers.role', 'organizer'],
                  },
                  then: 0,
                  else: {
                    $cond: {
                      if: {
                        $eq: ['$volunteers.role', 'volunteer'],
                      },
                      then: 1,
                      else: 2,
                    },
                  },
                },
              },
            },
          },
          { $sort: { sort: 1 } },
          { $skip: start_from },
          { $limit: per_page },
        ])
        .exec();

      return res.json({
        data: volunteersData,
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
        'src/controller/drive/drive.service.ts-volunteerList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete drive
  public async deleteDrive(id, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const result = await this.driveModel
        .findByIdAndUpdate(id, { is_deleted: true })
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({ success: false, message: mConfig.No_data_found });
      }
      return res.json({ success: true, message: mConfig.Drive_deleted });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-deleteDrive',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for create post in drive
  public async createPost(createPostDto: CreatePostDto, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createPostDto,
      );
      const findDrive: any = await this.driveModel
        .findOne({
          _id: ObjectID(createPostDto.drive_id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          user_id: 1,
          reference_id: 1,
          drive_name: '$form_data.title_of_fundraiser',
        })
        .lean();
      if (!findDrive) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const userData = this.request.user;
        createPostDto.user_id = userData._id;
        const createPost = new this.postModel(createPostDto);
        const result = await createPost.save();

        if (createPostDto.photos && !_.isEmpty(createPostDto.photos)) {
          const files: any = createPostDto.photos;

          // All images are in "requestData.files" move upload images rom tmp to request folder
          files.map(async (item) => {
            await this.commonService.uploadFileOnS3(
              item,
              'drive/' + findDrive._id + '/post/' + result._id,
            );
          });
        }

        //send notification to drive creator
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_drive_post,
          {
            '{{drive_name}}': findDrive.drive_name,
            '{{refId}}': findDrive.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_drive_post,
          type: 'drive',
          requestId: findDrive._id,
          categorySlug: 'drive',
          message: notiMsg,
          userId: findDrive.user_id,
          requestUserId: findDrive.user_id,
        };

        this.commonService.notification(input, true);

        return res.json({ success: true, message: mConfig.Post_created });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-createPost',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for drive feed list
  public async feedList(id, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const userData = this.request.user;
      const match = {
        drive_id: ObjectID(id),
        is_deleted: { $ne: true },
        is_blocked: { $ne: true },
      };
      const findDrive = await this.driveModel
        .findOne({ _id: ObjectID(id), is_deleted: { $ne: true } })
        .select({ _id: 1 })
        .lean();
      if (!findDrive) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const sortData = {
          _id: '_id',
          createdAt: 'createdAt',
        };

        const total = await this.postModel
          .aggregate([
            {
              $match: match,
            },
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

        const data = await this.postModel
          .aggregate([
            {
              $match: match,
            },
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
            {
              $lookup: {
                from: 'comments',
                let: { id: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$parent_id', '0'] },
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
                user_name: {
                  $concat: [
                    '$user_data.first_name',
                    ' ',
                    '$user_data.last_name',
                  ],
                },
                photos: {
                  $map: {
                    input: '$photos',
                    as: 'photo',
                    in: {
                      $concat: [
                        authConfig.imageUrl,
                        'drive/',
                        { $toString: '$drive_id' },
                        '/post/',
                        { $toString: '$_id' },
                        '/',
                        '$$photo',
                      ],
                    },
                  },
                },
                drive_id: 1,
                description: 1,
                likes_count: {
                  $sum: {
                    $map: {
                      input: '$comments',
                      as: 'comment',
                      in: {
                        $cond: [
                          { $eq: ['$$comment.type', 'drive-like'] },
                          1,
                          0,
                        ],
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
                              { $eq: ['$$comment.type', 'drive-like'] },
                              {
                                $eq: [
                                  '$$comment.user_id',
                                  ObjectID(userData._id),
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
                        $cond: [{ $eq: ['$$comment.type', 'drive'] }, 1, 0],
                      },
                    },
                  },
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
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-feedList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for post like unlike
  public async likeUnlike(likeDislikeDto: LikeDislikeDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        likeDislikeDto,
      );
      const userData = this.request.user;
      const postData: any = await this.postModel
        .findOne({
          _id: ObjectID(likeDislikeDto.id),
          is_deleted: { $ne: true },
          is_blocked: { $ne: true },
        })
        .select({ _id: 1 })
        .lean();
      if (!postData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const dtl: any = {
          post_id: likeDislikeDto.id,
          user_id: userData._id,
        };
        let msg = '';
        if (likeDislikeDto.type == 'like') {
          dtl.type = 'drive-like';

          const addComment = new this.commentModel(dtl);
          await addComment.save();
          msg = mConfig.Post_like;
        } else if (likeDislikeDto.type == 'dislike') {
          await this.commentModel.deleteOne(dtl).lean();
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
        'src/controller/drive/drive.service.ts-likeUnlike',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for post likes user list
  public async likeList(id, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {
        post_id: ObjectID(id),
        type: 'drive-like',
      };

      const sortData = {
        _id: '_id',
        createdAt: 'createdAt',
      };

      const total = await this.commentModel
        .aggregate([
          {
            $match: match,
          },
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

      const data = await this.commentModel
        .aggregate([
          {
            $match: match,
          },
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
          {
            $project: {
              _id: 1,
              user_id: 1,
              post_id: 1,
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
        'src/controller/drive/drive.service.ts-likeList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for report post
  public async reportPost(reportDriveDto: GetReasonDto, res: any) {
    try {
      const userDetail = this.request.user;
      const updateData = {
        user_id: userDetail._id,
        user_name: userDetail.display_name,
        description: reportDriveDto.reason,
        added_time: new Date(),
      };
      const result: any = await this.postModel
        .findOneAndUpdate(
          {
            _id: reportDriveDto.id,
            is_deleted: { $ne: true },
            is_blocked: { $ne: true },
          },
          { $addToSet: { report_post: updateData } },
          { new: true },
        )
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        return res.send({
          success: true,
          message: mConfig.Reported_successfully,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-reportPost',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for create drive event
  public async eventCreate(
    userDriveEventDto: UserDriveEventDto,
    res: any,
  ): Promise<Drive> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        userDriveEventDto,
      );

      const existDrive: any = await this.driveModel
        .findOne({
          _id: ObjectID(userDriveEventDto.drive_id),
        })
        .select({ _id: 1 })
        .lean();
      if (!existDrive) {
        return res.json({
          message: mConfig.drive_not_found,
          success: false,
        });
      } else {
        const query = {
          user_id: ObjectID(userDriveEventDto.user_id),
          drive_id: ObjectID(userDriveEventDto.drive_id),
          unique_id: userDriveEventDto.unique_id,
        };

        const existDriveEvent: any = await this.userDriveEvent
          .findOne(query)
          .select({ _id: 1 })
          .lean();
        let result = {};
        if (!existDriveEvent) {
          const createDrive = new this.userDriveEvent(userDriveEventDto);
          result = await createDrive.save();
        } else {
          result = await this.userDriveEvent
            .findByIdAndUpdate(
              { _id: ObjectID(existDriveEvent._id) },
              { event_id: userDriveEventDto.event_id },
              { new: true },
            )
            .lean();
        }
        return res.json({
          success: true,
          message: mConfig.event_created,
          data: result,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-eventCreate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete drive post
  public async deletePost(id, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const result = await this.postModel
        .findOne({ _id: ObjectID(id), is_blocked: { $ne: true } })
        .select({ _id: 1, photos: 1, videos: 1, drive_id: 1 })
        .lean();
      if (!_.isEmpty(result)) {
        await this.postModel.findByIdAndDelete(id).select({ _id: 1 }).lean();
        await this.commentModel
          .deleteMany({ post_id: ObjectID(result._id) })
          .select({ _id: 1 })
          .lean();

        //delete post photos and videos
        if (result.photos && !_.isEmpty(result.photos)) {
          const photos = result.photos;
          photos.map(async (item) => {
            await this.commonService.s3ImageRemove(
              'drive/' + result.drive_id + '/post' + result._id,
              item,
            );
          });
        }

        return res.json({ success: true, message: mConfig.Post_deleted });
      } else {
        return res.json({ success: false, message: mConfig.No_data_found });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-deletePost',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete Drive event
  public async eventDelete(
    deleteUserDriveEventDto: DeleteUserDriveEventDto,
    res: any,
  ): Promise<Drive> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        deleteUserDriveEventDto,
      );

      const result: any = await this.userDriveEvent
        .findOneAndDelete({
          user_id: ObjectID(deleteUserDriveEventDto.user_id),
          drive_id: ObjectID(deleteUserDriveEventDto.drive_id),
          unique_id: deleteUserDriveEventDto.unique_id,
        })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        return res.json({
          message: mConfig.Event_deleted,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-eventDelete',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for block drive post
  public async blockPost(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const postData: any = await this.postModel
        .findOne({ _id: ObjectID(id), is_deleted: { $ne: true } })
        .select({
          _id: 1,
          user_id: 1,
          drive_id: 1,
        })
        .lean();

      if (!postData) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        const updateData: any = {
          is_blocked: true,
          block_time: new Date(),
        };
        await this.postModel
          .updateMany(
            {
              user_id: ObjectID(postData.user_id),
              drive_id: ObjectID(postData.drive_id),
              is_blocked: { $ne: true },
            },
            updateData,
          )
          .select({
            _id: 1,
          })
          .lean();

        const driveData: any = await this.driveModel
          .findOneAndUpdate(
            {
              _id: ObjectID(postData.drive_id),
              is_deleted: { $ne: true },
              'volunteers.user_id': ObjectID(postData.user_id),
            },
            {
              'volunteers.$.status': 'block',
              'volunteers.$.block_time': new Date(),
            },
            { new: true },
          )
          .select({
            _id: 1,
            drive_name: '$form_data.title_of_fundraiser',
            user_id: 1,
            reference_id: 1,
          })
          .lean();

        //send notification to user and volunteers
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_block_from_drive,
          {
            '{{drive_name}}': driveData.drive_name,
            '{{refId}}': driveData.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_block_from_drive,
          type: 'block-post',
          requestId: postData._id,
          categorySlug: 'drive',
          message: notiMsg,
          userId: postData.user_id,
          requestUserId: driveData.user_id,
        };

        this.commonService.notification(input);
        return res.json({
          message: mConfig.User_block,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-blockPost',
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
        !_.isUndefined(getUserByMailDto.volunteers) &&
        !_.isEmpty(getUserByMailDto.volunteers)
      ) {
        query.stringID = { $nin: getUserByMailDto.volunteers };
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
              from: 'drives',
              let: {
                id: '$_id',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $in: ['$$id', '$volunteers.user_id'] },
                        { $eq: ['$_id', ObjectID(getUserByMailDto.drive_id)] },
                      ],
                    },
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
              attendee: {
                $sum: {
                  $map: {
                    input: '$v.volunteers',
                    as: 'volunteer',
                    in: {
                      $cond: [
                        {
                          $and: [
                            {
                              $eq: ['$$volunteer.user_id', '$_id'],
                            },
                            {
                              $eq: ['$$volunteer.role', 'attendee'],
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
        'src/controller/drive/drive.service.ts-userByMailPhone',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for manage drive permission
  public async managePermission(volunteerData: any, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        volunteerData,
      );
      let tempQry = {
        _id: ObjectID(volunteerData.id),
        'volunteers.user_id': ObjectID(volunteerData.user_id),
      };
      const findDrive: any = await this.driveModel
        .findOne({
          is_deleted: { $ne: true },
          ...tempQry,
        })
        .select({
          _id: 1,
          reference_id: 1,
          user_id: 1,
          drive_name: '$form_data.title_of_fundraiser',
        })
        .lean();

      if (!findDrive) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const inviteVolunteerData = {
          'volunteers.$.invite_volunteer': volunteerData.invite_volunteer,
          'volunteers.$.manage_volunteer': volunteerData.manage_volunteer,
          'volunteers.$.manage_attendees': volunteerData.manage_attendees,
          'volunteers.$.edit_drive': volunteerData.edit_drive,
        };

        await this.driveModel.updateOne(tempQry, inviteVolunteerData).lean();

        //send hidden notification to volunteer
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_manage_permission,
          {
            '{{drive_name}}': findDrive.drive_name,
            '{{refId}}': findDrive.reference_id,
          },
        );

        const input: any = {
          title: mConfig.noti_title_manage_permission,
          type: 'manage-permission',
          requestId: findDrive._id,
          categorySlug: 'drive',
          requestUserId: findDrive.user_id,
          message: notiMsg,
          userId: volunteerData.user_id,
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
        'src/controller/drive/drive.service.ts-managePermission',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for manage drive permission
  public async addAsVolunteer(addAsVolunteer: AddAsVolunteer, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        addAsVolunteer,
      );
      const findDrive: any = await this.driveModel
        .findOne({
          _id: ObjectID(addAsVolunteer.id),
          is_deleted: { $ne: true },
          'volunteers.user_id': ObjectID(addAsVolunteer.user_id),
          'volunteers.role': 'attendee',
        })
        .select({
          _id: 1,
          user_id: 1,
          reference_id: 1,
          drive_name: '$form_data.title_of_fundraiser',
        })
        .lean();

      if (!findDrive) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const updateData = {
          'volunteers.$.role': 'volunteer',
        };

        await this.driveModel
          .updateOne(
            {
              _id: ObjectID(addAsVolunteer.id),
              'volunteers.user_id': ObjectID(addAsVolunteer.user_id),
            },
            updateData,
          )
          .lean();

        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_add_as_volunteer,
          {
            '{{drive_name}}': findDrive.drive_name,
            '{{refId}}': findDrive.reference_id,
          },
        );

        //send notification to that attendee
        const input: any = {
          title: mConfig.noti_title_add_as_volunteer,
          type: 'drive',
          requestId: findDrive._id,
          categorySlug: 'drive',
          requestUserId: findDrive.user_id,
          message: notiMsg,
          userId: addAsVolunteer.user_id,
        };
        this.commonService.notification(input);

        return res.json({
          success: true,
          message: mConfig.Add_as_volunteer,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-addAsVolunteer',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for block drive post
  public async unblockVolunteer(unblockVolunteer: AddAsVolunteer, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        unblockVolunteer,
      );
      let tempQry = {
        _id: ObjectID(unblockVolunteer.id),
        'volunteers.user_id': ObjectID(unblockVolunteer.user_id),
      };
      const findDrive: any = await this.driveModel
        .findOne({
          is_deleted: { $ne: true },
          ...tempQry,
        })
        .select({
          _id: 1,
          user_id: 1,
          reference_id: 1,
          drive_name: '$form_data.title_of_fundraiser',
        })
        .lean();

      if (!findDrive) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        const updateData: any = {
          'volunteers.$.status': 'approve',
          $unset: {
            'volunteers.block_time': 1,
          },
        };

        await this.driveModel
          .updateOne(tempQry, updateData, { new: true })
          .select({
            _id: 1,
          })
          .lean();

        //send notification to volunteer
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_unblock_from_drive,
          {
            '{{drive_name}}': findDrive.drive_name,
            '{{refId}}': findDrive.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_unblock_from_drive,
          type: 'drive',
          requestId: findDrive._id,
          categorySlug: 'drive',
          message: notiMsg,
          requestUserId: findDrive.user_id,
          userId: unblockVolunteer.user_id,
        };

        this.commonService.notification(input);
        return res.json({
          message: mConfig.User_unblock,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-unblockVolunteer',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for invite volunteer
  public async inviteVolunteer(inviteVolunteerDto: any, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        inviteVolunteerDto,
      );
      const findDrive: any = await this.driveModel
        .findOne({
          _id: ObjectID(inviteVolunteerDto.id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          volunteers: 1,
          user_id: 1,
          form_data: 1,
          reference_id: 1,
          drive_name: '$form_data.title_of_fundraiser',
        })
        .lean();

      if (!findDrive) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const existingVolunteers = findDrive.volunteers;
        const previousVolunteers = [];
        const defaultVolunteerIds = [];
        const allVolunteerIds = [];

        //if new then add and if not exist in new volunteer data then remove
        existingVolunteers.map((volunteer: any) => {
          const newData = volunteer;
          const volunteer_id: any = volunteer.user_id.toString();
          if (inviteVolunteerDto.volunteers.includes(volunteer_id)) {
            newData.role = 'volunteer';
            previousVolunteers.push(newData);
            allVolunteerIds.push(volunteer_id);
          } else {
            previousVolunteers.push(newData);
          }
          defaultVolunteerIds.push(volunteer_id);
        });

        const newVolunteers = [];
        if (
          inviteVolunteerDto.volunteers &&
          !_.isEmpty(inviteVolunteerDto.volunteers)
        ) {
          const volunteers = inviteVolunteerDto.volunteers;
          volunteers.map((data) => {
            if (!defaultVolunteerIds.includes(data)) {
              newVolunteers.push({
                user_id: ObjectID(data),
                role: 'volunteer',
                invite_volunteer: false,
                manage_volunteer: false,
                manage_attendees: false,
                edit_drive: false,
                status: 'approve',
                join_time: new Date(),
              });
              allVolunteerIds.push(data);
            }
          });
        }
        const updateVolunteers: any = previousVolunteers.concat(newVolunteers);
        await this.driveModel
          .findOneAndUpdate(
            {
              _id: ObjectID(inviteVolunteerDto.id),
            },
            {
              volunteers: updateVolunteers,
            },
          )
          .lean();
        if (!_.isEmpty(inviteVolunteerDto.volunteers)) {
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_add_as_volunteer,
            {
              '{{drive_name}}': findDrive.drive_name,
              '{{refId}}': findDrive.reference_id,
            },
          );

          //send notification to volunteers
          const input: any = {
            title: mConfig.noti_title_drive_invite,
            type: 'drive',
            requestId: findDrive._id,
            requestUserId: findDrive.user_id,
            categorySlug: 'drive',
            message: msg,
          };
          this.commonService.sendAllNotification(
            inviteVolunteerDto.volunteers,
            input,
          );
          return res.json({
            success: true,
            message: mConfig.Add_as_volunteer,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-inviteVolunteer',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get fundraiser
  public async fundraiserList(param: any, res: any) {
    try {
      const userDetail = this.request.user;

      let query;
      if (param && param.my_request == 1) {
        query = {
          status: { $in: ['pending', 'approve'] },
          is_deleted: { $ne: true },
          category_slug: { $ne: 'hunger' },
          $or: [
            {
              user_id: ObjectID(userDetail._id),
            },
            {
              'admins.user_id': ObjectID(userDetail._id),
            },
          ],
        };
      } else {
        if (!param.title || _.isUndefined(param.title)) {
          return res.json({
            success: true,
            data: [],
          });
        }
        query = {
          status: 'approve',
          is_deleted: { $ne: true },
          category_slug: { $ne: 'hunger' },
          'form_data.title_of_fundraiser': new RegExp(param.title.trim(), 'i'),
          $or: [
            {
              user_id: { $ne: ObjectID(userDetail._id) },
            },
            {
              'admins.user_id': { $ne: ObjectID(userDetail._id) },
            },
          ],
        };
      }
      const total_record = await this.causeRequestModel
        .countDocuments(query)
        .exec();
      const sortData = ['_id'];
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
        10,
        total_record,
        sortData,
        param.sort_type,
        param.sort,
      );

      const requestData = await this.causeRequestModel.aggregate(
        [
          { $match: query },
          {
            $project: {
              _id: 1,
              image: {
                $concat: [
                  authConfig.imageUrl,
                  'request/',
                  {
                    $arrayElemAt: ['$form_data.files.upload_cover_photo', 0],
                  },
                ],
              },
              title_of_fundraiser: '$form_data.title_of_fundraiser',
              country_data: 1,
              goal_amount: { $toInt: '$form_data.goal_amount' },
              remaining_amount: '$form_data.remaining_amount',
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
        'src/controller/drive/drive.service.ts-fundraiserList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get fund
  public async fundList(param: any, res: any) {
    try {
      const userDetail = this.request.user;
      let query;
      if (param && param.my_request == 1) {
        query = {
          status: { $in: ['pending', 'approve'] },
          is_deleted: { $ne: true },
          $or: [
            {
              user_id: ObjectID(userDetail._id),
            },
            {
              'admins.user_id': ObjectID(userDetail._id),
            },
          ],
        };
      } else {
        if (!param.title || _.isUndefined(param.title)) {
          return res.json({
            success: true,
            data: [],
          });
        }
        query = {
          status: 'approve',
          is_deleted: { $ne: true },
          'form_data.title_of_fundraiser': new RegExp(param.title.trim(), 'i'),
          $or: [
            {
              user_id: { $ne: ObjectID(userDetail._id) },
            },
            {
              'admins.user_id': { $ne: ObjectID(userDetail._id) },
            },
          ],
        };
      }
      const total_record = await this.fundModel.countDocuments(query).exec();
      const sortData = ['_id'];
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
        10,
        total_record,
        sortData,
        param.sort_type,
        param.sort,
      );
      const requestData = await this.fundModel.aggregate(
        [
          { $match: query },
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
            $project: {
              _id: 1,
              image: {
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
              title_of_fundraiser: '$form_data.title_of_fundraiser',
              country_data: 1,
              raised: { $sum: '$donations.converted_amt' },
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
        'src/controller/drive/drive.service.ts-fundList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get fundraiser
  public async linkedfundraiserList(param: any, res: any) {
    try {
      if (!param.drive_id) {
        return res.json({
          success: false,
          message: mConfig.drive_id_required,
        });
      }
      let driveQuery = {
        _id: ObjectID(param.drive_id),
        is_deleted: { $ne: true },
      };
      const findDrive: any = await this.driveModel.distinct(
        'fundraiser_ids',
        driveQuery,
      );
      if (!findDrive) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const query = {
          _id: { $in: findDrive },
          status: 'approve',
          is_deleted: { $ne: true },
        };

        const total_record = await this.causeRequestModel
          .countDocuments(query)
          .exec();
        const sortData = ['_id'];

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

        const requestData = await this.causeRequestModel.aggregate(
          [
            { $match: query },
            {
              $project: {
                _id: 1,
                image: {
                  $concat: [
                    authConfig.imageUrl,
                    'request/',
                    {
                      $arrayElemAt: ['$form_data.files.upload_cover_photo', 0],
                    },
                  ],
                },
                title_of_fundraiser: '$form_data.title_of_fundraiser',
                country_data: 1,
                goal_amount: { $toInt: '$form_data.goal_amount' },
                remaining_amount: '$form_data.remaining_amount',
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
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-linkedfundraiserList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get fund
  public async linkedfundList(param: any, res: any) {
    try {
      if (!param.drive_id) {
        return res.json({
          success: false,
          message: mConfig.drive_id_required,
        });
      }
      const findDrive: any = await this.driveModel
        .findOne({
          _id: ObjectID(param.drive_id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          user_id: 1,
          fundraiser_ids: 1,
          fund_ids: 1,
          drive_name: '$form_data.title_of_fundraiser',
        })
        .lean();
      if (!findDrive) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const query = {
          _id: { $in: findDrive.fund_ids },
          status: 'approve',
          is_deleted: { $ne: true },
        };

        const total_record = await this.fundModel.countDocuments(query).exec();

        const sortData = ['_id'];

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

        const requestData = await this.fundModel.aggregate(
          [
            { $match: query },
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
              $project: {
                _id: 1,
                image: {
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
                title_of_fundraiser: '$form_data.title_of_fundraiser',
                country_data: 1,
                raised: { $sum: '$donations.converted_amt' },
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
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-linkedfundList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get drive fund and fundraiser list
  public async fundFundraiserList(drive_id: any, res: any) {
    try {
      const requestData = await this.driveModel.aggregate(
        [
          { $match: { _id: ObjectID(drive_id) } },
          {
            $addFields: {
              fund_id: {
                $ifNull: ['$fund_ids', []],
              },
              fundraiser_id: {
                $ifNull: ['$fundraiser_ids', []],
              },
            },
          },
          {
            $lookup: {
              from: 'fund',
              let: { fund_ids: '$fund_id' },
              pipeline: [
                {
                  $addFields: {
                    id: { $toString: '$_id' },
                  },
                },
                {
                  $match: {
                    $expr: {
                      $in: ['$id', '$$fund_ids'],
                    },
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
                    as: 'tData',
                  },
                },
                {
                  $set: {
                    total_anonymous: {
                      $size: {
                        $filter: {
                          input: '$tData',
                          as: 'd',
                          cond: {
                            $eq: ['$$d.is_contribute_anonymously', true],
                          },
                        },
                      },
                    },
                    total_no_anonymous: {
                      $size: {
                        $filter: {
                          input: '$tData',
                          as: 'd',
                          cond: {
                            $eq: ['$$d.is_contribute_anonymously', false],
                          },
                        },
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    image: {
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
                    title_of_fundraiser: '$form_data.title_of_fundraiser',
                    'form_data.title_of_fundraiser': 1,
                    country_data: 1,
                    raised: { $sum: '$tData.converted_amt' },
                    total_donors: {
                      $sum: ['$total_anonymous', '$total_no_anonymous'],
                    },
                  },
                },
              ],
              as: 'fund_data',
            },
          },
          {
            $lookup: {
              from: 'requests',
              let: { fundraiser_ids: '$fundraiser_id' },
              pipeline: [
                {
                  $addFields: {
                    id: { $toString: '$_id' },
                  },
                },
                {
                  $match: {
                    $expr: {
                      $in: ['$id', '$$fundraiser_ids'],
                    },
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
                  $set: {
                    total_anonymous: {
                      $size: {
                        $filter: {
                          input: '$tData',
                          as: 'd',
                          cond: {
                            $eq: ['$$d.is_contribute_anonymously', true],
                          },
                        },
                      },
                    },
                    total_no_anonymous: {
                      $size: {
                        $filter: {
                          input: '$tData',
                          as: 'd',
                          cond: {
                            $eq: ['$$d.is_contribute_anonymously', false],
                          },
                        },
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    image: {
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
                    title_of_fundraiser: '$form_data.title_of_fundraiser',
                    country_data: 1,
                    status: 1,
                    form_data: {
                      remaining_amount: 1,
                      goal_amount: 1,
                      expiry_date: 1,
                    },
                    total_donors: {
                      $sum: ['$total_anonymous', '$total_no_anonymous'],
                    },
                    avg_donation: {
                      $cond: {
                        if: { $eq: [{ $size: '$tData' }, 0] },
                        then: 0,
                        else: {
                          $cond: {
                            if: {
                              $gte: [
                                { $sum: '$tData.converted_amt' },
                                { $toInt: '$form_data.goal_amount' },
                              ],
                            },
                            then: 100,
                            else: {
                              $multiply: [
                                {
                                  $divide: [
                                    {
                                      $toInt: { $sum: '$tData.converted_amt' },
                                    },
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
                  },
                },
              ],
              as: 'fundraiser_data',
            },
          },
          {
            $project: {
              _id: 1,
              fund_data: 1,
              fundraiser_data: 1,
            },
          },
        ],
        { collation: authConfig.collation },
      );
      return res.json({
        success: true,
        data: requestData,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/drive/drive.service.ts-fundFundraiserList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
