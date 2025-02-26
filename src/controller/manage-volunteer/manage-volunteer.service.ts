import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { ErrorlogService } from '../error-log/error-log.service';
import { QueueService } from '../../common/queue.service';
import { CommonService } from '../../common/common.service';
import mConfig from '../../config/message.config.json';
import { authConfig } from '../../config/auth.config';
import { LogService } from 'src/common/log.service';
import { CreateManageVolunteerDto } from './dto/create-manage-volunteer.dto';
import { UpdateManageVolunteerDto } from './dto/update-manage-volunteer.dto';
import { RemoveVolunteerDto } from './dto/remove-volunteer.dto';
import { ManagePermissionDto } from './dto/manage-permission.dto';
import { UnblockVolunteer } from './dto/unblock-volunteer.dto';
import {
  RequestModel,
  RequestDocument,
} from '../request/entities/request.entity';
import {
  ManageVolunteer,
  ManageVolunteerDocument,
} from './entities/manage-volunteer.entity';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class ManageVolunteerService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly queueService: QueueService,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,

    @InjectModel(ManageVolunteer.name)
    private manageVolunteerModel: Model<ManageVolunteerDocument>,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
  ) {}

  //Api for Join request
  public async joinRequest(
    id: string,
    res: any,
  ): Promise<ManageVolunteerDocument> {
    try {
      const userDetail = this.request.user;

      //find request detail
      let findRequest: any = await this.requestModel.findById(
        {
          _id: ObjectID(id),
          is_deleted: { $ne: true },
        },
        {
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          user_id: 1,
          reference_id: 1,
          status: 1,
          admins: 1,
          category_slug: 1,
        },
      );

      if (_.isEmpty(findRequest)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        if (findRequest.status != 'approve') {
          return res.json({
            success: false,
            message: mConfig.not_allow_to_join_request,
          });
        } else {
          //Check user is added as a admin or not

          if (findRequest && !_.isEmpty(findRequest.admins)) {
            let findAdmin = findRequest.admins.find(
              (i: any) => i?.user_id.toString() == userDetail?._id.toString(),
            );

            if (findAdmin) {
              return res.json({
                success: false,
                message: mConfig.already_add_as_admin,
              });
            }
          }

          //find volunteer data in manage-volunteer
          const data: any = await this.manageVolunteerModel
            .findOne({
              request_id: ObjectID(id),
              volunteer_id: ObjectID(userDetail._id),
            })
            .select({ _id: 1 })
            .lean();
          if (!_.isEmpty(data)) {
            return res.json({
              success: false,
              message: mConfig.already_joined_fundraiser,
            });
          }
        }

        //Add volunteer data
        const volunteerData = {
          request_id: ObjectID(id),
          volunteer_id: ObjectID(userDetail._id),
          status: 'approve',
          invite_volunteer: false,
          manage_volunteer: false,
          edit_fundraiser: false,
        };

        const createVolunteer = new this.manageVolunteerModel(volunteerData);
        const result = await createVolunteer.save();

        //send notification to admin and user
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_join_fundraiser,
          {
            '{{uname}}': userDetail.display_name,
            '{{fundraiser_name}}':
              findRequest?.form_data?.title_of_fundraiser || '',
            '{{refId}}': findRequest.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_join_fundraiser,
          type: 'join-request',
          categorySlug: findRequest.category_slug,
          requestId: findRequest._id,
          message: msg,
          userId: findRequest.user_id,
          requestUserId: findRequest.user_id,
        };

        await this.commonService.notification(input);
        this.commonService.sendAdminNotification(input);

        return res.send({
          success: true,
          message: mConfig.request_join,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manage-volunteer/manage-volunteer.service.ts-joinRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for leave request
  public async leaveFundraiser(
    id: string,
    res: any,
  ): Promise<ManageVolunteerDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const userDetail = this.request.user;

      const findRequest: any = await this.requestModel
        .findOne({
          _id: ObjectID(id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          user_id: 1,
          reference_id: 1,
          status: 1,
          category_slug: 1,
        })
        .lean();

      if (!findRequest) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        //find and delete volunteer
        const result = await this.manageVolunteerModel
          .findOneAndDelete({
            request_id: ObjectID(id),
            volunteer_id: ObjectID(userDetail._id),
          })
          .select({ _id: 1 })
          .lean();
        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }

        //send notification to admin and user
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_leave_fundraiser,
          {
            '{{uname}}': userDetail.display_name,
            '{{fundraiser_name}}':
              findRequest?.form_data?.title_of_fundraiser || '',
            '{{refId}}': findRequest.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_leave_fundraiser,
          type: 'leave-request',
          categorySlug: findRequest.category_slug,
          requestId: findRequest._id,
          message: msg,
          userId: findRequest.user_id,
        };
        await this.commonService.notification(input);
        this.commonService.sendAdminNotification(input);

        return res.send({
          success: true,
          message: mConfig.fundraiser_left,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manage-volunteer/manage-volunteer.service.ts-leaveFundraiser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list volunteer
  public async volunteerList(id, param, res) {
    try {
      const match: any = {
        request_id: ObjectID(id),
        is_deleted: { $ne: true },
        status: 'approve',
      };

      if (param.blocked && param.blocked == 1) {
        match['status'] = 'block';
      }

      const search = {};

      if (param.search && !_.isUndefined(param.search)) {
        search['$or'] = [
          { user_name: new RegExp(param.search, 'i') },
          { email: new RegExp(param.search, 'i') },
          { phone: new RegExp(param.search, 'i') },
        ];
      }

      const addFields = {
        $addFields: {
          user_name: '$userData.user_name',
          user_image: '$userData.user_image',
          email: '$userData.email',
          phone: '$userData.phone',
          phone_code: '$userData.phone_code',
          phone_country_short_name: '$userData.phone_country_short_name',
        },
      };

      const lookup = [
        {
          $lookup: {
            from: 'user',
            let: { user_id: '$volunteer_id' },
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
                  email: 1,
                  phone: 1,
                  phone_code: 1,
                  phone_country_short_name: 1,
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

      const total = await this.manageVolunteerModel
        .aggregate([
          {
            $match: match,
          },
          ...lookup,
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
      const volunteersData = await this.manageVolunteerModel
        .aggregate([
          {
            $match: match,
          },
          ...lookup,
          addFields,
          {
            $match: search,
          },
          {
            $project: {
              _id: 1,
              volunteer_id: 1,
              join_time: '$createdAt',
              user_name: 1,
              email: 1,
              phone: 1,
              phone_code: 1,
              phone_country_short_name: 1,
              user_image: 1,
              status: 1,
              invite_volunteer: 1,
              manage_volunteer: 1,
              edit_fundraiser: 1,
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
        'src/controller/manage-volunteer/manage-volunteer.service.ts-volunteerList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for remove volunteer from request
  public async removeVolunteer(
    removeVolunteerDto: RemoveVolunteerDto,
    res: any,
  ): Promise<ManageVolunteerDocument> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        removeVolunteerDto,
      );
      const userDetail = this.request.user;

      const findRequest: any = await this.requestModel
        .findOne({
          _id: ObjectID(removeVolunteerDto.request_id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          user_id: 1,
          reference_id: 1,
          status: 1,
          category_slug: 1,
        })
        .lean();

      if (!findRequest) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        //find and delete volunteer
        const result = await this.manageVolunteerModel
          .findOneAndDelete({
            request_id: ObjectID(removeVolunteerDto.request_id),
            volunteer_id: ObjectID(removeVolunteerDto.user_id),
          })
          .select({ _id: 1 })
          .lean();
        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }

        //send notification to admin and user
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_remove_from_request,
          {
            '{{uname}}': userDetail.display_name,
            '{{fundraiser_name}}':
              findRequest?.form_data?.title_of_fundraiser || '',
            '{{refId}}': findRequest.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_remove_from_request,
          type: 'removed-request',
          categorySlug: findRequest.category_slug,
          requestId: findRequest._id,
          message: msg,
          userId: removeVolunteerDto.user_id,
        };
        await this.commonService.notification(input);
        this.commonService.sendAdminNotification(input);

        return res.send({
          success: true,
          message: mConfig.volunteer_removed,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/manage-volunteer/manage-volunteer.service.ts-removeVolunteer',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for manage volunteer request permission
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

      const userId = this.request.user._id;

      const findRequest: any = await this.requestModel
        .findOne({
          _id: ObjectID(managePermissionDto.request_id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          user_id: 1,
          reference_id: 1,
          status: 1,
          category_slug: 1,
        });

      if (!findRequest) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        if (findRequest.user_id != userId) {
          return res.json({
            success: false,
            message: mConfig.not_allow_to_change_permission,
          });
        }
        const permissions = {
          invite_volunteer: managePermissionDto.invite_volunteer,
          manage_volunteer: managePermissionDto.manage_volunteer,
          edit_fundraiser: managePermissionDto.edit_fundraiser,
        };

        const result: any = await this.manageVolunteerModel
          .findOneAndUpdate(
            {
              request_id: ObjectID(managePermissionDto.request_id),
              volunteer_id: ObjectID(managePermissionDto.user_id),
            },
            permissions,
            { new: true },
          )
          .select({ _id: 1 })
          .lean();

        if (!result) {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }

        //send notification to volunteer
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_manage_user_permission,
          {
            '{{request_name}}':
              findRequest?.form_data?.title_of_fundraiser || '',
            '{{refId}}': findRequest.reference_id,
          },
        );

        const input: any = {
          title: mConfig.noti_title_manage_user_permission,
          type: 'manage-permission',
          requestId: findRequest._id,
          categorySlug: findRequest.category_slug,
          requestUserId: findRequest.user_id,
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
        'src/controller/manage-volunteer/manage-volunteer.service.ts-managePermission',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for unblock volunteer in request
  public async unblockVolunteer(unblockVolunteer: UnblockVolunteer, res: any) {
    try {
      const findRequest: any = await this.requestModel
        .findOne({
          _id: ObjectID(unblockVolunteer.id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          user_id: 1,
          reference_id: 1,
          status: 1,
          category_slug: 1,
        })
        .lean();

      if (!findRequest) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        const updateData: any = {
          status: 'approve',
          $unset: {
            block_reason: 1,
            block_time: 1,
          },
        };

        //unblock volunteer
        const result: any = await this.manageVolunteerModel
          .findOneAndUpdate(
            {
              request_id: ObjectID(unblockVolunteer.id),
              volunteer_id: ObjectID(unblockVolunteer.user_id),
            },
            updateData,
            { new: true },
          )
          .select({ _id: 1 })
          .lean();

        //send notification to volunteer
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_unblock_from_request,
          {
            '{{fundraiser_name}}': findRequest?.form_data?.title_of_fundraiser,
            '{{refId}}': findRequest.reference_id,
          },
        );
        const input: any = {
          title: mConfig.noti_title_unblock_from_request,
          type: 'unblock-volunteer',
          requestId: findRequest._id,
          categorySlug: findRequest.category_slug,
          message: notiMsg,
          requestUserId: findRequest.user_id,
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
        'src/controller/manage-volunteer/manage-volunteer.service.ts-unblockVolunteer',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
