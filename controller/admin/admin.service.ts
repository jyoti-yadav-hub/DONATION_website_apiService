/* eslint-disable prettier/prettier */
import md5 from 'md5';
import _ from 'lodash';
import moment from 'moment';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { REQUEST } from '@nestjs/core';
import {
  RequestDocument,
  RequestModel,
} from '../request/entities/request.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { ChangeFCMDto } from './dto/change-FCM.dto';
import { authConfig } from '../../config/auth.config';
import { LoginAdminDto } from './dto/login-admin.dto';
import mConfig from '../../config/message.config.json';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CommonService } from '../../common/common.service';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
import { Fund, FundDocument } from '../fund/entities/fund.entity';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Admin, AdminDocument } from './entities/admin.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { adminToken, adminTokenDocument } from './entities/adminToken.entity';
import { CheckEmailDto } from './dto/check-email.dto';
import { BlockRequestDto } from './dto/block-request.dto';
import nodemailer from 'nodemailer';
import {
  Notification,
  NotificationDocument,
} from '../notification/entities/notification.entity';
import {
  TransactionModel,
  TransactionDocument,
} from '../donation/entities/transaction.entity';
import { NGOService } from '../ngo/ngo.service';
import { LogService } from 'src/common/log.service';

const ObjectID = require('mongodb').ObjectID;
const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
@Injectable()
export class AdminService {
  constructor(
    private readonly commonService: CommonService,
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    @InjectModel(Ngo.name)
    private ngoModel: Model<NgoDocument>,
    @InjectModel(Fund.name)
    private fundModel: Model<FundDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(adminToken.name)
    private adminTokenModel: Model<adminTokenDocument>,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private readonly errorlogService: ErrorlogService,
    private readonly ngoService: NGOService,
  ) {}

