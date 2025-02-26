import { _ } from 'lodash';
import moment from 'moment-timezone';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import mConfig from '../../config/message.config.json';
import { ErrorlogService } from '../error-log/error-log.service';
import { authConfig } from '../../config/auth.config';
import { QueueService } from '../../common/queue.service';
import { CommonService } from '../../common/common.service';
import { CreateCorporateDto } from './dto/create-corporate.dto';
import { UpdateCorporateDto } from './dto/update-corporate.dto';
import { SendInviteDto } from './dto/send-invite.dto';
import { RequestService } from '../request/request.service';
import { UsersService } from '../users/users.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { User, UserDocument } from '../users/entities/user.entity';
import { Corporate, CorporateDocument } from './entities/corporate.entity';
import { JoinCorporateDto } from './dto/join-corporate.dto';
import {
  CorporateUsers,
  CorporateUsersDocument,
} from './entities/corporate-users.entity';
import {
  CorporateInvite,
  CorporateInviteDocument,
} from './entities/corporate-invite.entity';
import { SendOtpDto } from './dto/send-otp.dto';
import { CheckUserDto } from './dto/check-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import {
  CorporateRoles,
  CorporateRolesDocument,
} from './entities/corporate-roles.entity';
import { OtpVerify, OtpVerifyDocument } from './entities/otp-verify';
import { SaveOrganizationDto } from './dto/save-organization.dto';
import {
  CsvUploadDocument,
  CsvUploadModel,
} from '../csv-upload/entities/csv-upload.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { VerifyCorporateInvite } from './dto/verify-corporate-invite.dto';
import {
  CorporateNotification,
  CorporateNotificationDocument,
} from '../notification/entities/corporate-notification.entity';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../request/entities/cause-request.entity';
import { ChangeCausesDto } from './dto/change-causes.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AddRemoveAdminDto } from './dto/add-remove-admin.dto';
import { FundraiserRequestVerifyDto } from '../request/dto/fundraiser-request-verify.dto';
import {
  FundraiserVerify,
  FundraiserVerifyDocument,
} from '../request/entities/fundraiser-request-verify.entity';
import { LogService } from 'src/common/log.service';
import {
  TransactionModel,
  TransactionDocument,
} from '../donation/entities/transaction.entity';
import { UserListDto } from './dto/user-list.dto';
import {
  CorporateActivityLog,
  CorporateActivityLogDocument,
} from './entities/corporate-activity-log.entity';
import { BusinessEmailDto } from './dto/business-email.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  NgoUpdated,
  NgoUpdatedDocument,
} from '../ngo/entities/ngo_updated_data.entity';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class CorporateService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly queueService: QueueService,
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
    private readonly requestService: RequestService,
    private readonly errorlogService: ErrorlogService,
    private readonly logService: LogService,
    @InjectModel(CorporateInvite.name)
    private corporateInviteModel: Model<CorporateInviteDocument>,
    @InjectModel(CsvUploadModel.name)
    private csvUploadModel: Model<CsvUploadDocument>,
    @InjectModel(OtpVerify.name)
    private otpVerifyModel: Model<OtpVerifyDocument>,
    @InjectModel(CorporateRoles.name)
    private corporateRolesModel: Model<CorporateRolesDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Corporate.name)
    private corporateModel: Model<CorporateDocument>,
    @InjectModel(CorporateUsers.name)
    private corporateUsers: Model<CorporateUsersDocument>,
    @InjectModel(CorporateNotification.name)
    private corporateNotification: Model<CorporateNotificationDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
    @InjectModel(FundraiserVerify.name)
    private fundraiserVerify: Model<FundraiserVerifyDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(CorporateActivityLog.name)
    private corporateActivityLog: Model<CorporateActivityLogDocument>,
    @InjectModel(NgoUpdated.name)
    private ngoUpdatedModel: Model<NgoUpdatedDocument>,
    @InjectModel(Ngo.name) private ngoModel: Model<NgoDocument>,
  ) {}

  // Api for send invite to user
  public async sendInvite(sendInviteDto: SendInviteDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        sendInviteDto,
      );
      await sendInviteDto.contacts.map(async (item: any) => {
        const message = await this.commonService.changeString(
          mConfig.send_invite_msg,
          {
            '{{uname}}': item.first_name + ' ' + item.last_name,
            '{{link}}': process.env.CORPORATE_INVITE_LINK,
          },
        );
        if (item.email) {
          //send email to users
          const input = {
            to: item.email,
            subject: 'Corporate Invitations',
            message: message,
          };
          await this.commonService.sendMail(input, this.request.originalUrl);
        }
        if (item.phone_code && item.phone) {
          //send SMS to users
          const text = {
            phone: [item.phone_code + ' ' + item.phone],
            message: message,
          };
          await this.commonService.sendTextMessage(
            text,
            this.request.originalUrl,
          );
        }
        //store data in corporate invite table
        item.type = 'send_invite';
        const createData = new this.corporateInviteModel(item);
        await createData.save();
      });

      return res.json({
        success: true,
        message: mConfig.send_invite,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-sendInvite',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for create corporate
  public async createCorporate(
    createCorporateDto: CreateCorporateDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createCorporateDto,
      );
      // Check if an account with the same email or phone number already exists
      const accountExist = await this.corporateModel
        .count({
          $or: [
            { email: createCorporateDto.email },
            {
              phone_code: createCorporateDto.phone_code,
              phone: createCorporateDto.phone,
            },
          ],
          is_deleted: { $ne: true },
        })
        .lean();
      if (accountExist) {
        return res.json({
          success: false,
          message: mConfig.Account_already_exists,
        });
      } else {
        let existUser: any = await this.userModel
          .findOne({
            phone: createCorporateDto.phone,
            phone_code: createCorporateDto.phone_code,
            is_deleted: false,
          })
          .lean();
        // Extract and set the latitude and longitude for corporate location
        const latitude = Number(createCorporateDto.latitude);
        const longitude = Number(createCorporateDto.longitude);

        const corporateLocation = {
          type: 'Point',
          coordinates: [longitude, latitude],
          city: createCorporateDto.city,
        };

        const countryData = await this.commonService.getCountry(
          createCorporateDto.country_name,
        );
        const timezonesName = await this.commonService.getTimezoneFromLatLon(
          latitude,
          longitude,
        );

        let updateData: any = {};
        //if user not exist then create as a corporate user in user table
        if (!existUser) {
          const dtl = {
            is_donor: false,
            is_user: false,
            is_volunteer: false,
            is_corporate: true,
            phone_code: createCorporateDto.phone_code,
            phone: createCorporateDto.phone,
            first_name: createCorporateDto.first_name,
            display_name: createCorporateDto.first_name,
            last_name: createCorporateDto.last_name,
            phone_country_full_name: createCorporateDto.phone_country_full_name,
            phone_country_short_name:
              createCorporateDto.phone_country_short_name,
            location: corporateLocation,
            image: null,
            email: createCorporateDto.email,
            is_restaurant: false,
            country_data: countryData ? countryData : null,
            default_country: createCorporateDto.country_name,
            time_zone: timezonesName,
          };

          const createUser = new this.userModel(dtl);
          existUser = await createUser.save();
        } else {
          updateData = {
            is_corporate: true,
          };
        }

        createCorporateDto.location = corporateLocation;
        createCorporateDto.time_zone = timezonesName[0];
        createCorporateDto.country_data = countryData ? countryData : null;
        createCorporateDto.profile_set = false;

        const createCorporate = new this.corporateModel(createCorporateDto);
        const corporate = await createCorporate.save();

        if (_.isEmpty(corporate)) {
          return res.json({
            success: false,
            message: mConfig.Invalid,
          });
        } else {
          updateData['corporate_id'] = corporate._id;

          const updateUser = await this.userModel
            .findByIdAndUpdate({ _id: existUser._id }, updateData, {
              new: true,
            })
            .lean();

          //send notification to admin
          const input = {
            message: mConfig.noti_msg_corporate_register,
            title: mConfig.noti_title_corporate_register,
            type: 'corporate',
            corporateId: corporate._id,
          };
          this.commonService.sendAdminNotification(input);

          const result1 = await this.usersService.makeLogin(
            updateUser,
            createCorporateDto.uuid,
            createCorporateDto.platform,
          );

          result1.message = mConfig.account_created;
          return res.json(result1);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-createCorporate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for verify email otp
  public async verifyOtp(verifyOtpDto: VerifyOtpDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        verifyOtpDto,
      );
      const otpData = await this.otpVerifyModel
        .findOne({
          email: verifyOtpDto.email,
        })
        .select({ _id: 1, otp: 1, expired_at: 1 })
        .lean();

      const currentTime = parseInt(moment().format('X'));
      // Check if no OTP data is found for the email
      if (_.isEmpty(otpData)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else if (otpData.otp != verifyOtpDto.otp) {
        // Check if provided OTP does not match the stored OT
        return res.json({
          success: false,
          message: mConfig.Invalid_OTP,
        });
      } else if (otpData.expired_at <= currentTime) {
        //Check if  otp is expired
        return res.json({
          success: false,
          message: mConfig.OTP_expired,
        });
      } else {
        await this.otpVerifyModel.findByIdAndDelete(otpData._id).lean();
        return res.json({
          success: true,
          message: mConfig.OTP_verified,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-verifyOtp',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for send otp to email
  public async sendOtp(sendOtpDto: SendOtpDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        sendOtpDto,
      );
      const otpData = await this.otpVerifyModel
        .findOne({
          email: sendOtpDto.email,
        })
        .select({
          _id: 1,
          email: 1,
        })
        .lean();
      // Generate a random 6-digit OTP
      const OTP = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
      // Create data for the OTP including the OTP value and expiration time
      const data: any = {
        email: sendOtpDto.email,
        otp: String(OTP),
        expired_at: parseInt(moment().add(5, 'minutes').format('X')),
      };
      // If no OTP data exists, create a new OTP record else update record
      if (_.isEmpty(otpData)) {
        const createData = new this.otpVerifyModel(data);
        await createData.save();
      } else {
        await this.otpVerifyModel
          .findOneAndUpdate(
            {
              _id: otpData._id,
            },
            data,
          )
          .select({ _id: 1 })
          .lean();
      }

      const message = await this.commonService.changeString(
        mConfig.corporate_send_otp,
        { '{{otp}}': OTP },
      );
      const sendMail = {
        to: sendOtpDto.email,
        subject: 'Saayam',
        message: message,
      };
      // Send the email with the OTP
      await this.commonService.sendMail(sendMail, this.request.originalUrl);

      return res.json({
        success: true,
        message: mConfig.OTP_sent,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-sendOtp',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for save organization details
  public async saveOrganization(
    type,
    saveOrganizationDto: SaveOrganizationDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        saveOrganizationDto,
      );
      const corporateData = await this.corporateModel
        .findById({
          _id: saveOrganizationDto.corporate_id,
          is_deleted: { $ne: true },
        })
        .lean();
      // Check if no corporate data is found for the given corporate_id
      if (_.isEmpty(corporateData)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        let data = JSON.parse(saveOrganizationDto.data);
        const latitude = Number(saveOrganizationDto.latitude);
        const longitude = Number(saveOrganizationDto.longitude);

        const corporateLocation = {
          type: 'Point',
          coordinates: [longitude, latitude],
          city: saveOrganizationDto.city,
        };
        const userDetail = this.request.user;
        const formData: any = {
          form_data: {
            files: {},
            images: {},
          },
          causes: saveOrganizationDto.causes,
          location: corporateLocation,
          organization_name: saveOrganizationDto.organization_name,
          profile_set: true,
        };
        // Validate and process the provided organization data
        const { data1, formData1, haveError } =
          await this.requestService.checkValidation(
            data,
            formData,
            null,
            'main',
            'corporate',
            'corporate',
            userDetail,
          );

        data = JSON.stringify(data1);
        formData1.form_settings = data;

        if (haveError) {
          return res.json({
            success: false,
            data,
          });
        }

        await this.corporateModel
          .findByIdAndUpdate(
            { _id: saveOrganizationDto.corporate_id },
            { $set: formData1 },
            { new: true },
          )
          .lean();
        // Upload any files associated with the organization to S3
        if (formData1.form_data && formData1.form_data.files) {
          const files = formData1.form_data.files;

          for (const key in files) {
            files[key].map(async (item) => {
              await this.commonService.uploadFileOnS3(
                item,
                'corporate/' + corporateData._id,
              );
            });
          }
        }
        return res.json({
          success: true,
          message:
            type == 'add'
              ? mConfig.Organization_details_saved
              : mConfig.Organization_details_updated,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-saveOrganization',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update basic details
  public async updateBasicDetails(
    updateCorporateDto: UpdateCorporateDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateCorporateDto,
      );
      const userDetail = this.request.user;
      const corporateData = await this.corporateModel
        .findByIdAndUpdate(
          updateCorporateDto.corporate_id,
          updateCorporateDto,
          { new: true },
        )
        .lean();
      // Check if no corporate data is found for the given corporate_id
      if (!corporateData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //update email and phone in user table

        const updateUserData = {
          phone_code: updateCorporateDto.phone_code,
          phone: updateCorporateDto.phone,
          first_name: updateCorporateDto.first_name,
          display_name: updateCorporateDto.first_name,
          last_name: updateCorporateDto.last_name,
          phone_country_full_name: updateCorporateDto.phone_country_full_name,
          phone_country_short_name: updateCorporateDto.phone_country_short_name,
          email: updateCorporateDto.email,
        };
        await this.userModel
          .findOneAndUpdate(
            { _id: userDetail._id, is_corporate: true },
            updateUserData,
          )
          .select({ _id: 1 })
          .lean();
        return res.json({
          message: mConfig.Basic_details_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-updateBasicDetails',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //Check User exist or not
  public async checkUser(checkUserDto: CheckUserDto, res: any): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        checkUserDto,
      );
      // Check the type of check (e.g., for signup)
      if (checkUserDto.type == 'signup') {
        let emailCount = 0;
        let phoneCount = 0;
        // Check if an email is provided and not undefined
        if (checkUserDto.email && !_.isUndefined(checkUserDto.email)) {
          emailCount = await this.userModel
            .count({
              email: checkUserDto.email,
              $or: [{ is_corporate: true }, { is_corporate_user: true }],
              is_deleted: { $ne: true },
            })
            .lean();
          if (emailCount <= 0) {
            // If no user found with the email, check the corporate model
            emailCount = await this.corporateModel
              .count({
                email: checkUserDto.email,
                is_deleted: { $ne: true },
              })
              .lean();
          }
        }
        if (
          checkUserDto.phone_code &&
          !_.isUndefined(checkUserDto.phone_code) &&
          checkUserDto.phone &&
          !_.isUndefined(checkUserDto.phone)
        ) {
          phoneCount = await this.userModel
            .count({
              phone_code: checkUserDto.phone_code,
              phone: checkUserDto.phone,
              $or: [{ is_corporate: true }, { is_corporate_user: true }],
              is_deleted: { $ne: true },
            })
            .lean();

          if (phoneCount <= 0) {
            phoneCount = await this.corporateModel
              .count({
                phone_code: checkUserDto.phone_code,
                phone: checkUserDto.phone,
                is_deleted: { $ne: true },
              })
              .lean();
          }
        }

        if (emailCount > 0 && phoneCount > 0) {
          return res.json({
            success: false,
            emailError: true,
            phoneError: true,
            message: mConfig.Account_exists_with_phone_email,
          });
        } else if (phoneCount > 0) {
          return res.json({
            success: false,
            phoneError: true,
            message: mConfig.Account_exists_with_phone,
          });
        } else if (emailCount > 0) {
          return res.json({
            success: false,
            emailError: true,
            message: mConfig.Account_exists_with_email,
          });
        } else {
          return res.json({
            success: true,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-checkUser',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }
  //find corporate account
  public async corporateByMailPhone(getCorporateDto: any, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        getCorporateDto,
      );
      // Define the query to search for corporate entities based on the provided search criteria
      const query: any = {
        $or: [
          {
            phone: new RegExp(getCorporateDto.search, 'i'),
          },
          {
            email: new RegExp(getCorporateDto.search, 'i'),
          },
          {
            organization_name: new RegExp(getCorporateDto.search, 'i'),
          },
        ],
        is_deleted: { $ne: true },
      };

      const findCorporate = await this.corporateModel.aggregate(
        [
          { $match: query },
          {
            $project: {
              _id: 1,
              organization_name: 1,
              email: 1,
              phone: 1,
              phone_code: 1,
              phone_country_short_name: 1,
              location: 1,
              organization_logo: {
                $map: {
                  input: '$form_data.files.organization_logo',
                  as: 'photo',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'corporate/',
                      { $toString: '$_id' },
                      '/',
                      '$$photo',
                    ],
                  },
                },
              },
            },
          },
          {
            $sort: { organization_name: 1 },
          },
          { $limit: 10 },
        ],
        { collation: authConfig.collation },
      );

      // Check if no corporate entities match the search criteria
      if (_.isEmpty(findCorporate)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
          data: [],
        });
      } else {
        return res.json({
          success: true,
          data: findCorporate,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-corporateByMailPhone',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //Api for get roles permission list
  public async getRolePermissions(res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      // Define the role-based permissions with a structured format
      const permissions = [
        {
          id: 1,
          mainTitle: 'Administrator',
          data: [
            // {
            //   slug: 'invite_users',
            //   title: 'Invite Users',
            // },
            {
              slug: 'manage_users',
              title: 'Manage User: Add & Remove Users',
            },
            {
              slug: 'manage_roles',
              title: 'Manage Role: Add & Remove Roles',
            },
          ],
        },
        {
          id: 2,
          mainTitle: 'Fundraiser & Fund Permission',
          data: [
            // {
            //   slug: 'create_corporate_behalf_fundraiser',
            //   title: 'Allow to Create a Fundraiser behalf of Corporate',
            // },
            {
              slug: 'manage_corporate_fundraiser',
              title: 'Manage entire Fundraiser of the corporate',
            },
            // {
            //   slug: 'accept_reject_fundraiser',
            //   title:
            //     'Accept & Reject the Fundraiser created within Corporate user',
            // },
            // {
            //   slug: 'create_corporate_behalf_fund',
            //   title: 'Allow to Create a Fund behalf of Corporate',
            // },
            {
              slug: 'manage_corporate_fund',
              title: 'Manage the entire Fund of the corporate',
            },
          ],
        },
        {
          id: 3,
          mainTitle: 'Approvals',
          data: [
            {
              slug: 'auto_approve_fundraiser',
              title: 'Create a Fundraiser will get auto approved',
            },
            {
              slug: 'auto_approve_fund',
              title: 'Create a Fund will get auto approved',
            },
          ],
        },
      ];

      return res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-getRolePermissions',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //Api for create role
  public async createRole(
    createRoleDto: CreateRoleDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createRoleDto,
      );
      const user = this.request.user;
      // Check if the user has the necessary permissions to create a role
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        // Find the corporate entity associated with the provided corporate ID
        const corporate = await this.corporateModel
          .findOne({
            _id: ObjectID(createRoleDto.corporate_id),
            is_deleted: { $ne: true },
          })
          .select({ _id: 1 })
          .lean();
        if (_.isEmpty(corporate)) {
          return res.json({
            success: true,
            message: mConfig.No_data_found,
          });
        } else {
          // Extract and sanitize the role name from the DTO
          const role = createRoleDto.role_name.trim();
          // Check if a role with the same name already exists within the corporate
          const existRole = await this.corporateRolesModel
            .findOne({
              role: new RegExp('^' + role + '$', 'i'),
              corporate_id: ObjectID(createRoleDto.corporate_id),
            })
            .select({ _id: 1 })
            .lean();
          if (existRole) {
            return res.json({
              success: true,
              message: mConfig.Role_exist,
            });
          }
          //store data in corporate roles table
          const data = {
            role: role,
            user_id: user._id,
            corporate_id: createRoleDto.corporate_id,
            permissions: createRoleDto.permissions,
          };
          const createData = new this.corporateRolesModel(data);
          await createData.save();

          return res.json({
            success: true,
            message: mConfig.Role_created,
          });
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-createRole',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //Api for update role
  public async updateRole(
    updateRoleDto: UpdateRoleDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateRoleDto,
      );
      const user = this.request.user;
      // Check user permissions
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        const corporate = await this.corporateModel
          .findOne({
            _id: ObjectID(updateRoleDto.corporate_id),
            is_deleted: { $ne: true },
          })
          .select({ _id: 1 })
          .lean();
        if (_.isEmpty(corporate)) {
          return res.json({
            success: true,
            message: mConfig.No_data_found,
          });
        } else {
          // Extract and sanitize the new role name
          const role = updateRoleDto.role_name.trim();
          // Check if a role with the same name already exists for the corporate entity
          const existRole = await this.corporateRolesModel
            .findOne({
              role: new RegExp('^' + role + '$', 'i'),
              corporate_id: ObjectID(updateRoleDto.corporate_id),
              _id: { $ne: ObjectID(updateRoleDto.role_id) },
            })
            .select({ _id: 1 })
            .lean();

          if (existRole) {
            return res.json({
              success: true,
              message: mConfig.Role_exist,
            });
          }
          //update data in corporate roles table
          const updateData = {
            role: role,
            permissions: updateRoleDto.permissions,
          };
          await this.corporateRolesModel.findByIdAndUpdate(
            updateRoleDto.role_id,
            updateData,
            { new: true },
          );

          return res.json({
            success: true,
            message: mConfig.Role_updated,
          });
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-updateRole',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //Api for delete role
  public async deleteRole(roleId, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { roleId },
      );
      const user = this.request.user;
      // Check user permissions
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        const corporateUser: any = await this.corporateUsers
          .count({ role_id: ObjectID(roleId), status: { $ne: 'removed' } })
          .lean();
        // If there are corporate users with the role, return an error response
        if (corporateUser > 0) {
          return res.json({
            message: mConfig.Role_not_deleted,
            success: false,
          });
        }
        const result = await this.corporateRolesModel
          .findByIdAndDelete(roleId)
          .lean();

        if (_.isEmpty(result)) {
          return res.json({
            success: true,
            message: mConfig.No_data_found,
          });
        }

        return res.json({
          message: mConfig.Role_deleted,
          success: true,
        });
      } else {
        // User does not have permission
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-deleteRole',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for role list in dropdown(App)
  public async roleList(corporateId, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      // Retrieve a list of roles from the corporateRolesModel
      const result = await this.corporateRolesModel
        .find({
          corporate_id: ObjectID(corporateId),
          is_deleted: { $ne: true },
        })
        .collation(authConfig.collation)
        .select({ _id: 1, role: 1, permissions: 1 })
        .sort({ role: 1 })
        .lean();

      return res.json({
        data: result,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-roleList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //join in corporate
  public async joinCorporate(joinCorporateDto: JoinCorporateDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        joinCorporateDto,
      );
      const userDetail = this.request.user;
      const corporateData: any = await this.corporateModel
        .findOne({
          _id: ObjectID(joinCorporateDto.corporate_id),
        })
        .select({
          _id: 1,
          user_id: 1,
          organization_name: 1,
        })
        .lean();
      if (_.isEmpty(corporateData)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        // Check if the user has already joined the corporate and is in an active state
        const userExist = await this.corporateUsers
          .findOne({ user_id: userDetail._id })
          .select({ _id: 1, status: 1 })
          .sort({ _id: -1 })
          .lean();
        if (!_.isEmpty(userExist) && userExist.status == 'active') {
          return res.json({
            success: false,
            message: mConfig.Already_joined_corporate,
          });
        } else {
          const otpData = await this.otpVerifyModel
            .findOne({
              email: joinCorporateDto.email,
            })
            .select({ _id: 1, otp: 1, expired_at: 1 })
            .lean();
          // Handle various OTP verification cases
          const currentTime = parseInt(moment().format('X'));
          if (_.isEmpty(otpData)) {
            return res.json({
              success: false,
              message: mConfig.No_data_found,
            });
          } else if (otpData.otp != joinCorporateDto.otp) {
            return res.json({
              success: false,
              message: mConfig.Invalid_OTP,
            });
          } else if (otpData.expired_at <= currentTime) {
            return res.json({
              success: false,
              message: mConfig.OTP_expired,
            });
          } else {
            await this.otpVerifyModel
              .findByIdAndDelete(otpData._id)
              .select({ _id: 1 })
              .lean();

            const addData = {
              user_id: userDetail._id,
              corporate_id: corporateData._id,
              email: joinCorporateDto.email,
              status: 'active',
            };

            await this.corporateUsers
              .updateOne({ user_id: userDetail._id }, addData, { upsert: true })
              .select({ _id: 1 })
              .lean();

            const data = {
              is_corporate_user: true,
              corporate_id: corporateData._id,
            };
            await this.userModel
              .findByIdAndUpdate(
                { _id: userDetail._id },
                { $set: data },
                { new: true },
              )
              .lean();

            //Don't show approve reject button in corporate notification
            await this.corporateNotification.updateMany(
              { user_id: ObjectID(userDetail._id) },
              { $unset: { additional_data: 1 } },
            );

            const updateData = {
              '{{uname}}': userDetail.first_name + ' ' + userDetail.last_name,
              '{{organization}}': corporateData.organization_name,
            };

            const organizerMsg = await this.commonService.changeString(
              mConfig.noti_msg_join_corporation,
              updateData,
            );

            const adminMsg = await this.commonService.changeString(
              mConfig.noti_msg_adm_join_corporation,
              updateData,
            );

            //send notification to corporate admins
            const input: any = {
              title: mConfig.noti_title_join_corporation,
              type: 'join-corporate',
              corporateId: corporateData._id,
              categorySlug: 'corporate',
              message: organizerMsg,
              forCorporate: true,
            };
            const usersId = await this.commonService.getCorporateAdmins(
              corporateData._id,
            );
            this.commonService.sendAllNotification(usersId, input);

            //send notification to admin
            const input1: any = {
              title: mConfig.noti_title_join_corporation,
              type: 'corporate',
              corporateId: corporateData._id,
              message: adminMsg,
            };
            this.commonService.sendAdminNotification(input1);

            return res.json({
              success: true,
              message: mConfig.join_corporate,
            });
          }
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-joinCorporate',
      );
      return res.json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //find team member
  public async findTeamMember(search: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        search,
      );
      const userDetail = this.request.user;
      // Check user permissions to ensure they can search for team members
      if (
        userDetail.is_corporate ||
        (userDetail.is_corporate_user &&
          !_.isEmpty(userDetail.corporate_data) &&
          !_.isUndefined(userDetail.corporate_data.user_status) &&
          !_.isUndefined(userDetail.corporate_data.is_admin) &&
          userDetail.corporate_data.user_status == 'active' &&
          userDetail.corporate_data.is_admin)
      ) {
        const findRemoveUsers = await this.corporateUsers
          .find({
            corporate_id: userDetail.corporate_data._id,
            status: 'removed',
          })
          .distinct('user_id')
          .lean();
        // Construct a query to search for users based on the search criteria
        const query: any = {
          $or: [
            {
              phone: new RegExp(search, 'i'),
            },
            {
              email: new RegExp(search, 'i'),
            },
            {
              first_name: new RegExp(search, 'i'),
            },
          ],
          $and: [
            { _id: { $ne: ObjectID(userDetail._id) } },
            { _id: { $nin: findRemoveUsers } },
          ],
          is_deleted: false,
          is_ngo: { $ne: true },
          is_corporate: { $ne: true },
          is_corporate_user: { $ne: true },
        };

        const existUser = await this.userModel.aggregate(
          [
            { $match: query },
            {
              $project: {
                _id: 1,
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
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-findTeamMember',
      );
      return res.json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //Api for get edit detail
  public async editCorporate(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      // Fetch the corporate data based on the specified ID
      const corporate = await this.corporateModel
        .aggregate([
          {
            $match: { _id: ObjectID(id), is_deleted: { $ne: true } },
          },
          {
            $project: {
              first_name: 1,
              last_name: 1,
              email: 1,
              phone_code: 1,
              phone: 1,
              country_data: 1,
              form_settings: 1,
              form_data: 1,
              agree_to_partner: 1,
              is_authorize: 1,
              user_id: 1,
              causes: 1,
              location: 1,
              approve_time: 1,
              website: 1,
              job_title: 1,
              phone_country_short_name: 1,
              phone_country_full_name: 1,
              image_url: {
                $concat: [
                  authConfig.imageUrl,
                  'corporate/',
                  { $toString: '$_id' },
                  '/',
                ],
              },
              organization_logo: {
                $map: {
                  input: '$form_data.files.organization_logo',
                  as: 'organization_logo',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'corporate/',
                      { $toString: '$_id' },
                      '/',
                      '$$organization_logo',
                    ],
                  },
                },
              },
            },
          },
        ])
        .exec();

      if (!_.isEmpty(corporate)) {
        return res.json({
          success: true,
          data: corporate[0],
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
        'src/controller/corporate/corporate.service.ts-editCorporate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for invite via email
  public async inviteByEmail(inviteByEmailDto: any, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        inviteByEmailDto,
      );
      const user = this.request.user;
      // Check user permissions to ensure they can send an email invite
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        const corporate = await this.corporateModel
          .findOne({
            _id: ObjectID(inviteByEmailDto.corporate_id),
            is_deleted: { $ne: true },
          })
          .select({ _id: 1, organization_name: 1 })
          .lean();

        if (_.isEmpty(corporate)) {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        } else {
          //Save data in corporate invite table
          const item = {
            email: inviteByEmailDto.email,
            type: 'email_invite',
            corporate_id: inviteByEmailDto.corporate_id,
          };
          const createData = new this.corporateInviteModel(item);
          await createData.save();

          const userData: any = await this.userModel
            .findOne({
              email: inviteByEmailDto.email,
              is_deleted: { $ne: true },
            })
            .select({
              _id: 1,
            })
            .lean();

          //send invite email to user
          const emailMsg = await this.commonService.changeString(
            mConfig.corporation_invite_via_email,
            {
              '{{organization_name}}': corporate.organization_name,
              '{{link}}': process.env.CORPORATE_INVITE_LINK,
            },
          );
          const input = {
            to: inviteByEmailDto.email,
            subject: 'Corporate Invitation',
            message: emailMsg,
          };
          await this.commonService.sendMail(input, this.request.originalUrl);
          //send notification to all user which is inviting
          if (!_.isEmpty(userData)) {
            const notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_team_member_added,
              { '{{organization_name}}': corporate.organization_name },
            );
            const input = {
              message: notiMsg,
              title: corporate.organization_name,
              type: 'corporate',
              corporateId: inviteByEmailDto.corporate_id,
              additionalData: { status: 'pending' },
              userId: userData._id,
            };
            await this.commonService.notification(input, false, true);
          }

          return res.json({
            success: true,
            message: mConfig.send_invite,
          });
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-inviteByEmail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for import users in corporate
  public async uploadCsv(file, corporateId, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { file, corporateId },
      );
      const userData = this.request.user;
      // Check user permissions to ensure they can upload a CSV file
      if (
        userData.is_corporate ||
        (userData.is_corporate_user &&
          !_.isEmpty(userData.corporate_data) &&
          !_.isUndefined(userData.corporate_data.user_status) &&
          !_.isUndefined(userData.corporate_data.is_admin) &&
          userData.corporate_data.user_status == 'active' &&
          userData.corporate_data.is_admin)
      ) {
        const csvId: any = await this.commonService.uploadCsv(
          file,
          'corporate',
        );
        if (csvId && csvId.error) {
          return res.json({
            message: csvId.error,
            success: false,
          });
        } else {
          // Create a record in the CSV upload table
          const body = {
            type: 'corporate',
            file_name: csvId.file_name,
            status: 'Pending',
            uploadedBy: userData.first_name,
            entity_id: corporateId,
            user_id: userData._id,
          };
          const createData = new this.csvUploadModel(body);
          await createData.save();
          return res.json({
            success: true,
            message: mConfig.CSV_uploaded,
          });
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-uploadCsv',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get sample csv format url
  public async sampleCsv(res) {
    try {
      // Return a successful response with a link to the sample CSV file
      return res.json({
        success: true,
        data: 'https://saayam.blob.core.windows.net/saayamfiles/csv-format/invite_user.csv',
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-sampleCsv',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for add team member
  public async addTeamMember(addTeamMemberDto: AddTeamMemberDto, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        addTeamMemberDto,
      );
      const user = this.request.user;
      // Check user permissions to ensure they can add a team member
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        const corporate = await this.corporateModel
          .findOne({
            _id: ObjectID(addTeamMemberDto.corporate_id),
            is_deleted: { $ne: true },
          })
          .select({ _id: 1, organization_name: 1 })
          .lean();

        if (_.isEmpty(corporate)) {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        } else {
          // Generate a notification message
          const notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_team_member_added,
            { '{{organization_name}}': corporate.organization_name },
          );

          const input = {
            message: notiMsg,
            title: corporate.organization_name,
            type: 'corporate',
            corporateId: addTeamMemberDto.corporate_id,
            additionalData: { status: 'pending' },
          };
          //send notification to all users
          await this.commonService.sendAllNotification(
            addTeamMemberDto.user_id,
            input,
            false,
            true,
          );

          return res.json({
            success: true,
            message: mConfig.Team_member_added,
          });
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-addTeamMember',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for user to accept/reject corporate invitation
  public async verifyCorporateInvite(
    verifyCorporateInvite: VerifyCorporateInvite,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        verifyCorporateInvite,
      );
      const userDetail = this.request.user;
      // Find the corporate data based on the specified corporate ID
      const corporateData: any = await this.corporateModel
        .findOne({
          _id: ObjectID(verifyCorporateInvite.corporate_id),
        })
        .select({
          _id: 1,
          user_id: 1,
          organization_name: 1,
        })
        .lean();
      if (_.isEmpty(corporateData)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const userExist = await this.corporateUsers
          .findOne({ user_id: ObjectID(userDetail._id) })
          .select({ _id: 1 })
          .sort({ _id: -1 })
          .lean();
        if (!_.isEmpty(userExist) && userExist.status == 'approve') {
          return res.json({
            success: false,
            message: mConfig.Already_joined_corporate,
          });
        } else {
          let notiTitle;
          let notiMsg;
          const updateData = {
            '{{uname}}': userDetail.first_name + ' ' + userDetail.last_name,
            '{{organization}}': corporateData.organization_name,
          };
          if (verifyCorporateInvite.status === 'approve') {
            //check user in corporateusers if already exist then throw error
            const addData = {
              user_id: userDetail._id,
              corporate_id: corporateData._id,
              email: userDetail.email,
              status: 'active',
            };
            await this.corporateUsers
              .updateOne({ user_id: userDetail._id }, addData, { upsert: true })
              .select({ _id: 1 })
              .lean();

            const data = {
              is_corporate_user: true,
              corporate_id: corporateData._id,
            };
            await this.userModel
              .findByIdAndUpdate(
                { _id: userDetail._id },
                { $set: data },
                { new: true },
              )
              .lean();

            //Don't show approve reject button in corporate notification
            await this.corporateNotification
              .updateMany(
                {
                  user_id: ObjectID(userDetail._id),
                  corporate_id: ObjectID(corporateData._id),
                  'additional_data.status': 'pending',
                },
                {
                  $set: {
                    'additional_data.status': 'approve',
                  },
                },
              )
              .lean();
            await this.corporateNotification
              .updateMany(
                {
                  user_id: ObjectID(userDetail._id),
                  corporate_id: { $ne: ObjectID(corporateData._id) },
                  'additional_data.status': 'pending',
                },
                {
                  $unset: {
                    additional_data: 1,
                  },
                },
              )
              .lean();

            //set notification text for corporate user
            notiTitle = mConfig.noti_title_join_corporation;
            notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_join_corporation,
              updateData,
            );

            //send notification to admin
            const adminMsg = await this.commonService.changeString(
              mConfig.noti_msg_adm_join_corporation,
              updateData,
            );
            const input1: any = {
              title: mConfig.noti_title_join_corporation,
              type: 'corporate',
              corporateId: corporateData._id,
              message: adminMsg,
            };
            this.commonService.sendAdminNotification(input1);
          } else if (verifyCorporateInvite.status === 'reject') {
            //set notification text for corporate user
            notiTitle = mConfig.noti_title_corporation_request_decline;
            notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_corporation_request_decline,
              updateData,
            );
            await this.corporateNotification
              .findOneAndUpdate(
                {
                  _id: verifyCorporateInvite.noti_id,
                  'additional_data.status': 'pending',
                },
                { 'additional_data.status': 'reject' },
              )
              .lean();
          }

          const input: any = {
            title: notiTitle,
            type: 'corporate',
            corporateId: corporateData._id,
            categorySlug: 'corporate',
            message: notiMsg,
            userId: corporateData.user_id,
            forCorporate: true,
          };
          //send notification to organizer
          this.commonService.notification(input);

          return res.json({
            success: true,
            message:
              verifyCorporateInvite.status === 'approve'
                ? mConfig.You_have_joined_corporation
                : mConfig.You_have_declined_corporation,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-verifyCorporateInvite',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for dashboard count
  public async myDashboard(res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const userData = this.request.user;

      let havePermission = false;
      let is_admin = false;
      // Check if the user has corporate data and is an admin
      if (
        !_.isEmpty(userData.corporate_data) &&
        !_.isUndefined(userData.corporate_data.is_admin)
      ) {
        if (!_.isUndefined(userData.corporate_data.role)) {
          havePermission = true;
        } else {
          is_admin = true;
        }
      }
      const permissions =
        !_.isEmpty(userData.corporate_data) &&
        !_.isEmpty(userData.corporate_data.permissions)
          ? userData.corporate_data.permissions
          : [];

      const causeRequest: any = await this.causeRequestModel.aggregate([
        {
          $match: {
            active_type: 'corporate',
            corporate_id: ObjectID(userData?.corporate_data?._id),
            category_slug: { $ne: 'hunger' },
            is_deleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
      // Initialize an empty object to store request counts
      const requests = [];
      if (!_.isEmpty(causeRequest)) {
        causeRequest.map(async (req) => {
          requests[req._id] = req.count;
        });
      }

      const manageUserCount = await this.corporateUsers
        .count({
          corporate_id: ObjectID(userData.corporate_data._id),
          user_id: { $ne: ObjectID(userData._id) },
        })
        .lean();

      const addRoleCount = await this.corporateRolesModel
        .count({ corporate_id: ObjectID(userData.corporate_data._id) })
        .lean();
      // Define an array of dashboard items
      const result = [
        {
          id: 1,
          icons: 'Fundraiser-Approval',
          count: requests['pending'] || 0,
          taskTitle: 'Fundraiser Approval',
          slug: 'corporate_fundraiser_approval',
          display:
            havePermission &&
            permissions.includes('manage_corporate_fundraiser')
              ? true
              : is_admin,
        },
        {
          id: 2,
          icons: 'On-going-Fundraiser',
          count: requests['approve'] || 0,
          taskTitle: 'On-going Fundraiser',
          slug: 'corporate_on_going_fundraiser',
          display: true,
        },
        {
          id: 3,
          icons: 'Re-verification',
          count: requests['reverify'] || 0,
          taskTitle: 'Re-verification',
          slug: 'corporate_re_verification',
          display: true,
        },
        {
          id: 4,
          icons: 'Closed-Fund',
          count: requests['complete'] || 0,
          taskTitle: 'Closed Fundraiser',
          slug: 'corporate_closed_fundraiser',
          display: true,
        },
        // {
        //   id: 5,
        //   icons: 'Transfer-request',
        //   count: 0,
        //   taskTitle: 'Transfer Request',
        //   slug: 'corporate_transfer_request',
        // },
        {
          id: 5,
          icons: 'Manage-Drives',
          count: manageUserCount || 0,
          taskTitle: 'Manage User',
          slug: 'corporate_manage_user',
          display:
            havePermission && permissions.includes('manage_users')
              ? true
              : is_admin,
        },
        {
          id: 6,
          icons: 'addRole',
          count: addRoleCount || 0,
          taskTitle: 'Add Roles',
          slug: 'corporate_add_roles',
          display:
            havePermission && permissions.includes('manage_roles')
              ? true
              : is_admin,
        },
      ];

      return res.send({
        success: true,
        data: result,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-myDashboard',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api For corporate List in admin
  public async getCorporateList(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {};
      let query = [];
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        const operator = param.operator ? param.operator.trim() : 'contains';
        // Add filters for specific fields
        if (
          !_.isUndefined(filter.organization_name) &&
          filter.organization_name
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.organization_name,
            'organization_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.job_title) && filter.job_title) {
          const query = await this.commonService.filter(
            operator,
            filter.job_title,
            'job_title',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.website) && filter.website) {
          const query = await this.commonService.filter(
            operator,
            filter.website,
            'website',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.phone) && filter.phone) {
          const query = await this.commonService.filter(
            operator,
            filter.phone,
            'phone',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.causes) && filter.causes) {
          const query = await this.commonService.filter(
            operator,
            filter.causes,
            'causes',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.location) && filter.location) {
          const query = await this.commonService.filter(
            operator,
            filter.location,
            'location.city',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.email) && filter.email) {
          const query = await this.commonService.filter(
            operator,
            filter.email,
            'email',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.name) && filter.name) {
          const query = await this.commonService.filter(
            operator,
            filter.name,
            'name',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.organization_type) &&
          filter.organization_type
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.organization_type,
            'form_data.organization_type',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.organization_size) &&
          filter.organization_size
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.organization_size,
            'form_data.organization_size',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.corporate_identity_no) &&
          filter.corporate_identity_no
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.corporate_identity_no,
            'form_data.corporate_identity_no',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.gstin) && filter.gstin) {
          const query = await this.commonService.filter(
            operator,
            filter.gstin,
            'form_data.gstin',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.tax_no) && filter.tax_no) {
          const query = await this.commonService.filter(
            operator,
            filter.tax_no,
            'form_data.tax_no',
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
        // Create a global search query based on multiple fields
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'organization_name',
            'job_title',
            'website',
            'phone',
            'causes',
            'location.city',
            'email',
            'name',
            'form_data.organization_type',
            'form_data.organization_size',
            'form_data.corporate_identity_no',
            'form_data.gstin',
            'form_data.tax_no',
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
        _id: '_id',
        organization_name: 'organization_name',
        job_title: 'job_title',
        website: 'website',
        phone: 'phone',
        causes: 'causes',
        location: 'location.city',
        email: 'email',
        createdAt: 'createdAt',
        name: 'name',
        organization_type: 'form_data.organization_type',
        organization_size: 'form_data.organization_size',
        corporate_identity_no: 'form_data.corporate_identity_no',
        gstin: 'form_data.gstin',
        tax_no: 'form_data.tax_no',
      };

      const addFields = {
        $addFields: {
          phone: { $concat: ['$phone_code', ' ', '$phone'] },
          name: {
            $concat: ['$first_name', ' ', '$last_name'],
          },
        },
      };
      // Query to count the total number of matching records
      const total = await this.corporateModel
        .aggregate([addFields, { $match: match }, { $count: 'count' }])
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

      const result = await this.corporateModel.aggregate(
        [
          addFields,
          {
            $match: match,
          },
          {
            $project: {
              organization_logo: {
                $map: {
                  input: '$form_data.files.organization_logo',
                  as: 'photo',
                  in: {
                    $concat: [
                      authConfig.imageUrl,
                      'corporate/',
                      { $toString: '$_id' },
                      '/',
                      '$$photo',
                    ],
                  },
                },
              },
              organization_name: 1,
              job_title: 1,
              website: 1,
              phone: 1,
              name: 1,
              email: 1,
              causes: 1,
              location: 1,
              profile_set: 1,
              agree_to_partner: 1,
              is_authorise: 1,
              phone_country_short_name: 1,
              // form_data: 1,
              'form_data.organization_type': 1,
              'form_data.organization_size': 1,
              'form_data.corporate_identity_no': 1,
              'form_data.gstin': 1,
              'form_data.tax_no': 1,
              createdAt: 1,
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
        'src/controller/corporate/corporate.service.ts-getCorporateList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for change corporate causes
  public async changeCauses(
    changeCausesDto: ChangeCausesDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        changeCausesDto,
      );
      const data = changeCausesDto.id;
      // Define an object with the new causes data
      const uData = {
        causes: data,
      };

      //change causes
      const result = await this.corporateModel
        .findByIdAndUpdate(changeCausesDto.corporate_id, uData, { new: true })
        .select({ _id: 1 })
        .lean();
      if (_.isEmpty(result)) {
        return res.json({ success: false, message: mConfig.No_data_found });
      }

      return res.json({
        success: true,
        cause_data: data,
        message: mConfig.Causes_updated,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-changeCauses',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for cause request list(fundraiser approval,ongoing,close)
  public async findCorporateRequests(body: any, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', body);
      // Define initial variables and user details
      const where = [];
      const userDetail = this.request.user;
      const userD: any = {
        _id: userDetail._id,
        ngo_id: userDetail?.ngo_data?._id,
      };
      // Define the query to filter corporate requests
      const query = {
        active_type: 'corporate',
        corporate_id: ObjectID(body.corporate_id),
        category_slug: { $ne: ['hunger'] },
        is_deleted: { $ne: true },
      };

      if (!_.isUndefined(body) && !_.isEmpty(body)) {
        //Filter for request status
        if (!_.isUndefined(body.status) && body.status) {
          const filterArray = body.status;
          const statusArray = body.status;

          if (filterArray.includes('approval')) {
            statusArray.splice(statusArray.indexOf('approval'), 1);
            statusArray.push('pending');
          }
          if (filterArray.includes('ongoing')) {
            statusArray.splice(statusArray.indexOf('ongoing'), 1);
            statusArray.push('approve');
          }
          if (filterArray.includes('close')) {
            statusArray.splice(statusArray.indexOf('close'), 1);
            statusArray.push('complete');
          }
          if (filterArray.includes('reverify')) {
            statusArray.splice(statusArray.indexOf('reverify'), 1);
            statusArray.push('reverify');
          }
          const query = {
            status: {
              $in: statusArray,
            },
          };
          where.push(query);
        }

        //Filter for selected causes requets
        if (
          !_.isUndefined(body.category_slug) &&
          !_.isEmpty(body.category_slug)
        ) {
          where.push({
            category_slug: { $in: body.category_slug },
          });
        }

        if (!_.isEmpty(where)) {
          query['$and'] = where;
        }
      }

      const sortData = ['_id', 'createdAt', 'approve_time'];
      const total_record = await this.causeRequestModel
        .countDocuments(query)
        .exec();
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
        'createdAt',
      );

      if (!_.isUndefined(body.sort_by) && body.sort_by) {
        const sortBy = body.sort_by;
        if (sortBy == 'asce') {
          sort = { title_of_fundraiser: 1 };
        } else if (sortBy == 'desc') {
          sort = { title_of_fundraiser: -1 };
        } else if (sortBy == 'old_to_new') {
          sort = { createdAt: 1 };
        } else if (sortBy == 'new_to_old') {
          sort = { createdAt: -1 };
        } else if (sortBy == 'last_week') {
          // Handle special sorting case for last week
          const startDate =
            moment()
              .subtract(1, 'weeks')
              .startOf('isoWeek')
              .format('YYYY-MM-DD') + 'T00:00:00Z';
          const endDate =
            moment()
              .subtract(1, 'weeks')
              .endOf('isoWeek')
              .format('YYYY-MM-DD') + 'T23:59:59Z';

          where.push({
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          });
        } else if (sortBy == 'last_month') {
          // Handle special sorting case for last month
          const startDate =
            moment()
              .subtract(1, 'month')
              .startOf('month')
              .format('YYYY-MM-DD') + 'T00:00:00Z';
          const endDate =
            moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD') +
            'T23:59:59Z';

          where.push({
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          });
        }
      }

      const data = await this.commonService.getAllRequestListWithTransaction(
        query,
        sort,
        start_from,
        per_page,
        userD,
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
        'src/controller/corporate/corporate.service.ts-findCorporateRequests',
        body,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for verify Fundraiser request by corporate admin
  public async verifyFundraiserRequest(
    fundraiserRequestVerifyDto: FundraiserRequestVerifyDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        fundraiserRequestVerifyDto,
      );
      let notiMsg;
      const userDetail = this.request.user;
      // Retrieve the request data
      const reqData: any = await this.causeRequestModel
        .findById({ _id: fundraiserRequestVerifyDto.request_id })
        .select({
          _id: 1,
          reference_id: 1,
          corporate_id: 1,
          user_id: 1,
          category_slug: 1,
          category_name: 1,
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
        const requestUserIds = [reqData.user_id, userDetail._id];

        const updateData: any = {
          $set: {
            status: fundraiserRequestVerifyDto.status,
          },
        };
        let status;

        const changeData = {
          '{{category}}': reqData.category_name,
          '{{refId}}': reqData.reference_id,
          '{{corporateId}}': reqData.corporate_id,
          '{{corporateName}}': userDetail.corporate_data._id,
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
            mConfig.noti_msg_request_arrive_in_corporate,
            changeData,
          );
          //send Notification to all user for new request arrive
          const allInput = {
            message: noti_msg,
            title: mConfig.noti_title_request_arrive,
            type: reqData.category_slug,
            categorySlug: reqData.category_slug,
            requestUserId: reqData.user_id,
            corporateId: reqData.corporate_id,
            requestId: reqData._id,
            forCorporate: true,
          };

          //send notification to corporate user only
          // this.commonService.sendAllUsersNotification(
          //   requestUserIds,
          //   allInput,
          //   reqData.country_data.country,
          // );
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
            mConfig.noti_msg_request_rejected_by_corporate,
            changeData,
          );
          notiMsg = noti_msg;
        }
        await this.causeRequestModel
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
          userId: reqData.user_id,
          corporateId: reqData.corporate_id,
          message: notiMsg,
          forCorporate: true,
        };
        this.commonService.notification(input);

        const notiTitle2 = await this.commonService.changeString(
          mConfig.noti_title_admin_request_verify,
          changeData,
        );

        const notiMsg2 = await this.commonService.changeString(
          mConfig.noti_msg_request_verify_by_corporate,
          changeData,
        );

        //send notification to admin
        const input2: any = {
          title: notiTitle2,
          type: reqData.category_slug,
          requestId: reqData._id,
          categorySlug: reqData.category_slug,
          requestUserId: reqData.user_id,
          corporateId: reqData.corporate_id,
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

        const log: any = {
          request_id: reqData._id,
          description: `${reqData.category_name} request has been ${status}`,
        };
        this.logService.createActivityLog(log);

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
        'src/controller/corporate/corporate.service.ts-verifyFundraiserRequest',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for corporate user list
  public async userList(userListDto: UserListDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        userListDto,
      );
      const user = this.request.user;
      const where = [];

      const search: any = {
        status: 'active',
      };
      const query: any = {
        corporate_id: ObjectID(userListDto.id),
        user_id: { $ne: ObjectID(user._id) },
      };
      // Construct search conditions
      if (!_.isUndefined(userListDto.search) && userListDto.search) {
        search['$or'] = [
          { user_name: new RegExp(userListDto.search, 'i') },
          { 'user_data.email': new RegExp(userListDto.search, 'i') },
          { 'user_data.phone': new RegExp(userListDto.search, 'i') },
        ];
      }
      if (!_.isUndefined(userListDto.status) && userListDto.status) {
        search.status = userListDto.status;
      }
      if (!_.isEmpty(userListDto.role) && userListDto.role) {
        search['role_data.role'] = { $in: userListDto.role };
      }
      // MongoDB aggregation pipeline stages
      const lookup = {
        $lookup: {
          from: 'user',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_data',
        },
      };
      const lookupActivity = {
        $lookup: {
          from: 'corporate_activity_log',
          localField: 'user_id',
          foreignField: 'user_id',
          as: 'activityData',
        },
      };
      const addFields = {
        $addFields: {
          user_name: {
            $concat: ['$user_data.first_name', ' ', '$user_data.last_name'],
          },
          firstCurrency: {
            $arrayElemAt: ['$user_data.country_data.currency', 0],
          },
        },
      };
      // Retrieve the total count of corporate users
      const total = await this.corporateUsers
        .aggregate([
          {
            $match: query,
          },
          lookup,
          {
            $unwind: '$user_data',
          },
          addFields,
          {
            $lookup: {
              from: 'corporate_roles',
              localField: 'role_id',
              foreignField: '_id',
              as: 'role_data',
            },
          },
          {
            $unwind: {
              path: '$role_data',
              preserveNullAndEmptyArrays: true,
            },
          },
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

      let {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
      } = await this.commonService.sortFilterPagination(
        userListDto.page,
        userListDto.per_page,
        total_record,
        sortData,
        -1,
        'createdAt',
      );

      if (!_.isUndefined(userListDto.sort_by) && userListDto.sort_by) {
        const sortBy = userListDto.sort_by;
        if (sortBy == 'asce') {
          sort = { user_name: 1 };
        } else if (sortBy == 'desc') {
          sort = { user_name: -1 };
        } else if (sortBy == 'old_to_new') {
          sort = { createdAt: 1 };
        } else if (sortBy == 'new_to_old') {
          sort = { createdAt: -1 };
        } else if (sortBy == 'last_week') {
          const startDate =
            moment()
              .subtract(1, 'weeks')
              .startOf('isoWeek')
              .format('YYYY-MM-DD') + 'T00:00:00Z';
          const endDate =
            moment()
              .subtract(1, 'weeks')
              .endOf('isoWeek')
              .format('YYYY-MM-DD') + 'T23:59:59Z';

          where.push({
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          });
        } else if (sortBy == 'last_month') {
          // Filter based on the last month
          const startDate =
            moment()
              .subtract(1, 'month')
              .startOf('month')
              .format('YYYY-MM-DD') + 'T00:00:00Z';
          const endDate =
            moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD') +
            'T23:59:59Z';

          where.push({
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          });
        }
      }
      // Retrieve the list of corporate users
      const corporateUserslist = await this.corporateUsers
        .aggregate([
          {
            $match: query,
          },
          lookup,
          {
            $unwind: '$user_data',
          },
          {
            $lookup: {
              from: 'transactions',
              let: { id: '$corporate_id', userId: '$user_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$corporate_id', '$$id'] },
                        { $eq: ['$donor_user_id', '$$userId'] },
                        {
                          $in: [
                            '$transaction_type',
                            ['donation', 'fund-donated'],
                          ],
                        },
                        { $ne: ['$saayam_community', true] },
                      ],
                    },
                  },
                },
              ],
              as: 'donations',
            },
          },
          addFields,
          {
            $lookup: {
              from: 'corporate_roles',
              localField: 'role_id',
              foreignField: '_id',
              as: 'role_data',
            },
          },
          {
            $unwind: {
              path: '$role_data',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: search,
          },
          lookupActivity,
          {
            $project: {
              _id: 1,
              status: 1,
              is_admin: 1,
              createdAt: 1,
              user_name: 1,
              user_id: 1,
              corporate_id: 1,
              email: '$user_data.email',
              phone: '$user_data.phone',
              phone_code: '$user_data.phone_code',
              phone_country_short_name: '$user_data.phone_country_short_name',
              activity_log_count: { $size: '$activityData' },
              user_image: {
                $concat: [authConfig.imageUrl, 'user/', '$user_data.image'],
              },
              role: {
                $ifNull: ['$role_data.role', ''],
              },
              role_id: {
                $ifNull: ['$role_data._id', ''],
              },
              donated: { $sum: '$donations.converted_amt' },
              currency: '$firstCurrency.symbol',
            },
          },
          { $sort: sort },
          { $skip: start_from },
          { $limit: per_page },
        ])
        .exec();

      return res.json({
        data: corporateUserslist,
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
        'src/controller/corporate/corporate.service.ts-userList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for corporate user list
  public async adminUserList(id: string, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const where = [];

      const search: any = {
        status: 'active',
      };
      const query: any = {
        corporate_id: ObjectID(id),
      };
      // MongoDB aggregation pipeline stages
      const lookup = {
        $lookup: {
          from: 'user',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_data',
        },
      };
      const addFields = {
        $addFields: {
          user_name: {
            $concat: ['$user_data.first_name', ' ', '$user_data.last_name'],
          },
          firstCurrency: {
            $arrayElemAt: ['$user_data.country_data.currency', 0],
          },
        },
      };
      // Retrieve the total count of corporate users
      const total = await this.corporateUsers
        .aggregate([
          {
            $match: query,
          },
          lookup,
          {
            $unwind: '$user_data',
          },
          addFields,
          {
            $lookup: {
              from: 'corporate_roles',
              localField: 'role_id',
              foreignField: '_id',
              as: 'role_data',
            },
          },
          {
            $unwind: {
              path: '$role_data',
              preserveNullAndEmptyArrays: true,
            },
          },
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
      // Perform sorting, filtering, and pagination
      let {
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

      const corporateUserslist = await this.corporateUsers
        .aggregate([
          {
            $match: query,
          },
          lookup,
          {
            $unwind: '$user_data',
          },
          {
            $lookup: {
              from: 'transactions',
              let: { id: '$corporate_id', userId: '$user_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$corporate_id', '$$id'] },
                        { $eq: ['$donor_user_id', '$$userId'] },
                        {
                          $in: [
                            '$transaction_type',
                            ['donation', 'fund-donated'],
                          ],
                        },
                        { $ne: ['$saayam_community', true] },
                      ],
                    },
                  },
                },
              ],
              as: 'donations',
            },
          },
          addFields,
          {
            $lookup: {
              from: 'corporate_roles',
              localField: 'role_id',
              foreignField: '_id',
              as: 'role_data',
            },
          },
          {
            $unwind: {
              path: '$role_data',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: search,
          },
          {
            $project: {
              _id: 1,
              status: 1,
              is_admin: 1,
              createdAt: 1,
              user_name: 1,
              user_id: 1,
              corporate_id: 1,
              email: '$user_data.email',
              phone: '$user_data.phone',
              phone_code: '$user_data.phone_code',
              phone_country_short_name: '$user_data.phone_country_short_name',
              user_image: {
                $concat: [authConfig.imageUrl, 'user/', '$user_data.image'],
              },
              role: {
                $ifNull: ['$role_data.role', ''],
              },
              role_id: {
                $ifNull: ['$role_data._id', ''],
              },
              donated: { $sum: '$donations.converted_amt' },
              currency: '$firstCurrency.symbol',
            },
          },
          { $sort: sort },
          { $skip: start_from },
          { $limit: per_page },
        ])
        .exec();

      return res.json({
        data: corporateUserslist,
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
        'src/controller/corporate/corporate.service.ts-adminUserList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for block corporate user
  public async blockUser(blockUserDto: BlockUserDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        blockUserDto,
      );
      const user = this.request.user;
      // Check if the user has the necessary permissions to perform the block operation
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        const corporateData = await this.corporateModel
          .findOne({
            _id: ObjectID(blockUserDto.corporate_id),
          })
          .select({ _id: 1, organization_name: 1 })
          .lean();

        if (_.isEmpty(corporateData)) {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        } else {
          // Block the user by updating their status to 'blocked' in the corporateUsers collection
          const corporateuser = await this.corporateUsers
            .findOneAndUpdate(
              {
                user_id: ObjectID(blockUserDto.user_id),
                corporate_id: ObjectID(blockUserDto.corporate_id),
              },
              { status: 'blocked' },
              {
                new: true,
              },
            )
            .lean();

          if (!corporateuser) {
            return res.json({
              success: false,
              message: mConfig.No_data_found,
            });
          } else {
            const notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_block_from_corporate,
              {
                '{{corporate_name}}': corporateData.organization_name,
              },
            );

            const input: any = {
              title: mConfig.noti_title_block_from_corporate,
              type: 'block-corporate-user',
              corporateId: corporateData._id,
              categorySlug: 'corporate',
              message: notiMsg,
              userId: blockUserDto.user_id,
              forCorporate: true,
            };
            //send notification to blocked user
            this.commonService.notification(input);
            return res.json({
              success: true,
              message: mConfig.User_block,
            });
          }
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-blockUser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for unblock corporate user
  public async unblockUser(unblockUserDto: BlockUserDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        unblockUserDto,
      );
      const user = this.request.user;
      //if user status is active and user have is_admin true then It allow to unblock
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        const corporateData = await this.corporateModel
          .findOne({
            _id: ObjectID(unblockUserDto.corporate_id),
          })
          .select({ _id: 1, organization_name: 1 })
          .lean();

        if (_.isEmpty(corporateData)) {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        } else {
          const corporateuser = await this.corporateUsers
            .findOneAndUpdate(
              {
                user_id: ObjectID(unblockUserDto.user_id),
                corporate_id: ObjectID(unblockUserDto.corporate_id),
              },
              { status: 'active' },
              {
                new: true,
              },
            )
            .lean();

          if (!corporateuser) {
            return res.json({
              success: false,
              message: mConfig.No_data_found,
            });
          } else {
            const notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_unblock_from_corporate,
              {
                '{{corporate_name}}': corporateData.organization_name,
              },
            );
            const input: any = {
              title: mConfig.noti_title_unblock_from_corporate,
              type: 'unblock-corporate-user',
              corporateId: corporateData._id,
              categorySlug: 'corporate',
              message: notiMsg,
              userId: unblockUserDto.user_id,
              forCorporate: true,
            };
            //send notification to unblocked user
            this.commonService.notification(input);
            return res.json({
              success: true,
              message: mConfig.User_unblock,
            });
          }
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-unblockUser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for add as admin user in corporate
  public async addRemoveAdmin(addRemoveAdminDto: AddRemoveAdminDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        addRemoveAdminDto,
      );
      const user = this.request.user;
      //if user status is active and user have is_admin true then It allow to unblock
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        const corporateData = await this.corporateModel
          .findOne({
            _id: ObjectID(addRemoveAdminDto.corporate_id),
          })
          .select({ _id: 1, organization_name: 1 })
          .lean();

        if (_.isEmpty(corporateData)) {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        } else {
          let updateData = {};
          if (addRemoveAdminDto.type == 'add') {
            updateData = { is_admin: true };
          } else if (addRemoveAdminDto.type == 'remove') {
            updateData = { is_admin: false };
          }

          const corporateuser = await this.corporateUsers
            .findOneAndUpdate(
              {
                user_id: ObjectID(addRemoveAdminDto.user_id),
                corporate_id: ObjectID(addRemoveAdminDto.corporate_id),
              },
              updateData,
              {
                new: true,
              },
            )
            .lean();

          if (!corporateuser) {
            return res.json({
              success: false,
              message: mConfig.No_data_found,
            });
          } else {
            const notiTitle = await this.commonService.changeString(
              mConfig.noti_title_add_or_remove_admin,
              {
                '{{status}}':
                  addRemoveAdminDto.type == 'add' ? 'Added' : 'Removed',
              },
            );

            const notiMessage = await this.commonService.changeString(
              mConfig.noti_msg_add_or_remove_admin,
              {
                '{{status}}':
                  addRemoveAdminDto.type == 'add' ? 'added' : 'removed',
                '{{corporate}}': corporateData.organization_name,
              },
            );
            const input: any = {
              title: notiTitle,
              type:
                addRemoveAdminDto.type == 'add'
                  ? 'add-as-admin'
                  : 'remove-as-admin',
              corporateId: corporateData._id,
              categorySlug: 'corporate',
              message: notiMessage,
              userId: addRemoveAdminDto.user_id,
              forCorporate: true,
            };
            //send notification to added or removed user
            this.commonService.notification(input);

            return res.json({
              success: true,
              message:
                addRemoveAdminDto.type == 'add'
                  ? mConfig.user_added_as_admin
                  : mConfig.user_removed_as_admin,
            });
          }
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-addRemoveAdmin',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for remove user from corporate
  public async removeUser(removeUserDto: BlockUserDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        removeUserDto,
      );
      const user = this.request.user;
      //if user status is active and user have is_admin true then It allow to next
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        const corporateData = await this.corporateModel
          .findOne({
            _id: ObjectID(removeUserDto.corporate_id),
          })
          .select({ _id: 1, organization_name: 1 })
          .lean();

        if (_.isEmpty(corporateData)) {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        } else {
          const corporateuser = await this.corporateUsers
            .findOneAndUpdate(
              {
                user_id: ObjectID(removeUserDto.user_id),
                corporate_id: ObjectID(removeUserDto.corporate_id),
              },
              { status: 'removed' },
              {
                new: true,
              },
            )
            .lean();

          if (!corporateuser) {
            return res.json({
              success: false,
              message: mConfig.No_data_found,
            });
          } else {
            await this.userModel
              .findByIdAndUpdate(
                { _id: removeUserDto.user_id },
                { $unset: { corporate_id: 1, is_corporate_user: 1 } },
              )
              .lean();

            const notiMsg = await this.commonService.changeString(
              mConfig.noti_msg_remove_from_corporate,
              {
                '{{corporate_name}}': corporateData.organization_name,
              },
            );

            const input: any = {
              title: mConfig.noti_title_remove_from_corporate,
              type: 'remove-from-corporate',
              corporateId: corporateData._id,
              categorySlug: 'corporate',
              message: notiMsg,
              userId: removeUserDto.user_id,
              forCorporate: true,
            };
            //send notification to unblocked user
            this.commonService.notification(input);
            return res.json({
              success: true,
              message: mConfig.user_removed_from_corporate,
            });
          }
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-removeUser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for assign role to user in corporate
  public async assignRole(assignRoleDto: AssignRoleDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        assignRoleDto,
      );
      const user = this.request.user;
      //if user status is active and user have is_admin true then It allow to assign role
      if (
        user.is_corporate ||
        (user.is_corporate_user &&
          !_.isEmpty(user.corporate_data) &&
          !_.isUndefined(user.corporate_data.user_status) &&
          !_.isUndefined(user.corporate_data.is_admin) &&
          user.corporate_data.user_status == 'active' &&
          user.corporate_data.is_admin)
      ) {
        const corporateData = await this.corporateModel
          .findOne({
            _id: ObjectID(assignRoleDto.corporate_id),
          })
          .select({ _id: 1 })
          .lean();

        if (_.isEmpty(corporateData)) {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        } else {
          const corporateuser = await this.corporateUsers
            .findOneAndUpdate(
              {
                user_id: ObjectID(assignRoleDto.user_id),
                corporate_id: ObjectID(assignRoleDto.corporate_id),
              },
              { role_id: ObjectID(assignRoleDto.role_id) },
              {
                new: true,
              },
            )
            .lean();

          if (!corporateuser) {
            return res.json({
              success: false,
              message: mConfig.No_data_found,
            });
          } else {
            return res.json({
              success: true,
              message: mConfig.role_assigned,
            });
          }
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.You_dont_have_permission,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-assignRole',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //leave from corporate
  public async leaveCorporate(res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const userDetail = this.request.user;

      const corporateuser = await this.corporateUsers
        .findOne({
          user_id: ObjectID(userDetail._id),
        })
        .select({ _id: 1, corporate_id: 1, user_id: 1 })
        .lean();
      if (_.isEmpty(corporateuser)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        //Get total approved corporate type requests data for specific user
        const causeRequest: any = await this.causeRequestModel
          .count({
            status: 'approve',
            active_type: 'corporate',
            corporate_id: ObjectID(corporateuser.corporate_id),
            user_id: ObjectID(userDetail._id),
            is_deleted: { $ne: true },
          })
          .lean();

        if (causeRequest > 0) {
          return res.json({
            message: mConfig.not_leave_from_corporate,
            success: false,
          });
        } else {
          await this.corporateUsers
            .deleteOne({ _id: corporateuser._id })
            .lean();
          await this.userModel
            .findByIdAndUpdate(
              { _id: userDetail._id },
              { $unset: { corporate_id: 1, is_corporate_user: 1 } },
            )
            .lean();

          const updateData = {
            '{{uname}}': userDetail.first_name + ' ' + userDetail.last_name,
            '{{organization}}': userDetail.corporate_data.organization_name,
          };
          const organizerMsg = await this.commonService.changeString(
            mConfig.noti_msg_leave_corporation,
            updateData,
          );
          const adminMsg = await this.commonService.changeString(
            mConfig.noti_msg_adm_leave_corporation,
            updateData,
          );

          //send notification to corporate admins
          const input: any = {
            title: mConfig.noti_title_leave_corporation,
            type: 'leave-corporate',
            corporateId: corporateuser.corporate_id,
            categorySlug: 'corporate',
            message: organizerMsg,
            forCorporate: true,
          };
          const usersId = await this.commonService.getCorporateAdmins(
            corporateuser.corporate_id,
          );
          this.commonService.sendAllNotification(usersId, input);

          //send notification to saayam admins
          const input1: any = {
            title: mConfig.noti_title_leave_corporation,
            type: 'corporate',
            corporateId: corporateuser.corporate_id,
            message: adminMsg,
          };
          this.commonService.sendAdminNotification(input1);

          return res.json({
            message: mConfig.leave_from_corporate,
            success: true,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-leaveCorporate',
      );
      return res.json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //Api for get donations history of user
  public async userDonations(
    userId,
    param,
    res: any,
  ): Promise<TransactionDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );

      const userData = this.request.user;
      //Handle mongo query
      const query: any = {
        donor_id: ObjectID(userId),
        corporate_id: ObjectID(userData.corporate_data._id),
        transaction_type: { $in: ['donation', 'fund-donated'] },
        saayam_community: { $exists: false },
        $or: [
          { eventCode: 'AUTHORISATION', success: true },
          { eventCode: 'Authorised' },
          { status: 'complete' },
          { status: 'completed' },
        ],
      };

      const total_record = await this.transactionModel
        .countDocuments(query)
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
        null,
        param.sort_type,
        param.sort,
      );

      const data = await this.transactionModel.aggregate(
        [
          {
            $match: query,
          },
          {
            $lookup: {
              from: 'fund',
              let: { id: '$to_fund_id', type: '$transaction_type' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$type', 'fund-donated'] },
                        { $eq: ['$$id', '$_id'] },
                      ],
                    },
                  },
                },
              ],
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
              let: { id: '$request_id', type: '$transaction_type' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$$type', 'donation'] },
                        { $eq: ['$$id', '$_id'] },
                      ],
                    },
                  },
                },
              ],
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
            $project: {
              ngo_id: {
                $cond: {
                  if: { $eq: ['$is_user_ngo', true] },
                  then: '$user_id',
                  else: null,
                },
              },
              _id: 1,
              createdAt: 1,
              currency: 1,
              transaction_amount: '$amount',
              transaction_type: 1,
              category_name: 1,
              request_id: 1,
              fund_id: 1,
              to_fund_id: 1,
              is_user_ngo: 1,
              user_id: 1,
              country_data: 1,
              user_image: {
                $cond: {
                  if: { $eq: ['$transaction_type', 'donation'] },
                  then: {
                    $concat: [
                      authConfig.imageUrl,
                      'request/',
                      {
                        $arrayElemAt: [
                          '$reqData.form_data.files.upload_cover_photo',
                          0,
                        ],
                      },
                    ],
                  },
                  else: {
                    $concat: [
                      authConfig.imageUrl,
                      'fund/',
                      { $toString: '$fundData._id' },
                      '/',
                      {
                        $arrayElemAt: ['$fundData.form_data.files.photos', 0],
                      },
                    ],
                  },
                },
              },
              title_of_fundraiser: {
                $cond: {
                  if: { $eq: ['$transaction_type', 'donation'] },
                  then: '$reqData.form_data.title_of_fundraiser',
                  else: '$fundData.form_data.title_of_fundraiser',
                },
              },
              is_deleted: {
                $cond: {
                  if: {
                    $gt: ['$reqData', null],
                  },
                  then: '$reqData.is_deleted',
                  else: '$fundData.is_deleted',
                },
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
        'src/controller/corporate/corporate.service.ts-userDonations',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list user log in corporate
  public async userLogList(userId, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const userData = this.request.user;
      const match = {
        corporate_id: ObjectID(userData.corporate_data._id),
        user_id: ObjectID(userId),
      };
      const lookup = {
        $lookup: {
          from: 'user',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData',
        },
      };
      //Get total count of docs which filter by match variable
      const total = await this.corporateActivityLog
        .aggregate([{ $match: match }, lookup, { $count: 'count' }])
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

      const result = await this.corporateActivityLog.aggregate(
        [
          { $match: match },
          lookup,
          {
            $unwind: '$userData',
          },
          {
            $addFields: {
              user_name: {
                $concat: ['$userData.first_name', ' ', '$userData.last_name'],
              },
            },
          },
          {
            $project: {
              request_id: 1,
              fund_id: 1,
              drive_id: 1,
              user_name: 1,
              description: 1,
              createdAt: 1,
              user_image: {
                $concat: [authConfig.imageUrl, 'user/', '$userData.image'],
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
        'src/controller/corporate/corporate.service.ts-userLogList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for check invite in corporate
  public async checkInviteEmail(email: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { email },
      );
      const userData = this.request.user;
      if (_.isUndefined(email)) {
        return res.json({
          success: false,
          message: mConfig.email_missing,
        });
      }
      // Search for existing email invitations with specific types.
      const existEmail = await this.corporateInviteModel
        .aggregate([
          {
            $match: {
              email: email,
              type: ['upload_csv', 'email_invite'],
            },
          },
          {
            $lookup: {
              from: 'corporates',
              localField: 'corporate_id',
              foreignField: '_id',
              as: 'corporate_data',
            },
          },
          { $unwind: '$corporate_data' },
          {
            $project: {
              _id: 1,
              corporate_id: 1,
              corporate_name: '$corporate_data.organization_name',
            },
          },
        ])
        .exec();

      if (!_.isEmpty(existEmail)) {
        await existEmail.map(async function (corporate) {
          const notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_team_member_added,
            { '{{organization_name}}': corporate.organization_name },
          );
          const input = {
            message: notiMsg,
            title: corporate.organization_name,
            type: 'corporate',
            corporateId: corporate.corporate_id,
            additionalData: { status: 'pending' },
            userId: userData._id,
          };
          await this.commonService.notification(input, false, true);
        });

        return res.json({
          success: true,
          data: existEmail.length,
        });
      } else {
        return res.json({
          success: true,
          data: 0,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-checkInviteEmail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for check invite in corporate
  public async checkBusinessEmail(
    businessEmailDto: BusinessEmailDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        businessEmailDto,
      );
      // Check if the provided email exists in the corporate users' database for the specified corporate_id.
      const existCorporateEmail: any = await this.corporateUsers
        .count({
          email: businessEmailDto.email,
          corporate_id: ObjectID(businessEmailDto.corporate_id),
        })
        .lean();
      // Check if the provided email exists in the general user database.
      const existUserEmail: any = await this.userModel
        .count({
          email: businessEmailDto.email,
        })
        .lean();

      if (existCorporateEmail > 0 || existUserEmail > 0) {
        return res.json({
          success: true,
        });
      } else {
        return res.json({
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-checkBusinessEmail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get corporate detail in admin
  public async getCorporateDetail(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      //Get particular doc data by id
      let corporateData = await this.commonService.getCorporateDetail(id);
      if (_.isEmpty(corporateData)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }
      return res.json({
        success: true,
        data: corporateData,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-getCorporateDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update corporate logo
  public async updateProfilePhoto(
    file: object,
    updateProfileDto: UpdateProfileDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateProfileDto,
      );
      const corporate: any = await this.corporateModel
        .findOne({
          _id: ObjectID(updateProfileDto.id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          organization_logo: {
            $arrayElemAt: ['$form_data.files.organization_logo', 0],
          },
          form_settings: 1,
        })
        .lean();
      if (_.isEmpty(corporate)) {
        return res.json({
          success: true,
          message: mConfig.No_data_found,
        });
      } else {
        //Get file name which created on this folder /uploads/temp
        const imageId: any = await this.commonService.checkAndLoadImage(
          file,
          'corporate/' + corporate._id,
        );

        //remove profile image
        if (
          (updateProfileDto.removeFile || !_.isEmpty(file)) &&
          !_.isEmpty(corporate.organization_logo)
        ) {
          await this.commonService.s3ImageRemove(
            'corporate/' + corporate._id,
            corporate.organization_logo,
          );
        }

        //update image in database
        const image =
          imageId && imageId.file_name
            ? imageId.file_name
            : updateProfileDto.removeFile
            ? null
            : corporate.organization_logo;

        let value;
        let images;

        if (imageId && imageId.file_name) {
          value = [imageId.file_name];
          images = [
            {
              OriginalName: imageId.file_name,
              mime: file['mimetype'],
              path: '',
              server: true,
            },
          ];
        } else if (updateProfileDto.removeFile) {
          value = null;
          images = [];
        }
        //update date in form settings
        const formSetting = await this.commonService.updateFormSettingData(
          'organization_logo',
          value,
          corporate.form_settings,
          images,
        );

        await this.corporateModel
          .findOneAndUpdate(
            { _id: ObjectID(updateProfileDto.id) },
            {
              'form_data.files.organization_logo': [image],
              form_settings: formSetting,
            },
            { new: true },
          )
          .select({ id: 1 })
          .lean();
        //Update user data in request

        const input = {
          message: mConfig.noti_msg_user_profile_update,
          title: mConfig.noti_title_user_profile_update,
          type: 'profile_update',
          userId: this.request.user._id,
          forCorporate: true,
        };
        await this.commonService.notification(input, true);

        const response = {
          success: true,
          message: mConfig.Profile_updated,
        };
        return res.json(response);
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/corporate/corporate.service.ts-updateProfilePhoto',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
