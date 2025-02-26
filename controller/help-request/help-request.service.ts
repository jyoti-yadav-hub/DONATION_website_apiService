import { _ } from 'lodash';
import moment from 'moment';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import smsConfig from '../../config/sms.config.json';
import { QueueService } from '../../common/queue.service';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { authConfig } from '../../config/auth.config';
import { BlockRequestDto } from '../admin/dto/block-request.dto';
import { CreateHelpRequestDto } from './dto/create-help-request.dto';
import { UpdateHelpRequestDto } from './dto/update-help-request.dto';
import { VerifyHelpRequestDto } from './dto/verify-help-request.dto';
import { Queue, QueueDocument } from '../request/entities/queue-data.entity';
import {
  HelpRequest,
  HelpRequestDocument,
} from './entities/help-request.entity';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../request/entities/cause-request.entity';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class HelpRequestService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly queueService: QueueService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(HelpRequest.name)
    private helpRequestModel: Model<HelpRequestDocument>,
    @InjectModel(Queue.name)
    private queueModel: Model<QueueDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
  ) {}

  //Api for Create Fund
  public async create(
    file: object,
    createHelpRequestDto: any,
    res: any,
  ): Promise<HelpRequest> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        createHelpRequestDto,
      );

      if (!_.isEmpty(file)) {
        //Insert and return image file name
        const imageId: any = await this.commonService.checkAndLoadImage(
          file,
          'help-request',
        );
        if (imageId && !imageId.success) {
          return res.json(imageId);
        }
        createHelpRequestDto.audio = imageId.file_name;
      }
      const latitude = Number(createHelpRequestDto.latitude);
      const longitude = Number(createHelpRequestDto.longitude);
      createHelpRequestDto.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
        city: createHelpRequestDto.city,
      };
      createHelpRequestDto.status = 'pending';
      const createHelpRequest = new this.helpRequestModel(createHelpRequestDto);
      const result = await createHelpRequest.save();
      //send notification to all admin
      const input: any = {
        title: mConfig.noti_title_new_help_request,
        type: 'help-request',
        requestId: result._id,
        message: mConfig.noti_msg_admin_new_help_request,
      };
      this.commonService.sendAdminNotification(input);

      return res.json({
        success: true,
        message: 'Help request created successfully!',
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/help-request/help-request.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list help request for Admin
  public async findAll(param, res: any): Promise<HelpRequest> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      const operator = param.operator ? param.operator.trim() : '=';
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        if (!_.isUndefined(filter.phone) && filter.phone) {
          const query = await this.commonService.filter(
            'contains',
            filter.phone,
            'phone',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.help_language) && filter.help_language) {
          const query = await this.commonService.filter(
            'contains',
            filter.help_language,
            'help_language',
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

        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            'contains',
            filter.status,
            'status',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.description) && filter.description) {
          const query = await this.commonService.filter(
            operator,
            filter.description,
            'description',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'phone',
            'help_language',
            'createdAt',
            'status',
            'description',
          ];
          const stringFilter = await this.commonService.getGlobalFilter(
            fields,
            filter.search,
          );

          query = stringFilter;
        }

        if (!_.isUndefined(filter.search) && !_.isEmpty(query)) {
          match['$or'] = query;
        }
        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      const sortData = {
        phone: 'phone',
        status: 'status',
        help_language: 'help_language',
        createdAt: 'createdAt',
        description: 'description',
      };
      const total_record = await this.helpRequestModel.countDocuments(match).exec();
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

      const data = await this.helpRequestModel.aggregate(
        [
          { $match: match },
          { $sort: sort },
          {
            $project: {
              _id: 1,
              phone: 1,
              phone_code: 1,
              country_code: 1,
              audio: {
                $concat: [authConfig.imageUrl, 'help-request/', '$audio'],
              },
              createdAt: 1,
              help_language: 1,
              status: 1,
              description: 1,
              location: 1,
            },
          },
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
        'src/controller/help-request/help-request.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list help request for volunteer in app
  public async list(param, res: any): Promise<HelpRequest> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const userData = this.request.user;
      const match: any = {
        volunteer_id: { $in: [ObjectID(userData._id)] },
        status: 'waiting_for_volunteer',
      };
      //Add contion where _is is exist in volunteer_id array
      if (!_.isUndefined(param.status) && param.status) {
        match.status = param.status;
      }

      const sortData = {
        status: 'status',
        help_language: 'help_language',
        createdAt: 'createdAt',
      };
      const total_record = await this.helpRequestModel.countDocuments(match).exec();
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

      const data = await this.helpRequestModel.aggregate(
        [
          { $match: match },
          { $sort: sort },
          {
            $project: {
              _id: 1,
              phone: 1,
              phone_code: 1,
              country_code: 1,
              audio: {
                $concat: [authConfig.imageUrl, 'help-request/', '$audio'],
              },
              createdAt: 1,
              help_language: 1,
              status: 1,
              volunteer_id: 1,
              country: 1,
              complete_time: 1,
              approve_time: 1,
              reject_reason: 1,
              reject_time: 1,
              report_benificiary: 1,
              description: 1,
              location: 1,
            },
          },
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
        'src/controller/help-request/help-request.service.ts-list',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for help request details
  public async getDetail(id, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const data = await this.helpRequestModel.aggregate([
        { $match: { _id: ObjectID(id) } },
        {
          $lookup: {
            from: 'user',
            let: { id: '$volunteer_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$id'] }],
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
        {
          $project: {
            _id: 1,
            phone: 1,
            phone_code: 1,
            country_code: 1,
            audio: {
              $concat: [authConfig.imageUrl, 'help-request/', '$audio'],
            },
            createdAt: 1,
            help_language: 1,
            volunteer_id: 1,
            country: 1,
            noVolunteer: 1,
            complete_time: 1,
            approve_time: 1,
            volunteer_name: {
              $concat: ['$userData.first_name', ' ', '$userData.last_name'],
            },
            volunteer_email: '$userData.email',
            volunteer_phone: '$userData.phone',
            volunteer_phone_code: '$userData.phone_code',
            reject_reason: 1,
            reject_time: 1,
            report_benificiary: 1,
            status: 1,
            description: 1,
            location: 1,
          },
        },
      ]);

      return res.json({
        data: data[0],
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/help-request/help-request.service.ts-getDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for send notification to volunteer of help request
  public async assignVolunteer(id, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', id);
      const helpRequest = await this.helpRequestModel
        .findOne({
          _id: ObjectID(id),
          status: 'pending',
        })
        .select({ _id: 1, country: 1 })
        .lean();
      if (!helpRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //get setting country key wise
        const result = await this.commonService.getCommonSetting(
          helpRequest.country,
        );
        let maxRadiusKm = 50;
        if (!_.isEmpty(result) && !_.isEmpty(result.form_data)) {
          const formData = result.form_data;
          maxRadiusKm = formData.max_radius_in_kilometer;
        }

        const addQueueData: any = {
          request_id: helpRequest._id,
          users: [],
          max_radius_km: maxRadiusKm,
          type: 'help_request',
        };

        await this.queueModel.updateOne(
          { request_id: helpRequest._id },
          addQueueData,
          {
            upsert: true,
          },
        );

        await this.helpRequestModel
          .findByIdAndUpdate(
            { _id: ObjectID(id) },
            { status: 'waiting_for_volunteer' },
          )
          .select({ _id: 1 })
          .lean();

        return res.json({
          success: true,
          message: mConfig.help_request_send_to_volunteer,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/help-request/help-request.service.ts-assignVolunteer',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for verify help request
  public async verifyRequest(
    reqId: string,
    verifyHelpRequestDto: VerifyHelpRequestDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', reqId);
      const userDetail = this.request.user;
      let smsMsg;

      const updateData: any = {
        $set: {
          status: verifyHelpRequestDto.status,
        },
      };
      if (verifyHelpRequestDto.status == 'completed') {
        updateData['$set']['complete_time'] = new Date();
        smsMsg = await this.commonService.changeString(
          smsConfig.sms_complete_help_request,
          { '{{uname}}': userDetail.first_name + '' + userDetail.last_name },
        );
      } else if (verifyHelpRequestDto.status == 'rejected') {
        updateData['$set']['reject_time'] = new Date();
        updateData['$set']['reject_reason'] =
          verifyHelpRequestDto.reject_reason;
        smsMsg = await this.commonService.changeString(
          smsConfig.sms_reject_help_request,
          { '{{uname}}': userDetail.first_name + '' + userDetail.last_name },
        );
      }

      const helpRequest = await this.helpRequestModel
        .findByIdAndUpdate({ _id: ObjectID(reqId) }, updateData, {
          new: true,
        })
        .select({ _id: 1, phone: { $concat: ['$phone_code', '$phone'] } })
        .lean();

      if (!helpRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //send sms to user
        const text = {
          phone: [helpRequest.phone],
          message: smsMsg,
        };
        await this.commonService.sendTextMessage(
          text,
          this.request.originalUrl,
        );

        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_help_request_verify,
          {
            '{{status}}': verifyHelpRequestDto.status,
          },
        );
        const notiMsg = await this.commonService.changeString(
          mConfig.noti_msg_help_request_verify,
          {
            '{{user}}': userDetail.first_name + ' ' + userDetail.last_name,
            '{{status}}': verifyHelpRequestDto.status,
          },
        );

        //send notification to admin
        const input: any = {
          title: notiTitle,
          type: 'help-request',
          requestId: reqId,
          categorySlug: 'help-request',
          message: notiMsg,
        };
        this.commonService.sendAdminNotification(input);

        return res.json({
          success: true,
          message:
            verifyHelpRequestDto.status === 'completed'
              ? mConfig.Request_completed
              : verifyHelpRequestDto.status === 'rejected'
              ? mConfig.Request_rejected
              : mConfig.Request_verified,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/help-request/help-request.service.ts-verifyRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for report help request
  public async reportBenificiary(id: string, description: string, res: any) {
    try {
      const userDetail = this.request.user;
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        description,
      );

      const uname = userDetail.display_name
        ? userDetail.display_name
        : userDetail.first_name + ' ' + userDetail.last_name;

      const helpRequest = await this.helpRequestModel
        .findByIdAndUpdate({ _id: id }, { report_benificiary: description })
        .select({ _id: 1, phone: { $concat: ['$phone_code', '$phone'] } })
        .lean();
      if (!helpRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const smsMsg = await this.commonService.changeString(
          smsConfig.sms_report_help_request,
          { '{{uname}}': userDetail.first_name + '' + userDetail.last_name },
        );

        //send SMS/text-message to request created user
        const text = {
          phone: [helpRequest.phone],
          message: smsMsg,
        };
        await this.commonService.sendTextMessage(
          text,
          this.request.originalUrl,
        );
        const reportTitle = await this.commonService.changeString(
          mConfig.noti_title_help_request_report,
          { '{{uname}}': uname },
        );
        const reportMsg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': description },
        );

        //send notification to admin
        const input: any = {
          title: reportTitle,
          type: 'help-request',
          requestId: helpRequest._id,
          categorySlug: 'help-request',
          message: reportMsg,
        };
        this.commonService.sendAdminNotification(input);

        return res.json({
          message: mConfig.Reported_successfully,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/help-request/help-request.service.ts-reportBenificiary',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for approve help request
  public async approveRequest(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const userDetail = this.request.user;

      const reqData: any = await this.helpRequestModel
        .findById({ _id: id })
        .select({
          _id: 1,
          volunteer_id: 1,
          phone: { $concat: ['$phone_code', '$phone'] },
        })
        .lean();

      if (!reqData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const updateData = {
          status: 'approve',
          approve_time: new Date(),
          volunteer_id: userDetail._id,
        };
        await this.helpRequestModel
          .findByIdAndUpdate({ _id: ObjectID(id) }, updateData, {
            new: true,
          })
          .select({
            _id: 1,
          })
          .lean();

        const smsMsg = await this.commonService.changeString(
          smsConfig.sms_accept_help_request,
          { '{{uname}}': userDetail.first_name + '' + userDetail.last_name },
        );

        //send SMS/text-message to request created user
        const text = {
          phone: [reqData.phone],
          message: smsMsg,
        };
        await this.commonService.sendTextMessage(
          text,
          this.request.originalUrl,
        );

        const acceptMsg = await this.commonService.changeString(
          mConfig.noti_msg_help_request_accept,
          { '{{uname}}': userDetail.first_name + '' + userDetail.last_name },
        );

        //send notification to admin
        const input: any = {
          title: mConfig.noti_title_help_request_accept,
          type: 'help-request',
          requestId: reqData._id,
          categorySlug: 'help-request',
          message: acceptMsg,
        };
        this.commonService.sendAdminNotification(input);

        const finalVolunteers = reqData.volunteer_id.map((x) => x.toString());
        const volunteersIds = finalVolunteers.filter(
          (item) => item !== userDetail._id.toString(),
        );

        const input1: any = {
          title: mConfig.noti_title_help_request_assign,
          type: 'help-request',
          requestId: reqData._id,
          categorySlug: 'help-request',
          message: mConfig.noti_msg_help_request_assign,
        };

        this.commonService.sendAllNotification(volunteersIds, input1);

        return res.send({
          success: true,
          message: mConfig.Request_approved,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/help-request/help-request.service.ts-approveRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for block help request
  public async blockRequest(blockRequestDto: BlockRequestDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        blockRequestDto,
      );

      const updateData: any = {
        status: 'blocked',
        block_reason: blockRequestDto.reason,
      };
      const helpRequest = await this.helpRequestModel
        .findByIdAndUpdate(
          {
            _id: ObjectID(blockRequestDto.id),
            status: { $in: ['waiting_for_volunteer', 'approve'] },
          },
          updateData,
          {
            new: true,
          },
        )
        .select({
          _id: 1,
          volunteer_id: 1,
          phone: { $concat: ['$phone_code', '$phone'] },
        })
        .lean();
      if (!helpRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //send sms to user
        const text = {
          phone: [helpRequest.phone],
          message: smsConfig.sms_block_help_request,
        };
        await this.commonService.sendTextMessage(
          text,
          this.request.originalUrl,
        );

        const msg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': blockRequestDto.reason },
        );
        const input: any = {
          title: mConfig.noti_title_block_help_request,
          type: 'help-request',
          requestId: helpRequest._id,
          categorySlug: 'help request',
          message: msg,
          userId: helpRequest.volunteer_id,
        };
        this.commonService.notification(input);

        return res.json({
          message: mConfig.Request_block,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/help-request/help-request.service.ts-blockRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for unblock help request
  public async unblockRequest(blockRequestDto: BlockRequestDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        blockRequestDto,
      );

      const updateData: any = {
        status: 'approve',
        unblock_reason: blockRequestDto.reason,
      };
      const helpRequest = await this.helpRequestModel
        .findByIdAndUpdate(
          { _id: ObjectID(blockRequestDto.id), status: 'blocked' },
          updateData,
          {
            new: true,
          },
        )
        .select({
          _id: 1,
          volunteer_id: 1,
          phone: { $concat: ['$phone_code', '$phone'] },
        })
        .lean();
      if (!helpRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //send sms to user
        const text = {
          phone: [helpRequest.phone],
          message: smsConfig.sms_unblock_help_request,
        };
        this.commonService.sendTextMessage(text, this.request.originalUrl);

        const msg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': blockRequestDto.reason },
        );
        const input: any = {
          title: mConfig.noti_title_unblock_help_request,
          type: 'help-request',
          requestId: helpRequest._id,
          categorySlug: 'help request',
          message: msg,
          userId: helpRequest.volunteer_id,
        };
        this.commonService.notification(input);

        return res.json({
          message: mConfig.Request_unblock,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/help-request/help-request.service.ts-unblockRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for my task count
  public async myTask(res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const userData = this.request.user;
      const query: any = {
        volunteer_id: { $in: [ObjectID(userData._id)] },
        status: 'waiting_for_volunteer',
      };
      const helpRequestCount = await this.helpRequestModel.count(query).lean();

      const causeRequest: any = await this.causeRequestModel.aggregate([
        {
          $match: {
            volunteer_id: ObjectID(userData._id),
            is_deleted: { $ne: true },
            category_slug: { $ne: 'hunger' },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const requests = [];
      if (!_.isEmpty(causeRequest)) {
        causeRequest.map(async (req) => {
          requests[req._id] = req.count;
        });
      }

      const waiting = requests['waiting_for_volunteer'] || 0;
      const accept = requests['volunteer_accept'] || 0;
      const result = [
        {
          id: 1,
          icons: 'Fundraiser-Approval',
          count: waiting + accept || 0,
          taskTitle: 'Fundraiser Approval',
          slug: 'fundraiser_approval',
          display: true,
        },
        {
          id: 2,
          icons: 'Re-verification',
          count: requests['reverify'] || 0,
          taskTitle: 'Re-verification',
          slug: 're_verification',
          display: true,
        },
        {
          id: 3,
          icons: 'On-going-Fundraiser',
          count: requests['approve'] || 0,
          taskTitle: 'On-going Fundraiser',
          slug: 'on_going_fundraiser',
          display: true,
        },
        {
          id: 4,
          icons: 'Closed-Fund',
          count: requests['complete'] || 0,
          taskTitle: 'Closed Fundraiser',
          slug: 'closed_fundraiser',
          display: true,
        },
        // {
        //   id: 5,
        //   icons: 'Manage-Drives',
        //   count: 16,
        //   taskTitle: 'Manage Drives',
        //   slug: 'manage_drives',
        // display:true
        // },
        {
          id: 6,
          icons: 'Help-Request',
          count: helpRequestCount,
          taskTitle: 'Help Request',
          slug: 'help_request',
          display: true,
        },
      ];

      return res.send({
        success: true,
        data: result,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/help-request/help-request.service.ts-myTask',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