  // Api for create admin credential
  public async create(
    createAdminDto: CreateAdminDto,
    res: any,
  ): Promise<Admin> {
    try {
      const adminData = this.request.user;
      createAdminDto.createdBy = adminData.name;
      createAdminDto.updatedBy = adminData.name;
      const pwd = createAdminDto.password;
      //encrypt password
      createAdminDto.password = bcrypt.hashSync(createAdminDto.password, 8);

      const createAdmin = new this.adminModel(createAdminDto);
      const result = await createAdmin.save();

      //send email to user
      const input = {
        to: createAdminDto.email,
        subject: 'Saayam added you as Admin',
        message: `Hello ${createAdminDto.name}, Saayam team added you in Saayam as a Admin. Now you can manage saayam admin. Here your saayam email and password, Email: ${createAdminDto.email} Password:${pwd}`,
      };
      await this.commonService.sendMail(input, this.request.originalUrl);

      //Add admin activity log
      const logData = {
        action: 'create',
        entity_id: result._id,
        entity_name: 'Create Admin',
        description: 'New Admin has been created successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Admin_created,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for admin login
  public async login(loginAdminDto: LoginAdminDto, res: any): Promise<any> {
    try {
      const hashedpass = loginAdminDto.password;
      const admin: any = await this.adminModel
        .findOne({
          email: loginAdminDto.email,
        })
        .lean();

      if (!admin) {
        return res.json({
          message: mConfig.Email_or_Password_wrong,
          success: false,
        });
      } else {
        //compare password
        bcrypt.compare(hashedpass, admin.password, function (err, same) {
          if (same) {
            //generate auth token
            const token = jwt.sign({ id: admin._id }, process.env.secret, {
              expiresIn: 86400,
            });

            return res.status(200).json({
              success: true,
              data: {
                user: {
                  _id: admin._id,
                  email: admin.email,
                  name: admin.name,
                  image: _.isNull(admin.image)
                    ? admin.image
                    : authConfig.imageUrl + 'admin/' + admin.image,
                  createdAt: admin.createdAt,
                  updatedAt: admin.updatedAt,
                },
                token: token,
              },
              message: mConfig.Login_successful,
            });
          } else {
            return res.json({
              success: false,
              message: mConfig.Password_did_not_match,
            });
          }
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-login',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get user from given id
  public async findById(id: string): Promise<any> {
    try {
      //find admin
      const admin = await this.adminModel
        .findOne({ _id: id })
        .select({ password: 0 })
        .lean();
      if (admin && admin.image && !_.isEmpty(admin.image)) {
        //attach url with image
        admin.image = authConfig.imageUrl + 'admin/' + admin.image;
      }
      return admin;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-findById',
        id,
      );
      return error;
    }
  }

  //Api for update admin profile
  public async update(
    id: string,
    updateAdminDto: UpdateAdminDto,
    res: any,
  ): Promise<Admin> {
    try {
      const adminData = this.request.user;
      // Find the existing admin by ID
      const existAdmin = await this.adminModel
        .findById(id, { _id: 1, image: 1, email: 1 })
        .lean();
      if (!existAdmin) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        // Check if the updated email already exists
        if (updateAdminDto.email && !_.isUndefined(updateAdminDto.email)) {
          const query = {
            _id: {
              $ne: ObjectID(id),
            },
            email: updateAdminDto.email,
          };
          const admin = await this.adminModel
            .findOne(query, { _id: 1, image: 1, email: 1 })
            .lean();
          if (admin) {
            return res.json({
              message: mConfig.email_exist,
              success: false,
            });
          }
        }
        // Upload the admin's image to S3
        await this.commonService.uploadFileOnS3(updateAdminDto.image, 'admin');

        // Remove the existing image from S3 if upload new image or remove image
        if (
          updateAdminDto.removeFile ||
          (!_.isEmpty(updateAdminDto.image) && !_.isEmpty(existAdmin.image))
        ) {
          await this.commonService.s3ImageRemove('admin', existAdmin.image);
        }

        const dtl = {
          name: updateAdminDto.name,
          email: updateAdminDto.email,
          role: updateAdminDto.role,
          updatedBy: adminData.name,
          image: updateAdminDto.image
            ? updateAdminDto.image
            : updateAdminDto.removeFile
            ? null
            : existAdmin.image,
        };

        const result = await this.adminModel
          .findByIdAndUpdate({ _id: id }, dtl, { new: true })
          .select({ password: 0 })
          .lean();

        //Attach image url
        result.image = _.isNull(result.image)
          ? result.image
          : authConfig.imageUrl + 'admin/' + result.image;

        // Send a notification to the admin
        const input: any = {
          title: mConfig.noti_title_admin_profile_updated,
          message: mConfig.noti_msg_admin_profile_updated,
          type: 'profile',
        };
        this.commonService.sendAdminNotification(input, true);

        //Add an activity log
        const logData = {
          action: 'update',
          entity_id: result._id,
          entity_name: 'Admin Profile Update',
          description: `${result.name} profile has been updated successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Profile_updated,
          success: true,
          data: result,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for admin list for Admin
  public async findAll(param, res: any): Promise<Admin[]> {
    try {
      const match = { is_deleted: { $ne: true } };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        if (!_.isUndefined(filter.name) && filter.name) {
          //filter function return mongodb query
          const query = await this.commonService.filter(
            'contains',
            filter.name,
            'name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.email) && filter.email) {
          const query = await this.commonService.filter(
            'contains',
            filter.email,
            'email',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.image) && filter.image) {
          const query = await this.commonService.filter(
            'contains',
            filter.image,
            'image',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.role) && filter.role) {
          const query = await this.commonService.filter(
            'contains',
            filter.role,
            'role',
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

        //For perform global search
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'name',
            'email',
            'image',
            'role',
            'createdAt',
            'createdBy',
            'updatedBy',
            'updatedAt',
          ];
          //This function perform filter in all fields and return query
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
        _id: '_id',
        email: 'email',
        name: 'name',
        image: 'image',
        role: 'role',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      };

      //Find total count of records
      const total = await this.adminModel
        .aggregate([{ $match: match }, { $count: 'count' }])
        .exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      //This function will calculate pagination
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

      //Find data with specific condition
      const data = await this.adminModel.aggregate(
        [
          { $match: match },
          { $sort: sort },
          {
            $project: {
              name: 1,
              image: {
                $concat: [authConfig.imageUrl, 'admin/', '$image'],
              },
              email: 1,
              role: 1,
              createdBy: 1,
              updatedBy: 1,
              createdAt: 1,
              updatedAt: 1,
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
        'src/controller/admin/admin.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete admin
  public async remove(id: string, res: any): Promise<Admin> {
    try {
      const admin = await this.adminModel
        .findByIdAndUpdate({ _id: id }, { is_deleted: true }, { new: true })
        .select({ _id: 1 })
        .lean();
      if (!admin) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      return res.json({
        message: mConfig.Admin_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for forget password
  public async forgetPassword(
    forgetPasswordDto: ForgetPasswordDto,
    res: any,
  ): Promise<Admin> {
    try {
      //Find admin from email
      const admin = await this.adminModel
        .findOne(
          { email: forgetPasswordDto.email },
          { _id: 1, expired_at: 1, email: 1 },
        )
        .lean();

      if (!admin) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        // If the expiration time of token is greater than or equal to the current time token is still valid
        if (admin.expired_at >= parseInt(moment().format('X'))) {
          return res.json({
            message: mConfig.Send_mail_for_reset_password,
            success: true,
          });
        } else {
          //Generate new token
          const token = md5(Math.floor(Math.random() * Math.floor(999999)));
          const link = process.env.ADMIN_URL + 'reset-password/' + token;

          const data = {
            token: token,
            expired_at: parseInt(moment().add(5, 'minutes').format('X')),
          };
          await this.adminModel
            .findByIdAndUpdate({ _id: admin._id }, data, { new: true })
            .select({ _id: 1 })
            .lean();

          // Send the reset password email to the admin.
          const msg = await this.commonService.changeString(
            mConfig.Forgot_password_email_msg,
            { '{{link}}': link },
          );

          const input = {
            to: admin.email,
            subject: mConfig.Forgot_password_email_subject,
            message: msg,
          };

          await this.commonService.sendMail(input, this.request.originalUrl);

          return res.json({
            message: mConfig.Send_mail_for_reset_password,
            success: true,
            link: link,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-forgetPassword',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for reset password
  public async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    res: any,
  ): Promise<Admin> {
    try {
      //Find admin from token
      const checkToken = await this.adminModel
        .findOne({ token: resetPasswordDto.token }, { _id: 1, expired_at: 1 })
        .lean();
      if (!checkToken) {
        return res.json({
          message: mConfig.Token_is_invalid,
          success: false,
        });
      } else {
        // If the expiration time of token is less than or equal to the current time then token is expired
        if (checkToken.expired_at <= parseInt(moment().format('X'))) {
          return res.json({
            message: mConfig.Link_expired,
            success: false,
          });
        } else {
          //Encypt password and update new password
          const data = {
            password: bcrypt.hashSync(resetPasswordDto.password, 8),
            $unset: {
              token: 1,
              expired_at: 1,
            },
          };
          await this.adminModel
            .findByIdAndUpdate({ _id: checkToken._id }, data, { new: true })
            .select({ _id: 1 })
            .lean();
          return res.json({
            message: mConfig.Password_updated,
            success: true,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-resetPassword',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for change password
  public async changePassword(
    changePasswordDto: ChangePasswordDto,
    res: any,
  ): Promise<Admin> {
    try {
      //Find admin from id
      const hashedOldPass = changePasswordDto.oldPassword;
      const admin = await this.adminModel
        .findById(this.request.user.id, { _id: 1, password: 1 })
        .lean();
      if (!admin) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        //compare a hashed password with a stored password
        const passwordMatch = await bcrypt.compare(
          hashedOldPass,
          admin.password,
        );

        if (passwordMatch) {
          //Update new password
          const updateData = {
            password: bcrypt.hashSync(changePasswordDto.newPassword, 8),
          };
          const result: any = await this.adminModel
            .updateOne({ _id: admin._id }, updateData, { new: true })
            .lean();
          if (result) {
            //Add Activity Log
            const logData = {
              action: 'update',
              entity_id: result._id,
              entity_name: 'Admin Change Password',
              description: `${result.name} password has been changed successfully.`,
            };
            this.logService.createAdminLog(logData);

            return res.json({
              message: mConfig.Password_changed,
              success: true,
            });
          } else {
            return res.json({
              message: mConfig.Something_went_wrong,
              success: false,
            });
          }
        } else {
          return res.json({
            success: false,
            message: mConfig.Old_password_incorrect,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-changePassword',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for admin dashboard
  public async getAdminDashboard(res: any): Promise<Admin> {
    try {
      //Grouping request with category and find it's total
      const findData = await this.requestModel.aggregate([
        {
          $match: {
            status: {
              $ne: 'draft',
            },
            is_deleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: { category: '$category_slug', status: '$status' },
            list: {
              $sum: 1,
            },
          },
        },
        {
          $group: {
            _id: '$_id.category',
            request_list: {
              $push: {
                status: '$_id.status',
                count: '$list',
              },
            },
            total_request: { $sum: '$list' },
          },
        },
      ]);
      const data: any = {};
      await findData.map(async (item: any) => {
        if (item._id == 'hunger') {
          const hunger_data: any = {
            totalPendingHunger: 0,
            totalDonorAcceptHunger: 0,
            totalWaitingForVolunteerHunger: 0,
            totalVolunteerAcceptHunger: 0,
            totalPickupHunger: 0,
            totalDeliveredHunger: 0,
            totalCancelledHunger: 0,
            totalHungerCount: item.total_request,
          };

          await item.request_list.map(async (item2: any) => {
            if (item2.status == 'pending') {
              hunger_data.totalPendingHunger = item2.count;
            } else if (item2.status == 'donor_accept') {
              hunger_data.totalDonorAcceptHunger = item2.count;
            } else if (item2.status == 'volunteer_accept') {
              hunger_data.totalVolunteerAcceptHunger = item2.count;
            } else if (item2.status == 'cancelled') {
              hunger_data.totalCancelledHunger = item2.count;
            } else if (item2.status == 'pickup') {
              hunger_data.totalPickupHunger = item2.count;
            } else if (item2.status == 'delivered') {
              hunger_data.totalDeliveredHunger = item2.count;
            } else if (item2.status == 'waiting_for_volunteer') {
              hunger_data.totalWaitingForVolunteerHunger = item2.count;
            }
          });
          data.hunger = hunger_data;
        } else if (item._id == 'fundraiser') {
          const fundraiser_data: any = {
            totalPendingFundraiser: 0,
            totalApproveFundraiser: 0,
            totalRejectFundraiser: 0,
            totalReverifyFundraiser: 0,
            totalCompleteFundraiser: 0,
            totalExpiredFundraiser: 0,
            totalFundraiserCount: item.total_request,
          };

          await item.request_list.map(async (item2: any) => {
            if (item2.status == 'pending') {
              fundraiser_data.totalPendingFundraiser = item2.count;
            } else if (item2.status == 'approve') {
              fundraiser_data.totalApproveFundraiser = item2.count;
            } else if (item2.status == 'reject') {
              fundraiser_data.totalRejectFundraiser = item2.count;
            } else if (item2.status == 'reverify') {
              fundraiser_data.totalReverifyFundraiser = item2.count;
            } else if (item2.status == 'complete') {
              fundraiser_data.totalCompleteFundraiser = item2.count;
            } else if (item2.status == 'expired') {
              fundraiser_data.totalExpiredFundraiser = item2.count;
            }
          });
          data.fundraiser = fundraiser_data;
        } else if (item._id == 'health') {
          const health_data = {
            totalPendingHealth: 0,
            totalApproveHealth: 0,
            totalRejectHealth: 0,
            totalReverifyHealth: 0,
            totalCompleteHealth: 0,
            totalExpiredHealth: 0,
            totalHealthCount: item.total_request,
          };

          await item.request_list.map(async (item2: any) => {
            if (item2.status == 'pending') {
              health_data.totalPendingHealth = item2.count;
            } else if (item2.status == 'approve') {
              health_data.totalApproveHealth = item2.count;
            } else if (item2.status == 'reject') {
              health_data.totalRejectHealth = item2.count;
            } else if (item2.status == 'reverify') {
              health_data.totalReverifyHealth = item2.count;
            } else if (item2.status == 'complete') {
              health_data.totalCompleteHealth = item2.count;
            } else if (item2.status == 'expired') {
              health_data.totalExpiredHealth = item2.count;
            }
          });
          data.health = health_data;
        } else if (item._id == 'education') {
          const education_data: any = {
            totalPendingEducation: 0,
            totalApproveEducation: 0,
            totalRejectEducation: 0,
            totalReverifyEducation: 0,
            totalCompleteEducation: 0,
            totalExpiredEducation: 0,
            totalEducationCount: item.total_request,
          };

          await item.request_list.map(async (item2: any) => {
            if (item2.status == 'pending') {
              education_data.totalPendingEducation = item2.count;
            } else if (item2.status == 'approve') {
              education_data.totalApproveEducation = item2.count;
            } else if (item2.status == 'reject') {
              education_data.totalRejectEducation = item2.count;
            } else if (item2.status == 'reverify') {
              education_data.totalReverifyEducation = item2.count;
            } else if (item2.status == 'complete') {
              education_data.totalCompleteEducation = item2.count;
            } else if (item2.status == 'expired') {
              education_data.totalExpiredEducation = item2.count;
            }
          });
          data.education = education_data;
        }
      });
      const group1 = {
        $group: {
          _id: null,
          userCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $eq: ['$is_deleted', false] }],
                },
                1,
                0,
              ],
            },
          },
          normalUserCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$is_deleted', false] },
                    { $eq: ['$is_user', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          donorCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$is_deleted', false] },
                    { $eq: ['$is_donor', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          volunteerCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$is_deleted', false] },
                    { $eq: ['$is_volunteer', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      };

      const match = {
        $match: {
          status: { $ne: 'draft' },
          is_deleted: { $ne: true },
        },
      };
      const grp = {
        $group: {
          _id: '$status',
          count: {
            $sum: 1,
          },
        },
      };
      //find fund data
      const fundRes = await this.fundModel.aggregate([match, grp]).exec();
      let fund: any = {
        totalPendingFund: 0,
        totalApproveFund: 0,
        totalRejectFund: 0,
        totalCancelFund: 0,
        totalBlockFund: 0,
      };
      let fund_total_count = 0;
      await fundRes.map(async (item: any) => {
        if (item._id == 'pending') {
          fund.totalPendingFund = item.count;
          fund_total_count = fund_total_count + item.count;
        } else if (item._id == 'approve') {
          fund.totalApproveFund = item.count;
          fund_total_count = fund_total_count + item.count;
        } else if (item._id == 'reject') {
          fund.totalRejectFund = item.count;
          fund_total_count = fund_total_count + item.count;
        } else if (item._id == 'cancelled') {
          fund.totalCancelFund = item.count;
          fund_total_count = fund_total_count + item.count;
        } else if (item._id == 'blocked') {
          fund.totalBlockFund = item.count;
          fund_total_count = fund_total_count + item.count;
        }
      });
      fund.totalFund = fund_total_count;
      data.fund = fund;

      //find donor,volunteer,benificiary and user count
      const resp1 = await this.userModel.aggregate([group1]).exec();
      if (_.isArray(resp1) && !_.isUndefined(resp1[0])) {
        const data1 = resp1[0];
        data.totalnormalUserCount = data1.normalUserCount;
        data.totalDonorCount = data1.donorCount;
        data.totalVolunteerCount = data1.volunteerCount;
        data.totalUserCount = data1.userCount;
      } else {
        data.totalnormalUserCount = 0;
        data.totalDonorCount = 0;
        data.totalVolunteerCount = 0;
        data.totalUserCount = 0;
      }
      //find total ngo count
      data.totalNgoCount = await this.ngoModel
        .count({
          $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }],
        })
        .lean();

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-getAdminDashboard',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for set admin fcm token
  public async changeFCM(changeFCMDto: ChangeFCMDto, res: any): Promise<Admin> {
    try {
      //Find admin by id
      const admin = await this.adminModel
        .findById(this.request.user.id)
        .select({ password: 0 })
        .lean();
      if (!admin) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const query = {
          admin_id: this.request.user.id,
          fcm_token: changeFCMDto.token,
        };

        let result: any = await this.adminTokenModel
          .find(query)
          .select({ _id: 1, fcm_token: 1 })
          .lean();
        if (_.isEmpty(result)) {
          //Create new token
          const createAdminToken = new this.adminTokenModel(query);
          result = await createAdminToken.save();
        }
        admin.fcm_token = result.fcm_token;
        return res.json({
          success: true,
          message: mConfig.Fcm_added,
          data: admin,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-changeFCM',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for logout admin
  public async logout(uuid: string, res: any): Promise<User> {
    try {
      await this.adminTokenModel
        .findOneAndDelete({ fcm_token: uuid }, { _id: 1 })
        .lean();

      return res.json({ success: true });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-logout',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for check email
  public async checkEmail(
    checkEmailDto: CheckEmailDto,
    res: any,
  ): Promise<User> {
    try {
      //Find admin from email if email already exist then throw error
      const query = {
        email: checkEmailDto.email,
      };
      if (checkEmailDto && checkEmailDto.id) {
        query['_id'] = { $ne: ObjectID(checkEmailDto.id) };
      }
      const admin = await this.adminModel.findOne(query).lean();
      if (admin) {
        return res.json({
          success: false,
          message: mConfig.email_exist,
        });
      } else {
        return res.json({
          success: true,
          message: mConfig.email_not_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-checkEmail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for block request when request is reported as spam
  public async blockRequest(blockRequestDto: BlockRequestDto, res: any) {
    try {
      //Find request from id
      const causeRequest: any = await this.requestModel
        .findById({ _id: blockRequestDto.id })
        .select({
          _id: 1,
          category_name: 1,
          reference_id: 1,
          category_slug: 1,
          user_ngo_id: 1,
          user_id: 1,
          status: 1,
          country_data: 1,
        })
        .lean();
      if (!causeRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //Update request status
        await this.requestModel
          .findByIdAndUpdate(
            { _id: causeRequest._id },
            { status: 'blocked', block_reason: blockRequestDto.reason },
          )
          .lean();
        //Delete user notifications related to that request
        await this.notificationModel
          .deleteMany({
            request_id: causeRequest._id,
          })
          .lean();
        const updateData = {
          '{{cause}}': causeRequest.category_name,
          '{{refId}}': causeRequest.reference_id,
        };
        const title = await this.commonService.changeString(
          mConfig.noti_title_block_request,
          updateData,
        );
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': blockRequestDto.reason },
        );

        //Send notification to request user
        const input: any = {
          title: title,
          type: causeRequest.category_slug,
          requestId: causeRequest._id,
          categorySlug: causeRequest.category_slug,
          message: msg,
          userId: causeRequest.user_id,
        };
        const requestUserIds = [causeRequest.user_id];
        await this.commonService.notification(input);
        //send notification to ngo user
        if (causeRequest.user_ngo_id) {
          const ngoUser = await this.commonService.getNgoUserIds(
            causeRequest.user_ngo_id,
            causeRequest.user_id,
          );
          if (ngoUser) {
            requestUserIds.push(ngoUser);
            input.userId = ngoUser;
            await this.commonService.notification(input);
          }
        }

        //send notifications to donors
        const transactions = await this.transactionModel
          .find({
            request_id: causeRequest._id,
            donor_id: {
              $nin: [causeRequest.user_ngo_id, causeRequest.user_id],
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

          input.title = mConfig.noti_title_spam_request;
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_spam_request,
            updateData,
          );
          input.message = msg;
          await this.commonService.sendAllNotification(donorsArray, input);
        }

        if (causeRequest.status === 'approve') {
          const blocktitle = await this.commonService.changeString(
            mConfig.noti_title_block_request_allusers,
            { '{{category}}': causeRequest.category_name },
          );

          input.title = blocktitle;
          input.message = msg;
          this.commonService.sendAllUsersNotification(
            requestUserIds,
            input,
            causeRequest.country_data.country,
            true,
          );
        }

        //Add Activity Log
        const logData = {
          action: 'block',
          request_id: causeRequest._id,
          entity_name: 'Request Block',
          description: `${causeRequest.category_name} Request has been blocked - ${causeRequest.reference_id}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Request_block,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-blockRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for block ngo when ngo is reported as spam
  public async blockNGO(blockRequestDto: BlockRequestDto, res: any) {
    try {
      //Find ngo by id and status
      const ngo: any = await this.ngoModel
        .findOne({
          _id: blockRequestDto.id,
          status: { $in: ['approve', 'waiting_for_verify', 'reject'] },
        })
        .lean();
      if (!ngo) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //Save ngo old data in ngo update table
        const query2 = {
          block_reason: blockRequestDto.reason,
        };
        await this.ngoService.saveNgoUpdatedData(ngo, query2);

        //Update status of ngo
        const query = {
          ngo_status: 'blocked',
          is_enable: false,
        };
        await this.ngoModel.findByIdAndUpdate({ _id: ngo._id }, query).lean();

        //Update status of ngo in user model
        await this.userModel
          .updateMany(
            { 'ngo_data._id': ngo._id, is_deleted: false },
            { $set: { 'ngo_data.ngo_status': 'blocked' } },
          )
          .lean();

        //Find requests of ngo change status and delete all notification related to that request
        const findRequest = await this.requestModel
          .find({ user_ngo_id: ObjectID(ngo._id) })
          .select({ _id: -1 })
          .lean();

        if (!_.isEmpty(findRequest)) {
          findRequest.map(async (item: any) => {
            await this.notificationModel
              .deleteMany({ request_id: item._id })
              .lean();
          });
        }

        await this.notificationModel
          .deleteMany({
            ngo_id: ngo._id,
          })
          .lean();

        const msg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': blockRequestDto.reason },
        );

        const input: any = {
          title: mConfig.noti_title_block_ngo,
          message: msg,
          type: 'ngo_spam_block',
          ngoId: ngo._id,
        };

        //Send notification to ngo trustee
        const ngoUsers = ngo?.trustees_name.map((item: any) => {
          return item._id;
        });

        if (ngoUsers) {
          await this.commonService.sendAllNotification(ngoUsers, input);
        }
        //send notifications to donors
        const transactions = await this.transactionModel
          .find({
            user_id: ngo._id,
            donor_id: {
              $ne: ngo._id,
            },
            transaction_type: 'ngo-donation',
            saayam_community: { $exists: false },
          })
          .select({ donor_user_id: 1 })
          .lean();

        if (!_.isEmpty(transactions)) {
          let donorsArray = transactions.map(function (obj) {
            return obj.donor_user_id;
          });
          donorsArray = [...new Set(donorsArray)];
          ngoUsers.push(...donorsArray);

          input.title = mConfig.noti_title_spam_NGO;
          input.type = 'donated_ngo_blocked';
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_spam_NGO,
            { '{{ngo_name}}': ngo?.form_data?.ngo_name },
          );
          input.message = msg;
          await this.commonService.sendAllNotification(donorsArray, input);
        }

        // //send notification to ngo users
        if (ngo.ngo_status === 'approve') {
          const title = await this.commonService.changeString(
            mConfig.noti_title_block_ngo_allusers,
            { '{{ngo_name}}': ngo?.form_data?.ngo_name },
          );
          input.title = title;
          input.message = msg;
          this.commonService.sendAllUsersNotification(
            ngoUsers,
            input,
            null,
            true,
          );
        }

        //Add Activity Log
        const logData = {
          action: 'block',
          ngo_id: ngo._id,
          entity_name: 'NGO Block',
          description: `NGO has been blocked - ${ngo?.form_data?.ngo_name}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.NGO_block,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-blockNGO',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for unblock request
  public async unblockRequest(blockRequestDto: BlockRequestDto, res: any) {
    try {
      //Find request from id,status
      const causeRequest: any = await this.requestModel
        .findById({
          _id: blockRequestDto.id,
          status: 'blocked',
          is_deleted: false,
        })
        .select({
          _id: 1,
          category_name: 1,
          reference_id: 1,
          category_slug: 1,
          user_ngo_id: 1,
          form_data: 1,
          user_id: 1,
          status: 1,
          country_data: 1,
        })
        .lean();
      if (!causeRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const expiredDate = moment(causeRequest.form_data.expiry_date).format(
          'X',
        );
        const today = moment().format('X');
        let status = 'approve';
        if (parseInt(expiredDate) < parseInt(today)) {
          status = 'expired';
        }

        //Update request status
        await this.requestModel
          .findByIdAndUpdate(
            { _id: causeRequest._id },
            { status: status, $unset: { block_reason: 1 } },
          )
          .lean();

        const updateData = {
          '{{category}}': causeRequest.category_name,
          '{{refId}}': causeRequest.reference_id,
          '{{status}}': status,
        };
        const title = await this.commonService.changeString(
          mConfig.noti_title_request_verify,
          updateData,
        );
        let msg = mConfig.noti_msg_request_approved;
        if (status == 'expired') {
          msg = mConfig.noti_msg_request_approved_but_expired;
        }

        //Send notification to request user
        const input: any = {
          title: title,
          type: causeRequest.category_slug,
          requestId: causeRequest._id,
          categorySlug: causeRequest.category_slug,
          message: msg,
          userId: causeRequest.user_id,
        };
        const requestUserIds = [causeRequest.user_id];
        await this.commonService.notification(input);
        //Send notification to ngo user
        if (causeRequest.user_ngo_id) {
          const ngoUser = await this.commonService.getNgoUserIds(
            causeRequest.user_ngo_id,
            causeRequest.user_id,
          );
          if (ngoUser) {
            requestUserIds.push(ngoUser);
            input.userId = ngoUser;
            await this.commonService.notification(input);
          }
        }

        //send notifications to donors
        const transactions = await this.transactionModel
          .find({
            request_id: causeRequest._id,
            donor_id: {
              $nin: [causeRequest.user_ngo_id, causeRequest.user_id],
            },
          })
          .select({ donor_user_id: 1 })
          .lean();

        if (!_.isEmpty(transactions)) {
          let donorsArray = transactions.map(function (obj) {
            return obj.donor_user_id;
          });
          donorsArray = [...new Set(donorsArray)];
          requestUserIds.push(...donorsArray);

          input.title = mConfig.noti_title_not_spam_request;
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_not_spam_request,
            updateData,
          );
          input.message = msg;
          await this.commonService.sendAllNotification(donorsArray, input);
        }

        if (causeRequest.status === 'blocked') {
          const unblocktitle = await this.commonService.changeString(
            mConfig.noti_title_unblock_request_allusers,
            { '{{category}}': causeRequest.category_name },
          );

          input.title = unblocktitle;
          input.message = msg;
          this.commonService.sendAllUsersNotification(
            requestUserIds,
            input,
            causeRequest.country_data.country,
            true,
          );
        }

        //Add Activity Log
        const logData = {
          action: 'unblock',
          request_id: causeRequest._id,
          entity_name: 'Request Unblock',
          description: `${causeRequest.category_name} Request has been unblocked - ${causeRequest.reference_id}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Request_unblock,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-unblockRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for block fund when fund is reported as spam
  public async blockfund(blockRequestDto: BlockRequestDto, res: any) {
    try {
      //Find fund by id and update status
      const fund: any = await this.fundModel
        .findByIdAndUpdate({ _id: blockRequestDto.id }, { status: 'blocked' })
        .select({ _id: 1, admins: 1, reference_id: 1 })
        .lean();
      if (!fund) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const reson = blockRequestDto?.reason
          ? blockRequestDto?.reason
          : 'Many users reported in this fund.';
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': reson },
        );

        const input: any = {
          title: mConfig.noti_title_block_fund,
          message: msg,
          type: 'fund',
          fundId: fund._id,
        };

        const allAdminIds = [];
        //Finf fund admins and send notifications
        await fund.admins.map((admin) => {
          const admin_id = admin.user_id.toString();
          if (admin.is_deleted != true) {
            allAdminIds.push(admin_id);
          }
        });

        if (allAdminIds) {
          await this.commonService.sendAllNotification(allAdminIds, input);
        }

        //Add Activity Log
        const logData = {
          action: 'block',
          fund_id: fund._id,
          entity_name: 'Block Fund',
          description: `Fund has been blocked - ${fund.reference_id}.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Fund_block,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-blockfund',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for unblock fund
  public async unblockFund(blockRequestDto: BlockRequestDto, res: any) {
    try {
      //Find fund by id and status
      const fund: any = await this.fundModel
        .findById({
          _id: blockRequestDto.id,
          status: 'blocked',
          is_deleted: false,
        })
        .select({
          _id: 1,
          reference_id: 1,
          form_data: 1,
          user_id: 1,
          status: 1,
          admins: 1,
          country_data: 1,
        })
        .lean();
      if (!fund) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //Update fund status
        await this.fundModel
          .findByIdAndUpdate(
            { _id: fund._id },
            { status: 'approve', $unset: { block_reason: 1 } },
          )
          .lean();

        const updateData = {
          '{{fund_name}}': fund.form_data.title_of_fundraiser,
        };
        const title = await this.commonService.changeString(
          mConfig.noti_title_fund_unblock,
          updateData,
        );

        const input: any = {
          title: title,
          type: 'fund',
          fundId: fund._id,
          message: mConfig.noti_msg_fund_unblock,
          // userId: fund.user_id,
        };

        const allAdminIds = [];
        //Find fund admins and send notification
        await fund.admins.map((admin) => {
          const admin_id = admin.user_id.toString();
          if (admin.is_deleted != true) {
            allAdminIds.push(admin_id);
          }
        });
        if (allAdminIds) {
          await this.commonService.sendAllNotification(allAdminIds, input);
        }

        //Add Activity Log
        const logData = {
          action: 'unblock',
          fund_id: fund._id,
          entity_name: 'Unblock Fund',
          description: `Fund has been unblocked - ${fund.reference_id}.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Fund_unblock,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/admin/admin.service.ts-unblockFund',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  async ngoDynamicChanges(dynamicForm, res: any) {
    try {
      const ngoList = await this.ngoModel
        .find({
          form_settings: { $exists: false },
          phone_country_short_name: { $eq: 'IN' },
        })
        .select({ dashboard_data: 0, trustees_name: 0, my_request: 0 })
        .lean();

      Promise.all(
        ngoList.map(async (ngoItem: any) => {
          const data = JSON.parse(dynamicForm);
          const formData: any = {
            form_data: {
              files: {},
            },
          };
          data.map(async (item: any, mainIndex: number) => {
            const inputs = item.inputs;

            inputs.map(async (input: any, inputIndex: number) => {
              if (
                input.input_slug === 'ngo_cover_photo' &&
                ngoItem?.ngo_cover_image &&
                !_.isEmpty(ngoItem?.ngo_cover_image) &&
                ngoItem?.ngo_cover_image != ''
              ) {
                data[mainIndex].inputs[inputIndex].value = [
                  ngoItem.ngo_cover_image,
                ];
                const parts = ngoItem?.ngo_cover_image?.split('.');
                const fileExtension = parts[parts.length - 1];
                const fields = ngoItem?.ngo_cover_image?.indexOf('-');
                const reactImage = ngoItem?.ngo_cover_image?.slice(fields + 1);
                data[mainIndex].inputs[inputIndex].images = [
                  {
                    OriginalName: ngoItem?.ngo_cover_image,
                    mime:
                      fileExtension == 'jpeg' || fileExtension == 'JPEG'
                        ? 'image/jpeg'
                        : fileExtension == 'jpg' || fileExtension == 'JPG'
                        ? 'image/jpg'
                        : fileExtension == 'pdf' || fileExtension == 'PDF'
                        ? 'application/pdf'
                        : 'image/png',
                    path: `file:///data/user/0/com.app.saayam/cache/react-native-image-crop-picker/${reactImage}`,
                    server: true,
                  },
                ];
                formData.form_data.files[input.input_slug] = [
                  ngoItem.ngo_cover_image,
                ];
              } else if (
                input.input_slug === 'ngo_name' &&
                !_.isEmpty(ngoItem?.ngo_name)
              ) {
                data[mainIndex].inputs[inputIndex].value = ngoItem?.ngo_name;
                formData.form_data[input.input_slug] = ngoItem?.ngo_name;
              } else if (
                input.input_slug === 'first_name' &&
                !_.isEmpty(ngoItem?.first_name)
              ) {
                data[mainIndex].inputs[inputIndex].value = ngoItem?.first_name;
                formData.form_data[input.input_slug] = ngoItem?.first_name;
              } else if (
                input.input_slug === 'last_name' &&
                !_.isEmpty(ngoItem?.last_name)
              ) {
                data[mainIndex].inputs[inputIndex].value = ngoItem?.last_name;
                formData.form_data[input.input_slug] = ngoItem?.last_name;
              } else if (
                input.input_slug === 'ngo_address' &&
                !_.isEmpty(ngoItem?.ngo_location)
              ) {
                data[mainIndex].inputs[inputIndex].value = {
                  longitude: ngoItem?.ngo_location.coordinates[0],
                  latitude: ngoItem?.ngo_location.coordinates[1],
                  city: ngoItem?.ngo_location.city,
                  country: 'United States',
                  slug: 'useEffect',
                };
                formData[input.input_slug] = ngoItem?.ngo_location;
              } else if (
                input.input_slug === 'registration_certificate_number' &&
                !_.isEmpty(ngoItem?.ngo_registration_number)
              ) {
                data[mainIndex].inputs[inputIndex].value =
                  ngoItem?.ngo_registration_number;
                formData.form_data[input.input_slug] =
                  ngoItem?.ngo_registration_number;
              } else if (
                input.input_slug === 'ngo_mobile_number' &&
                ngoItem.ngo_phone
              ) {
                data[mainIndex].inputs[inputIndex].value = {
                  short_name: ngoItem?.phone_country_short_name,
                  countryCodeD: ngoItem?.ngo_phone_code,
                  phoneNumber: ngoItem?.ngo_phone,
                  phone_country_full_name: ngoItem?.phone_country_full_name,
                };
                formData.form_data[input.input_slug] = {
                  short_name: ngoItem?.phone_country_short_name,
                  countryCodeD: ngoItem?.ngo_phone_code,
                  phoneNumber: ngoItem?.ngo_phone,
                  phone_country_full_name: ngoItem?.phone_country_full_name,
                };
              } else if (input.input_slug === 'secondary_mobile_number') {
                data[mainIndex].inputs[inputIndex].value = {
                  short_name: ngoItem?.secondary_country_short_name || 'IN',
                  countryCodeD: ngoItem?.secondary_phone_code || '+91',
                  phoneNumber: ngoItem?.secondary_phone,
                  phone_country_full_name:
                    ngoItem?.secondary_country_full_name || 'India',
                };
                formData.form_data[input.input_slug] = {
                  short_name: ngoItem?.secondary_country_short_name,
                  countryCodeD: ngoItem?.secondary_phone_code,
                  phoneNumber: ngoItem?.secondary_phone,
                  phone_country_full_name: ngoItem?.secondary_country_full_name,
                };
              } else if (
                input.input_slug === 'website_link' &&
                ngoItem.website_link &&
                !_.isEmpty(ngoItem?.website_link)
              ) {
                data[mainIndex].inputs[inputIndex].value = ngoItem.website_link;
                formData.form_data[input.input_slug] = ngoItem.website_link;
              } else if (
                input.input_slug === 'ngo_email' &&
                ngoItem.ngo_email
              ) {
                data[mainIndex].inputs[inputIndex].value = ngoItem.ngo_email;
                formData.form_data[input.input_slug] = ngoItem.ngo_email;
              } else if (
                input.input_slug === 'expiry_date' &&
                ngoItem?.expiry_date
              ) {
                const date = new Date(ngoItem.expiry_date);
                const outputTimestamp = date.toISOString();
                data[mainIndex].inputs[inputIndex].value = outputTimestamp;
                formData.form_data[input.input_slug] = outputTimestamp;
              } else if (
                input.input_slug === 'about_your_ngo' &&
                ngoItem?.about_us &&
                !_.isEmpty(ngoItem?.about_us)
              ) {
                data[mainIndex].inputs[inputIndex].value = ngoItem.about_us;
                formData.form_data[input.input_slug] = ngoItem.about_us;
              } else if (
                input.input_slug === 'upload_registration_document' &&
                ngoItem?.ngo_certificate &&
                !_.isEmpty(ngoItem?.ngo_certificate) &&
                ngoItem?.ngo_certificate !== ''
              ) {
                data[mainIndex].inputs[inputIndex].value = [
                  ngoItem.ngo_certificate,
                ];
                const parts = ngoItem?.ngo_certificate?.split('.');
                const fileExtension = parts[parts.length - 1];
                const fields = ngoItem?.ngo_certificate?.indexOf('-');
                const reactImage = ngoItem?.ngo_certificate?.slice(fields + 1);
                data[mainIndex].inputs[inputIndex].images = [
                  {
                    OriginalName: ngoItem?.ngo_certificate,
                    mime:
                      fileExtension == 'jpeg' || fileExtension == 'JPEG'
                        ? 'image/jpeg'
                        : fileExtension == 'jpg' || fileExtension == 'JPG'
                        ? 'image/jpg'
                        : fileExtension == 'pdf' || fileExtension == 'PDF'
                        ? 'application/pdf'
                        : 'image/png',
                    path: `file:///data/user/0/com.app.saayam/cache/react-native-image-crop-picker/${reactImage}`,
                    server: true,
                  },
                ];
                formData.form_data.files[input.input_slug] = [
                  ngoItem.ngo_certificate,
                ];
              } else if (
                input.input_slug === 'ngo_deed' &&
                ngoItem?.ngo_deed &&
                !_.isEmpty(ngoItem?.ngo_deed) &&
                ngoItem?.ngo_deed !== ''
              ) {
                data[mainIndex].inputs[inputIndex].value = [ngoItem.ngo_deed];
                const parts = ngoItem?.ngo_deed?.split('.');
                const fileExtension = parts[parts.length - 1];
                const fields = ngoItem?.ngo_deed?.indexOf('-');
                const reactImage = ngoItem?.ngo_deed?.slice(fields + 1);
                data[mainIndex].inputs[inputIndex].images = [
                  {
                    OriginalName: ngoItem?.ngo_deed,
                    mime:
                      fileExtension == 'jpeg' || fileExtension == 'JPEG'
                        ? 'image/jpeg'
                        : fileExtension == 'jpg' || fileExtension == 'JPG'
                        ? 'image/jpg'
                        : fileExtension == 'pdf' || fileExtension == 'PDF'
                        ? 'application/pdf'
                        : 'image/png',
                    path: `file:///data/user/0/com.app.saayam/cache/react-native-image-crop-picker/${reactImage}`,
                    server: true,
                  },
                ];
                formData.form_data.files[input.input_slug] = [ngoItem.ngo_deed];
              } else if (
                input.input_slug === '12a_certificates' ||
                (input.input_slug === '80g_certificates' &&
                  ngoItem?.upload_12A_80G_certificate)
              ) {
                data[mainIndex].inputs[inputIndex].value = false;
                formData.form_data[input.input_slug] = false;
              } else if (
                input.input_slug === 'upload_12a_registration_document' &&
                ngoItem?.ngo_12A_certificate &&
                !_.isEmpty(ngoItem?.ngo_12A_certificate) &&
                ngoItem?.ngo_12A_certificate !== ''
              ) {
                data[mainIndex].inputs[inputIndex].value = [
                  ngoItem.ngo_12A_certificate,
                ];
                const parts = ngoItem?.ngo_12A_certificate?.split('.');
                const fileExtension = parts[parts.length - 1];
                const fields = ngoItem?.ngo_12A_certificate?.indexOf('-');
                const reactImage = ngoItem?.ngo_12A_certificate?.slice(
                  fields + 1,
                );
                data[mainIndex].inputs[inputIndex].images = [
                  {
                    OriginalName: ngoItem?.ngo_12A_certificate,
                    mime:
                      fileExtension == 'jpeg' || fileExtension == 'JPEG'
                        ? 'image/jpeg'
                        : fileExtension == 'jpg' || fileExtension == 'JPG'
                        ? 'image/jpg'
                        : fileExtension == 'pdf' || fileExtension == 'PDF'
                        ? 'application/pdf'
                        : 'image/png',
                    path: `file:///data/user/0/com.app.saayam/cache/react-native-image-crop-picker/${reactImage}`,
                    server: true,
                  },
                ];
                formData.form_data.files[input.input_slug] = [
                  ngoItem.ngo_12A_certificate,
                ];
              } else if (
                input.input_slug === 'upload_80g_registration_document' &&
                ngoItem?.ngo_80G_certificate &&
                !_.isEmpty(ngoItem?.ngo_80G_certificate) &&
                ngoItem?.ngo_80G_certificate !== ''
              ) {
                data[mainIndex].inputs[inputIndex].value = [
                  ngoItem.ngo_80G_certificate,
                ];
                const parts = ngoItem?.ngo_80G_certificate?.split('.');
                const fileExtension = parts[parts.length - 1];
                const fields = ngoItem?.ngo_80G_certificate?.indexOf('-');
                const reactImage = ngoItem?.ngo_80G_certificate?.slice(
                  fields + 1,
                );
                data[mainIndex].inputs[inputIndex].images = [
                  {
                    OriginalName: ngoItem?.ngo_80G_certificate,
                    mime:
                      fileExtension == 'jpeg' || fileExtension == 'JPEG'
                        ? 'image/jpeg'
                        : fileExtension == 'jpg' || fileExtension == 'JPG'
                        ? 'image/jpg'
                        : fileExtension == 'pdf' || fileExtension == 'PDF'
                        ? 'application/pdf'
                        : 'image/png',
                    path: `file:///data/user/0/com.app.saayam/cache/react-native-image-crop-picker/${reactImage}`,
                    server: true,
                  },
                ];
                formData.form_data.files[input.input_slug] = [
                  ngoItem.ngo_80G_certificate,
                ];
              } else if (
                input.input_slug === 'fcra_certificates' &&
                ngoItem?.upload_FCRA_certificate
              ) {
                data[mainIndex].inputs[inputIndex].value =
                  ngoItem?.upload_FCRA_certificate;
                formData.form_data[input.input_slug] =
                  ngoItem?.upload_FCRA_certificate;
              } else if (
                input.input_slug === 'upload_fcra_registration_document' &&
                ngoItem?.ngo_FCRA_certificate &&
                !_.isEmpty(ngoItem?.ngo_FCRA_certificate) &&
                ngoItem?.ngo_FCRA_certificate !== ''
              ) {
                data[mainIndex].inputs[inputIndex].value = [
                  ngoItem.ngo_FCRA_certificate,
                ];
                const parts = ngoItem?.ngo_FCRA_certificate?.split('.');
                const fileExtension = parts[parts.length - 1];
                const fields = ngoItem?.ngo_FCRA_certificate?.indexOf('-');
                const reactImage = ngoItem?.ngo_FCRA_certificate?.slice(
                  fields + 1,
                );
                data[mainIndex].inputs[inputIndex].images = [
                  {
                    OriginalName: ngoItem?.ngo_FCRA_certificate,
                    mime:
                      fileExtension == 'jpeg' || fileExtension == 'JPEG'
                        ? 'image/jpeg'
                        : fileExtension == 'jpg' || fileExtension == 'JPG'
                        ? 'image/jpg'
                        : fileExtension == 'pdf' || fileExtension == 'PDF'
                        ? 'application/pdf'
                        : 'image/png',
                    path: `file:///data/user/0/com.app.saayam/cache/react-native-image-crop-picker/${reactImage}`,
                    server: true,
                  },
                ];
                formData.form_data.files[input.input_slug] = [
                  ngoItem.ngo_FCRA_certificate,
                ];
              }
            });
          });
          const data1 = JSON.stringify(data);

          formData.form_settings = data1;

          const updatedData: any = await this.ngoModel
            .findByIdAndUpdate(ngoItem._id, formData)
            .select({
              _id: 1,
              ngo_causes: 1,
              ngo_status: 1,
              ngo_location: 1,
              'form_data.ngo_name': 1,
            });

          const ngoData = {
            _id: updatedData._id,
            ngo_name: updatedData.form_data.ngo_name,
            ngo_causes: updatedData.ngo_causes,
            ngo_status: updatedData.ngo_status,
            ngo_location: updatedData.ngo_location,
          };

          await this.userModel.updateMany(
            { 'ngo_data._id': ObjectID(ngoItem._id) },
            { $set: { ngo_data: ngoData, ngo_id: ObjectID(ngoItem._id) } },
          );
        }),
      );
      console.log('doneeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
      return res.json({ success: true });
    } catch (error) {
      console.log(error);
    }
  }
}
