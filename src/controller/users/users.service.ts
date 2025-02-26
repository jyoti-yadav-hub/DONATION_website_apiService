/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prettier/prettier */
import fs from 'fs';
import ip from 'ip';
import { _ } from 'lodash';
import moment from 'moment';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  RequestModel,
  RequestDocument,
} from '../request/entities/request.entity';
import { HttpService } from '@nestjs/axios';
import {
  CurrencyModel,
  CurrencyDocument,
} from '../currency/entities/currency.entity';
import {
  FavouriteNgo,
  FavouriteNgoDocument,
} from '../ngo/entities/favourite_ngo.entity';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  TransactionModel,
  TransactionDocument,
} from '../donation/entities/transaction.entity';
import {
  NgoUpdated,
  NgoUpdatedDocument,
} from '../ngo/entities/ngo_updated_data.entity';
import { BankService } from '../bank/bank.service';
import { LoginUserDto } from './dto/login-user.dto';
import { Inject, Injectable } from '@nestjs/common';
import { CheckUserDto } from './dto/check-user.dto';
import {
  PaymentProcessModel,
  PaymentProcessDocument,
} from '../donation/entities/payment-process.entity';
import { ChatGateway } from '../socket/chat.gateway';
import {
  Notification,
  NotificationDocument,
} from '../notification/entities/notification.entity';
import { CreateDto } from './dto/create.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { authConfig } from '../../config/auth.config';
import admin, { ServiceAccount } from 'firebase-admin';
import mConfig from '../../config/message.config.json';
import { SocialLoginDto } from './dto/social-login.dto';
import {
  FeatureTransactionModel,
  FeatureTransactionDocument,
} from '../donation/entities/feature-transaction.entity';
import { StripeService } from 'src/stripe/stripe.service';
import { ChangeUserRoleDto } from './dto/change-role.dto';
import { SelectCausesDto } from './dto/select-causes.dto';
import { QueueService } from '../../common/queue.service';
import { SocialSignupDto } from './dto/social-signup.dto';
import { User, UserDocument } from './entities/user.entity';
import { UserToken, UserTokenDocument } from './entities/user-token.entity';
import {
  AdminNotification,
  AdminNotificationDocument,
} from '../notification/entities/admin-notification.entity';
import { CommonService } from '../../common/common.service';
import firebaseJson from '../../config/firebase.config.json';
import { AccessTokenDto } from './dto/access-token-login.dto';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
import { ErrorlogService } from '../error-log/error-log.service';
import { Bank, BankDocument } from '../bank/entities/bank.entity';
import { BlockedAccountDto } from './dto/blocked-account.dto';
import { DeleteAccountDto } from '../users/dto/delete-account.dto';
import { Admin, AdminDocument } from '../admin/entities/admin.entity';
import { SocialData, SocialDataDocument } from './entities/socialData.entity';
import { Comment, CommentDocument } from '../request/entities/comments.entity';
import { LogService } from 'src/common/log.service';
import { platform } from 'os';
import { SendOtpDto } from './dto/send-otp.dto';
import { OtpVerifyModel, OtpVerifyDocument } from './entities/otp-verify';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { WebSignupDto } from './dto/web-signup.dto';
import { GuestSignupDto } from './dto/guest-signup.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';
import { InterviewSignupDto } from './dto/interview-signup.dto';
import { InterviewLogin } from './dto/interview-login.dto';
import { SetActiveRoleDto } from './dto/set-active-role.dto';
import {
  Corporate,
  CorporateDocument,
} from '../corporate/entities/corporate.entity';

const timezone = require('country-timezone');
const ObjectID = require('mongodb').ObjectID;
const verifyAppleToken = require('verify-apple-id-token').default;
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config({
  path: './.env',
});

const adminConfig: ServiceAccount = {
  projectId: firebaseJson.project_id,
  clientEmail: firebaseJson.client_email,
  privateKey: firebaseJson.private_key.replace(/\\n/g, '\n'),
};
admin.initializeApp({
  credential: admin.credential.cert(adminConfig),
});
@Injectable()
export class UsersService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly stripeService: StripeService,
    @InjectModel(OtpVerifyModel.name)
    private otpVerifyModel: Model<OtpVerifyDocument>,
    @InjectModel(NgoUpdated.name)
    private ngoUpdatedModel: Model<NgoUpdatedDocument>,
    @InjectModel(SocialData.name)
    private socialDataModel: Model<SocialDataDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(FavouriteNgo.name)
    private favouriteNgoModel: Model<FavouriteNgoDocument>,
    @InjectModel(Comment.name)
    private commentModel: Model<CommentDocument>,
    @InjectModel(PaymentProcessModel.name)
    private paymentProcessModel: Model<PaymentProcessDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(AdminNotification.name)
    private adminNotificationModel: Model<AdminNotificationDocument>,
    @InjectModel(Bank.name)
    private bankModel: Model<BankDocument>,
    @InjectModel(FeatureTransactionModel.name)
    private featureTransactionModel: Model<FeatureTransactionDocument>,
    @InjectModel(Ngo.name) private ngoModel: Model<NgoDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserToken.name)
    private userTokenModel: Model<UserTokenDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Corporate.name)
    private corporateModel: Model<CorporateDocument>,
    private jwtService: JwtService,
    private httpService: HttpService,
    private readonly chatGateway: ChatGateway,
    private readonly queueService: QueueService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    private readonly bankService: BankService,
  ) {}

  //Api for register user
  public async create(
    file: object,
    createDto: CreateDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createDto,
      );
      let user;
      const existUser = await this.userModel
        .findOne({
          phone_code: createDto.phone_code,
          phone: createDto.phone,
          is_deleted: false,
        })
        .lean();
      //check existUser is not empty and not undefined
      if (_.isEmpty(existUser)) {
        await admin
          .auth()
          .getUser(createDto.uId)
          .then(async (result) => {
            if (result) {
              const imageId: any = await this.commonService.checkAndLoadImage(
                file,
                'user',
              );
              const latitude = Number(createDto.latitude);
              const longitude = Number(createDto.longitude);
              // Add code for no country found.
              const countryData = await this.commonService.getCountry(
                createDto.country_name,
              );
              const timezonesName =
                await this.commonService.getTimezoneFromLatLon(
                  latitude,
                  longitude,
                );

              const dtl: any = {
                first_name: createDto.first_name,
                last_name: createDto.last_name,
                phone_code: createDto.phone_code,
                phone: createDto.phone,
                phone_country_full_name: createDto.phone_country_full_name,
                phone_country_short_name: createDto.phone_country_short_name,
                email: createDto.email,
                is_donor: createDto.is_donor,
                is_user: createDto.is_user,
                is_volunteer: createDto.is_volunteer,
                display_name: createDto.display_name,
                location: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                  city: createDto.city,
                },
                image: imageId && imageId.file_name ? imageId.file_name : null,
                is_restaurant: false,
                restaurant_name: null,
                restaurant_location: null,
                is_veg: false,
                country_data: countryData ? countryData : null,
                default_country: createDto.country_name,
                time_zone: timezonesName,
                race: createDto.race ? createDto.race : null,
                religion: createDto.religion ? createDto.religion : null,
                blood_group: createDto.blood_group || null,
                dob: createDto.dob || null,
                gender: createDto.gender || null,
                my_causes: createDto.my_causes,
              };

              const createUser = new this.userModel(dtl);
              user = await createUser.save();

              const result1 = await this.makeLogin(
                user,
                createDto.uuid,
                createDto.platform,
              );
              return res.json(result1);
            } else {
              return res.json({
                success: false,
                message: mConfig.User_not_found,
              });
            }
          });
      } else {
        return res.json({
          success: false,
          message: mConfig.Phone_is_already_exist,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for register guest user
  public async createUser(
    createUserDto: CreateUserDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createUserDto,
      );
      let user = await this.userModel
        .findOne({
          phone_code: createUserDto.phone_code,
          phone: createUserDto.phone,
          is_deleted: false,
        })
        .lean();

      if (_.isEmpty(user)) {
        await admin
          .auth()
          .getUser(createUserDto.uId)
          .then(async (result) => {
            if (result) {
              const latitude = Number(createUserDto.latitude);
              const longitude = Number(createUserDto.longitude);
              // Add code for no country found.
              const countryData = await this.commonService.getCountry(
                createUserDto.country_name,
              );
              const timezonesName =
                await this.commonService.getTimezoneFromLatLon(
                  latitude,
                  longitude,
                );

              const dtl: any = {
                first_name: createUserDto.name,
                display_name: createUserDto.name,
                phone_code: createUserDto.phone_code,
                phone: createUserDto.phone,
                phone_country_full_name: createUserDto.phone_country_full_name,
                phone_country_short_name:
                  createUserDto.phone_country_short_name,
                is_user: true,
                location: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                  city: createUserDto.city,
                },
                country_data: countryData ? countryData : null,
                default_country: createUserDto.country_name,
                time_zone: timezonesName,
              };
              const createUser = new this.userModel(dtl);
              user = await createUser.save();

              if (_.isEmpty(user)) {
                return res.json({
                  success: false,
                  message: mConfig.Invalid,
                });
              }
            } else {
              return res.json({
                success: false,
                message: mConfig.User_not_found,
              });
            }
          });
      }

      const result1 = await this.makeLogin(
        user,
        createUserDto.uuid,
        createUserDto.platform,
      );
      return res.json(result1);
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-createUser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update user profile
  public async update(
    file: object,
    updateUserDto: any,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateUserDto,
      );
      const user = await this.userModel.findById(this.request.user._id).lean();
      if (!user) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //upload profile image
        const imageId: any = await this.commonService.checkAndLoadImage(
          file,
          'user',
        );

        //remove profile image
        if (
          (updateUserDto.removeFile || !_.isEmpty(file)) &&
          !_.isEmpty(user.image)
        ) {
          await this.commonService.s3ImageRemove('user', user.image);
        }

        //update image in database
        updateUserDto.image =
          imageId && imageId.file_name
            ? imageId.file_name
            : updateUserDto.removeFile
            ? null
            : user.image;

        // update location
        if (
          !_.isUndefined(updateUserDto.longitude) &&
          !_.isUndefined(updateUserDto.latitude)
        ) {
          const latitude = Number(updateUserDto.latitude);
          const longitude = Number(updateUserDto.longitude);

          const timezonesName = await this.commonService.getTimezoneFromLatLon(
            latitude,
            longitude,
          );

          updateUserDto.location = {
            type: 'Point',
            coordinates: [longitude, latitude],
            city: updateUserDto.city,
          };
          updateUserDto.time_zone = timezonesName;

          delete updateUserDto.latitude;
          delete updateUserDto.longitude;
          delete updateUserDto.city;

          // update country related data
          if (!_.isEmpty(updateUserDto.country_name)) {
            const countryData = await this.commonService.getCountry(
              updateUserDto.country_name,
            );
            updateUserDto.country_data = countryData;
            delete updateUserDto.country_name;
          }
        }

        if (user.is_donor && !_.isUndefined(updateUserDto.is_restaurant)) {
          updateUserDto.is_restaurant = updateUserDto.is_restaurant;
          updateUserDto.restaurant_name = !_.isEmpty(
            updateUserDto.restaurant_name,
          )
            ? updateUserDto.restaurant_name
            : null;
          updateUserDto.is_veg = !_.isUndefined(updateUserDto.is_veg)
            ? updateUserDto.is_veg
            : false;

          // update location
          if (
            !_.isUndefined(updateUserDto.restaurant_longitude) &&
            !_.isUndefined(updateUserDto.restaurant_latitude)
          ) {
            const restaurantCoords = [
              Number(updateUserDto.restaurant_longitude),
              Number(updateUserDto.restaurant_latitude),
            ];

            updateUserDto.restaurant_location = {
              type: 'Point',
              coordinates: restaurantCoords,
              city: updateUserDto.restaurant_address,
            };
            delete updateUserDto.restaurant_longitude;
            delete updateUserDto.restaurant_latitude;
            delete updateUserDto.restaurant_address;
          } else {
            updateUserDto.restaurant_location = null;
          }
        }

        const updatedUser = await this.userModel
          .findByIdAndUpdate({ _id: user._id }, updateUserDto, { new: true })
          .lean();
        //Update user data in request

        const input = {
          message: mConfig.noti_msg_user_profile_update,
          title: mConfig.noti_title_user_profile_update,
          type: 'profile_update',
          userId: this.request.user._id,
        };
        await this.commonService.notification(input, true);
        // Update user data in various records with the provided user information.
        await this.commonService.updateUserInAllRecords(user, updatedUser);
        return res.json({
          message: mConfig.Profile_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for change user role
  public async changeRole(
    changeUserRoleDto: ChangeUserRoleDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        changeUserRoleDto,
      );
      const user = await this.userModel
        .findById(this.request.user._id)
        .select({ _id: 1 })
        .lean();
      if (!user) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        await this.userModel
          .updateOne({ _id: user._id }, { $set: changeUserRoleDto })
          .exec();
        return res.json({
          message: mConfig.Profile_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-changeRole',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for user login
  public async signin(loginUserDto: LoginUserDto, res: any): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        loginUserDto,
      );
      const user = await this.userModel
        .findOne({
          phone_code: loginUserDto.phone_code,
          phone: loginUserDto.phone,
          is_deleted: false,
        })
        .lean();

      if (!user) {
        return res.json({
          message: mConfig.User_not_found,
          success: false,
        });
      } else {
        // If user is already exists then check with Uid
        await admin
          .auth()
          .getUser(loginUserDto.uId)
          .then(async (userDtl) => {
            if (userDtl) {
              const result = await this.makeLogin(
                user,
                loginUserDto.uuid,
                loginUserDto.platform,
              );
              return res.json(result);
            } else {
              return res.json({
                success: false,
                message: mConfig.User_not_found,
              });
            }
          })
          .catch((err) => {
            if (err.code === 'auth/user-not-found') {
              return res.json({
                success: false,
                message: mConfig.User_not_found,
              });
            } else {
              return res.json({
                success: false,
                message: mConfig.Something_went_wrong,
              });
            }
          });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-signin',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //Api for get user from given id
  public async findById(id: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ _id: id });
      return user;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user/user.service.ts-findById',
      );
      return error;
    }
  }

  public async findByToken(token: any): Promise<User> {
    try {
      const user: any = await this.userTokenModel
        .aggregate([
          { $match: { access_token: token } },
          {
            $lookup: {
              from: 'user',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $lookup: {
              from: 'ngo',
              localField: 'user.ngo_data._id',
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
            $lookup: {
              from: 'corporates',
              localField: 'user.corporate_id',
              foreignField: '_id',
              as: 'corporateData',
            },
          },
          {
            $unwind: {
              path: '$corporateData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'corporate_users',
              localField: 'user._id',
              foreignField: 'user_id',
              as: 'corporateUser',
            },
          },
          {
            $unwind: {
              path: '$corporateUser',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'corporate_roles',
              localField: 'corporateUser.role_id',
              foreignField: '_id',
              as: 'roleData',
            },
          },
          {
            $unwind: {
              path: '$roleData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: '$user._id',
              is_deleted: '$user.is_deleted',
              country_data: '$user.country_data',
              religion: '$user.religion',
              race: '$user.race',
              time_zone: '$user.time_zone',
              restaurant_location: '$user.restaurant_location',
              is_restaurant: '$user.is_restaurant',
              location: '$user.location',
              is_volunteer: '$user.is_volunteer',
              is_donor: '$user.is_donor',
              is_user: '$user.is_user',
              image: '$user.image',
              email: '$user.email',
              phone_country_short_name: '$user.phone_country_short_name',
              phone_country_full_name: '$user.phone_country_full_name',
              phone: '$user.phone',
              phone_code: '$user.phone_code',
              display_name: '$user.display_name',
              last_name: '$user.last_name',
              first_name: '$user.first_name',
              is_ngo: '$user.is_ngo',
              ngo_data: {
                _id: '$ngoData._id',
                ngo_name: '$ngoData.form_data.ngo_name',
                ngo_status: '$ngoData.ngo_status',
                ngo_location: '$ngoData.ngo_address',
                ngo_causes: '$ngoData.ngo_causes',
                country_data: '$ngoData.country_data',
                upload_FCRA_certificate: '$ngoData.form_data.fcra_certificates',
              },
              access_token: 1,
              active_role: 1,
              is_corporate: '$user.is_corporate',
              is_corporate_user: '$user.is_corporate_user',
              corporate_data: {
                _id: '$corporateData._id',
                country_data: '$corporateData.country_data',
                organization_name: '$corporateData.organization_name',
                user_status: '$corporateUser.status',
                is_admin: '$corporateUser.is_admin',
                role: '$roleData.role',
                role_id: '$roleData._id',
                permissions: '$roleData.permissions',
              },
            },
          },
        ])
        .exec();

      let result: any = [];
      if (!_.isEmpty(user) && !_.isEmpty(user[0])) {
        result = user[0];
      }
      return result;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user/user.service.ts-findByToken',
      );
      return error;
    }
  }

  //Api for user list
  public async findAll(param, res: any): Promise<User[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {};
      let deleted = false;
      const filter = !_.isEmpty(param) ? param : [];
      //Handle mongoes query match object
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];

        const operator = param.operator ? param.operator.trim() : 'contains';

        if (!_.isUndefined(filter.only_ngo) && filter.only_ngo == 1) {
          query.push({ is_ngo: true });
        }
        if (
          !_.isUndefined(filter.only_corporate) &&
          filter.only_corporate == 1
        ) {
          query.push({ is_corporate: true });
        }
        if (
          !_.isUndefined(filter.only_benificiary) &&
          filter.only_benificiary == 1
        ) {
          query.push({ is_user: true });
        }
        if (!_.isUndefined(filter.only_donor) && filter.only_donor == 1) {
          query.push({ is_donor: true });
        }
        if (
          !_.isUndefined(filter.only_volunteer) &&
          filter.only_volunteer == 1
        ) {
          query.push({ is_volunteer: true });
        }
        if (!_.isUndefined(filter.display_name) && filter.display_name) {
          const query = await this.commonService.filter(
            operator,
            filter.display_name,
            'display_name',
          );
          where.push(query);
        }
        let filterFields = [
          'first_name',
          'last_name',
          'phone',
          'email',
          'restaurant_name',
          'delete_account_reason',
          'blocked',
          'createdAt',
          'deletedAt',
        ];
        await filterFields.map(async (option) => {
          if (!_.isUndefined(filter[option]) && filter[option]) {
            const query = await this.commonService.filter(
              option == 'blocked'
                ? 'boolean'
                : option == 'date'
                ? 'date'
                : operator,
              filter[option],
              option,
            );
            where.push(query);
          }
        });
        if (!_.isUndefined(filter.country_data) && filter.country_data) {
          const query = await this.commonService.filter(
            operator,
            filter.country_data,
            'country_data.country',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.user_type) && filter.user_type) {
          const userType = JSON.parse(filter.user_type).toLowerCase();
          if (userType === 'donor') {
            match['is_donor'] = true;
          } else if (userType === 'user' || userType === 'beneficiary') {
            match['is_user'] = true;
          } else if (userType === 'volunteer') {
            match['is_volunteer'] = true;
          } else if (userType === 'ngo') {
            match['is_ngo'] = true;
          } else if (userType === 'corporate') {
            match['$or'] = [
              { is_corporate: true },
              { is_corporate_user: true },
            ];
          }
        }
        if (!_.isUndefined(filter.deleted) && filter.deleted == 1) {
          deleted = true;
        }
        match['is_deleted'] = deleted;

        if (!_.isUndefined(filter.search) && filter.search) {
          const str_fields = [
            'display_name',
            'first_name',
            'last_name',
            'phone',
            'email',
            'restaurant_name',
            'delete_account_reason',
            'country_data.country',
            'user_type',
            'deletedAt',
            'createdAt',
          ];
          const bool_fields = ['blocked'];
          const stringFilter = await this.commonService.getGlobalFilter(
            str_fields,
            filter.search,
          );
          const boolFilter = await this.commonService.getBooleanFilter(
            bool_fields,
            filter.search,
          );
          let globalFilter = stringFilter.concat(boolFilter);
          query = query.concat(globalFilter);
          const searchValue = filter.search.toLowerCase();
          if (searchValue !== '') {
            const queryMappings = {
              donor: { is_donor: true },
              user: { is_user: true },
              beneficiary: { is_user: true },
              volunteer: { is_volunteer: true },
              ngo: { is_ngo: true },
              corporate: {
                $or: [{ is_corporate: true }, { is_corporate_user: true }],
              },
            };
            const queryObject = queryMappings[searchValue];
            if (queryObject) {
              query.push(queryObject);
            }
          }
        }

        if (!_.isEmpty(query)) {
          match['$or'] = query;
        }
        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }

      const sortData = {
        _id: '_id',
        first_name: 'first_name',
        display_name: 'display_name',
        last_name: 'last_name',
        email: 'email',
        phone: 'phone',
        restaurant_name: 'restaurant_name',
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
        country: 'country_data.country',
        delete_account_reason: 'delete_account_reason',
        blocked: 'blocked',
      };

      const addFields = {
        $addFields: {
          phone: { $concat: ['$phone_code', ' ', '$phone'] },
        },
      };
      //Get total count of filtered doc
      const total_record = await this.userModel.countDocuments(match).exec();
      let {
        per_page,
        page,
        total_pages,
        prev_enable,
        next_enable,
        start_from,
        sort,
        sort_by,
      } = await this.commonService.sortFilterPagination(
        param.page,
        param.per_page,
        total_record,
        sortData,
        param.sort_type,
        param.sort,
      );

      if (!_.isUndefined(param.sort) && param.sort === 'user_type') {
        sort = {
          is_user: sort_by,
          is_donor: sort_by,
          is_volunteer: sort_by,
          is_ngo: sort_by,
          is_corporate: sort_by,
          is_corporate_user: sort_by,
        };
      }

      const result = await this.userModel.aggregate(
        [
          addFields,
          { $match: match },
          {
            $lookup: {
              from: 'ngo',
              let: { ngo_id: '$ngo_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$$ngo_id', '$_id'] }],
                    },
                  },
                },
                {
                  $project: {
                    trustees_name: 1,
                  },
                },
              ],
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
            $addFields: {
              my_ngo_data: {
                $filter: {
                  input: '$ngoData.trustees_name',
                  as: 'trustee_data',
                  cond: {
                    $and: [{ $eq: ['$$trustee_data._id', '$_id'] }],
                  },
                },
              },
            },
          },
          {
            $unwind: {
              path: '$my_ngo_data',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              last_name: 1,
              display_name: 1,
              phone: 1,
              email: 1,
              first_name: 1,
              is_volunteer: 1,
              is_donor: 1,
              is_user: 1,
              is_ngo: 1,
              createdAt: 1,
              user_type: [
                {
                  $cond: {
                    if: { $eq: ['$is_volunteer', true] },
                    then: 'volunteer',
                    else: '',
                  },
                },
                {
                  $cond: {
                    if: { $eq: ['$is_donor', true] },
                    then: 'donor',
                    else: '',
                  },
                },
                {
                  $cond: {
                    if: { $eq: ['$is_user', true] },
                    then: 'user',
                    else: '',
                  },
                },
                {
                  $cond: {
                    if: { $eq: ['$is_ngo', true] },
                    then: 'ngo',
                    else: '',
                  },
                },
                {
                  $cond: {
                    if: {
                      $or: [
                        { $eq: ['$is_corporate', true] },
                        { $eq: ['$is_corporate_user', true] },
                      ],
                    },
                    then: 'corporate',
                    else: '',
                  },
                },
              ],
              is_restaurant: 1,
              restaurant_name: 1,
              phone_country_full_name: 1,
              phone_country_short_name: 1,
              restaurant_location: 1,
              country_data: 1,
              delete_account_reason: 1,
              deletedAt: 1,
              blocked: 1,
              is_corporate: 1,
              is_corporate_user: 1,
              corporate_id: 1,
              my_ngo_data: 1,
              ngo_account_type: {
                $cond: {
                  if: { $eq: ['$my_ngo_data.is_owner', true] },
                  then: 'Primary',
                  else: {
                    $cond: {
                      if: { $eq: ['$my_ngo_data.is_owner', false] },
                      then: 'Secondary',
                      else: '',
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
        { collation: { locale: 'en' } },
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
      console.log(error, 'error');
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for logout user
  public async logout(uuid: any, accessToken: any, res: any): Promise<User> {
    try {
      await this.userTokenModel
        .findOneAndDelete({
          user_id: this.request.user._id,
          $or: [
            { uuid: uuid, access_token: accessToken },
            { access_token: accessToken },
          ],
        })
        .lean();
      return res.json({ success: true });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-logout',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Function for make login
  public async makeLogin(
    user: any,
    uuid: string,
    platform: string,
    countryData = null,
  ) {
    try {
      const stripeId = await this.stripeService.stripeUserId(user);
      const userReqData = await this.queueService.findUserRequestData(user._id);
      const badge: any = await this.commonService.badgeCount(user._id);
      const userDtl: any = {
        _id: user._id,
        image: _.isNull(user.image)
          ? user.image
          : authConfig.imageUrl + 'user/' + user.image,
        my_request: user.my_request,
        last_name: user.last_name,
        first_name: user.first_name,
        phone_code: user.phone_code,
        phone: user.phone,
        phone_country_full_name: user.phone_country_full_name,
        phone_country_short_name: user.phone_country_short_name,
        email: user.email,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        my_causes: user.my_causes,
        display_name: user.display_name,
        is_ngo: user.is_ngo,
        // ngo_data: user.ngo_data,
        request_data: userReqData,
        country_data: user.country_data ? user.country_data : countryData,
        default_country: user.default_country,
        time_zone: user.time_zone,
        is_user: user.is_user,
        is_donor: user.is_donor,
        is_volunteer: user.is_volunteer,
        race: user.race,
        religion: user.religion,
        blood_group: user.blood_group,
        dob: user.dob,
        gender: user.gender,
        is_corporate: user.is_corporate,
        is_corporate_user: user.is_corporate_user,
        corporate_id: user.corporate_id,
        stripe_customer_id: stripeId,
        badge,
      };

      if (user.is_donor) {
        userDtl.is_restaurant = user.is_restaurant;
        userDtl.restaurant_name = user.restaurant_name;
        userDtl.restaurant_location = user.restaurant_location;
        userDtl.is_veg = user.is_veg;
      }

      //if user has NGO then return NGO data in profile
      let ngoData: any = {};
      if (user.is_ngo) {
        ngoData = await this.commonService.getNGODetailForApp(user.ngo_id);

        userDtl.ngo_detail = ngoData;
        ngoData = {
          ngo_causes: ngoData.ngo_causes,
          is_enable: ngoData.is_enable,
          ngo_status: ngoData.ngo_status,
          is_expired: ngoData.is_expired,
        };
      }

      //if user has corporate account then return corporate data in profile
      let corporateData: any = {};
      if (user.is_corporate || user.is_corporate_user) {
        corporateData = await this.commonService.getCorporateDetail(
          user.corporate_id,
          'app',
          user._id,
        );
        userDtl.corporate_data = corporateData;
        corporateData = {
          is_corporate: user.is_corporate,
          corporate_causes: corporateData.causes,
        };
      }

      const userD = {
        is_donor: user.is_donor,
        is_user: user.is_user,
        is_volunteer: user.is_volunteer,
        my_causes: user.my_causes,
      };
      const {
        userCauses,
        ngoCauses,
        corporateCauses,
        createType,
        allowDonationType,
      } = await this.queueService.userCauses(userD, ngoData, corporateData);

      userDtl.user = userCauses;
      userDtl.ngo = ngoCauses;
      userDtl.corporate = corporateCauses;
      userDtl.create_type = createType;
      userDtl.allowDonationType = allowDonationType;

      const totalDonation = await this.transactionModel
        .count({
          donor_id: ObjectID(userDtl._id),
          saayam_community: { $ne: true },
          transaction_type: {
            $in: ['ngo-donation', 'donation', 'fund-donated'],
          },
        })
        .lean();

      const foodDonated = await this.requestModel
        .count({
          category_slug: 'hunger',
          donor_id: ObjectID(userDtl._id),
          status: 'delivered',
        })
        .lean();

      const query = {
        category_slug: { $ne: 'hunger' },
        active_type: { $ne: 'ngo' },
        user_id: ObjectID(userDtl._id),
        status: { $ne: 'draft' },
        is_deleted: { $ne: true },
      };

      const fundraiser = await this.requestModel.count(query).lean();
      query['form_data.request_for_self'] = true;
      const myFundraiser = await this.requestModel.count(query).lean();

      userDtl.totalDonation = totalDonation;
      userDtl.my_fundraiser = myFundraiser;
      userDtl.fundraiser = fundraiser;
      userDtl.food_donated = foodDonated;

      const token: any = await this.commonService.randomTokenGenerator(32);

      let updateData: any = {};
      if (!_.isEmpty(countryData)) {
        updateData.country_data = countryData;
        await this.userModel.updateOne({ _id: user._id }, updateData);
      }

      await this.userToken(user._id, uuid, token, platform);
      return {
        success: true,
        data: userDtl,
        token: token,
        message: mConfig.Login_successfully,
      };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-makeLogin',
      );
    }
  }

  public async userToken(user_id, uuid, access_token, platform) {
    try {
      const userToken = await this.userTokenModel
        .findOne({
          user_id: user_id,
          uuid: uuid,
        })
        .lean();
      const dtl: any = {
        uuid: uuid,
        access_token: access_token,
        platform: platform,
        expiry_date: new Date(new Date().setDate(new Date().getDate() + 7)),
        active_role: 'user',
      };
      if (_.isEmpty(userToken)) {
        dtl.user_id = user_id;
        const createUser = new this.userTokenModel(dtl);
        await createUser.save();
      } else {
        await this.userTokenModel.updateOne({ _id: userToken._id }, dtl).lean();
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-userToken',
      );
    }
  }

  //Login using Apple,Facebook and Google
  public async socialLogin(
    socialLoginDto: SocialLoginDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        socialLoginDto,
      );
      let check: any = {};
      if (socialLoginDto.type == 'google') {
        check = await this.verifyGoogleLogin(socialLoginDto.token);
      } else if (socialLoginDto.type == 'apple') {
        check = await this.verifyAppleLogin(
          socialLoginDto.token,
          socialLoginDto.platform,
        );
      } else if (socialLoginDto.type == 'facebook') {
        check = await this.verifyFacebookToken(socialLoginDto.token);
      }

      if (check.sub) {
        let query = {};
        let hasUser = true;
        if (socialLoginDto.type == 'google') {
          query = { google_id: check.sub, is_deleted: false };
        } else if (socialLoginDto.type == 'apple') {
          query = { apple_id: check.sub, is_deleted: false };
        } else if (socialLoginDto.type == 'facebook') {
          query = { facebook_id: check.sub, is_deleted: false };
        }

        // find user by unique social sub id
        let user = await this.userModel.findOne(query).lean();

        //find user by email
        if (_.isEmpty(user) && check.email) {
          hasUser = false;
          query = { email: check.email, is_deleted: false };
          user = await this.userModel.findOne(query).lean();
        }

        if (
          _.isEmpty(user) &&
          socialLoginDto.type === 'facebook' &&
          !check.isEmail &&
          !check.phone
        ) {
          //add data in facebook_data table and return _id in response
          check.type = 'facebook_phone_login';
          const createFacebookData = new this.socialDataModel({
            data: check,
          });
          const facebookData: any = await createFacebookData.save();

          return res.json({
            data: { _id: facebookData._id, data: facebookData.data },
            success: false,
            phone_required: true,
            message: mConfig.Phone_not_empty,
          });
        }
        const dtl = {};
        if (_.isEmpty(user)) {
          check.type = socialLoginDto.type;
          const createSocialData = new this.socialDataModel({
            data: check,
          });
          const socialData = await createSocialData.save();
          return res.json({
            data: socialData,
            success: true,
          });
        } else {
          if (user.blocked) {
            return res.json({
              success: false,
              blockedUser: true,
            });
          }

          if (!hasUser) {
            if (socialLoginDto.type == 'google') {
              dtl['google_id'] = check.sub;
            } else if (socialLoginDto.type == 'apple') {
              dtl['apple_id'] = check.sub;
            } else if (socialLoginDto.type == 'facebook') {
              dtl['facebook_id'] = check.sub;
            }

            await this.userModel
              .updateOne({ _id: user._id }, dtl, { new: true })
              .exec();
          }

          const result = await this.makeLogin(
            user,
            socialLoginDto.uuid,
            socialLoginDto.platform,
          );

          return res.json({
            success: result.success,
            data: result.data,
            token: result.token,
            message: result.message,
          });
        }
      } else {
        const msg = await this.commonService.changeString(
          mConfig.We_are_unable_to_fetch_user_detail,
          { '{{type}}': socialLoginDto.type },
        );
        return res.json({
          success: false,
          message: msg,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'app/controllers/user.controller.js-socialLogin',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Login using Apple,Facebook and Google
  public async socialSignup(
    socialSignupDto: SocialSignupDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        socialSignupDto,
      );
      if (socialSignupDto.uId && !_.isEmpty(socialSignupDto.uId)) {
        // verify phone number using firebase
        await admin
          .auth()
          .getUser(socialSignupDto.uId)
          .then(async (userDtl) => {
            if (!userDtl) {
              return res.json({
                success: false,
                message: mConfig.User_not_found,
              });
            }
          })
          .catch((err) => {
            if (err.code === 'auth/user-not-found') {
              return res.json({
                success: false,
                message: mConfig.User_not_found,
              });
            }
          });
      }

      if (
        socialSignupDto.otp &&
        !_.isEmpty(socialSignupDto.otp) &&
        socialSignupDto.otp_platform &&
        !_.isEmpty(socialSignupDto.otp_platform)
      ) {
        const verifyOTP = await this.commonService.verifyOtp(socialSignupDto);

        if (verifyOTP['success'] == false || verifyOTP['success'] == true) {
          return res.json(verifyOTP);
        }
      }
      //find data from table & check created_at time
      const date = new Date();
      const facebookData = await this.socialDataModel
        .findOne({
          _id: ObjectID(socialSignupDto.data_id),
          createdAt: { $gte: new Date(date.getTime() - 1000 * 60 * 20) },
        })
        .lean();

      //if create time is greater than 5 minutes then throw error
      if (!_.isEmpty(facebookData)) {
        const check = facebookData.data;

        //call verifyFacebookToken()
        const result = await this.verifySocialLogin(
          check,
          socialSignupDto,
          socialSignupDto.type,
        );
        return res.json(result);
      } else {
        return res.json({
          success: false,
          message: mConfig.Please_try_again,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'app/controllers/user.controller.js-socialSignup',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
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
      if (
        checkUserDto.type == 'login' ||
        checkUserDto.type == 'facebook_login'
      ) {
        if (
          (!checkUserDto.phone_code ||
            _.isUndefined(checkUserDto.phone_code)) &&
          (!checkUserDto.phone || _.isUndefined(checkUserDto.phone))
        ) {
          return res.json({
            success: false,
            message: mConfig.Params_are_missing,
          });
        } else {
          const user = await this.userModel
            .findOne({
              phone_code: checkUserDto.phone_code,
              phone: checkUserDto.phone,
              is_deleted: false,
            })
            .lean();

          if (_.isEmpty(user)) {
            if (checkUserDto.type == 'facebook_login') {
              return res.json({
                success: true,
              });
            } else {
              return res.json({
                success: false,
                message: mConfig.User_not_found,
              });
            }
          } else {
            if (user.blocked) {
              return res.json({
                success: false,
                blockedUser: true,
              });
            } else {
              return res.json({
                success: true,
              });
            }
          }
        }
      } else if (
        checkUserDto.type == 'update' ||
        checkUserDto.type == 'signup'
      ) {
        let emailCount = 0;
        let nameCount = 0;
        let phoneCount = 0;
        if (checkUserDto.email && !_.isUndefined(checkUserDto.email)) {
          emailCount = await this.userModel
            .count({
              email: new RegExp('^' + checkUserDto.email + '$', 'i'),
              is_deleted: false,
            })
            .lean();
        }
        if (
          checkUserDto.display_name &&
          !_.isUndefined(checkUserDto.display_name)
        ) {
          nameCount = await this.userModel
            .count({
              display_name: checkUserDto.display_name,
              is_deleted: false,
            })
            .lean();
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
              is_deleted: false,
            })
            .lean();
        }
        let response =
          emailCount > 0 && phoneCount > 0
            ? { success: false, message: mConfig.User_exists_with_phone_email }
            : phoneCount > 0
            ? { success: false, message: mConfig.User_exists_with_phone }
            : emailCount > 0
            ? { success: false, message: mConfig.User_exists_with_email }
            : nameCount > 0
            ? { success: false, message: mConfig.User_exists_with_name }
            : { success: true };
        return res.json(response);
      } else if (checkUserDto.type == 'social_login') {
        if (
          (!checkUserDto.phone_code ||
            _.isUndefined(checkUserDto.phone_code)) &&
          (!checkUserDto.phone || _.isUndefined(checkUserDto.phone))
        ) {
          return res.json({
            success: false,
            message: mConfig.Params_are_missing,
          });
        } else {
          const user = await this.userModel
            .count({
              phone_code: checkUserDto.phone_code,
              phone: checkUserDto.phone,
              is_deleted: false,
            })
            .lean();
          if (!user || user <= 0) {
            return res.json({
              success: true,
            });
          } else {
            return res.json({
              success: false,
              message: mConfig.User_exists_with_phone,
            });
          }
        }
      } else if (checkUserDto.type == 'ngo_signup') {
        let emailCount = 0;
        let numberCount = 0;
        let phoneCount = 0;

        if (checkUserDto.email && !_.isUndefined(checkUserDto.email)) {
          emailCount = await this.userModel
            .count({
              email: checkUserDto.email,
              is_ngo: true,
              is_deleted: { $ne: true },
            })
            .lean();
          if (emailCount <= 0) {
            emailCount = await this.ngoModel
              .count({
                'form_data.ngo_email': checkUserDto.email,
                is_deleted: { $ne: true },
              })
              .lean();
          }
          if (emailCount <= 0) {
            emailCount = await this.ngoUpdatedModel
              .count({
                'form_data.ngo_email': checkUserDto.email,
                is_deleted: { $ne: true },
              })
              .lean();
          }
        }

        if (
          checkUserDto.ngo_registration_number &&
          !_.isUndefined(checkUserDto.ngo_registration_number)
        ) {
          numberCount = await this.ngoModel
            .count({
              'form_data.registration_certificate_number':
                checkUserDto.ngo_registration_number,
              is_deleted: { $ne: true },
            })
            .lean();

          if (numberCount <= 0) {
            numberCount = await this.ngoUpdatedModel
              .count({
                'form_data.registration_certificate_number':
                  checkUserDto.ngo_registration_number,
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
              is_ngo: true,
              is_deleted: { $ne: true },
            })
            .lean();

          if (phoneCount <= 0) {
            phoneCount = await this.ngoModel
              .count({
                $or: [
                  {
                    'form_data.ngo_mobile_number.countryCodeD':
                      checkUserDto.phone_code,
                    'form_data.ngo_mobile_number.phoneNumber':
                      checkUserDto.phone,
                  },
                  {
                    'trustees_name.phone_code': checkUserDto.phone_code,
                    'trustees_name.phone': checkUserDto.phone,
                  },
                ],
                is_deleted: { $ne: true },
              })
              .lean();
          }
          if (phoneCount <= 0) {
            phoneCount = await this.ngoUpdatedModel
              .count({
                $or: [
                  {
                    'form_data.ngo_mobile_number.countryCodeD':
                      checkUserDto.phone_code,
                    'form_data.ngo_mobile_number.phoneNumber':
                      checkUserDto.phone,
                  },
                  {
                    'trustees_name.phone_code': checkUserDto.phone_code,
                    'trustees_name.phone': checkUserDto.phone,
                  },
                ],
                is_deleted: { $ne: true },
              })
              .lean();
          }
        }

        if (numberCount > 0 && phoneCount > 0) {
          return res.json({
            success: false,
            message: mConfig.Saayam_exists_with_phone_and_regi_number,
          });
        } else if (numberCount > 0) {
          return res.json({
            success: false,
            message: mConfig.Saayam_exists_with_regi_number,
          });
        } else if (phoneCount > 0) {
          return res.json({
            success: false,
            message: mConfig.Saayam_exists_with_phone,
          });
        } else if (emailCount > 0) {
          return res.json({
            success: false,
            message: mConfig.Saayam_exists_with_email,
          });
        } else {
          return res.json({
            success: true,
          });
        }
      } else if (checkUserDto.type == 'ngo_facebook_phone_login') {
        if (
          (!checkUserDto.phone_code ||
            _.isUndefined(checkUserDto.phone_code)) &&
          (!checkUserDto.phone || _.isUndefined(checkUserDto.phone))
        ) {
          return res.json({
            success: false,
            message: mConfig.Params_are_missing,
          });
        } else {
          const user = await this.userModel
            .findOne({
              phone_code: checkUserDto.phone_code,
              phone: checkUserDto.phone,
              is_deleted: false,
            })
            .lean();
          if (_.isEmpty(user)) {
            return res.json({
              success: false,
            });
          } else {
            if (user.blocked) {
              return res.json({
                success: false,
                blockedUser: true,
              });
            } else {
              const findNGO: any = await this.ngoModel
                .findOne({
                  phone_code: checkUserDto.phone_code,
                  phone: checkUserDto.phone,
                  is_deleted: false,
                })
                .lean();
              if (findNGO) {
                (findNGO.ngo_cover_image =
                  authConfig.imageUrl +
                  +'ngo/' +
                  findNGO._id +
                  +'/' +
                  findNGO?.form_data?.files?.ngo_cover_image[0]),
                  (findNGO.ngo_deed =
                    authConfig.imageUrl +
                    'ngo/' +
                    findNGO._id +
                    +'/' +
                    findNGO?.form_data?.files?.ngo_deed[0]),
                  (findNGO.ngo_certificate =
                    authConfig.imageUrl +
                    'ngo/' +
                    findNGO._id +
                    '/' +
                    findNGO?.form_data?.files?.ngo_registration[0]);

                return res.json({
                  success: true,
                  ngoData: findNGO,
                });
              } else {
                return res.json({
                  success: false,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user/user.service.ts-checkUser',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  //Api for change user role
  public async selectCauses(
    selectCausesDto: SelectCausesDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        selectCausesDto,
      );
      const data = selectCausesDto.id;
      const type = selectCausesDto.type ? selectCausesDto.type : 'user';
      let uData = {};
      let query = {};

      if (type && type === 'ngo') {
        const existNgo: any = await this.ngoModel
          .findById(this.request.user?.ngo_data?._id)
          .select({ _id: 1, ngo_status: 1, ngo_name: '$form_data.ngo_name' })
          .lean();
        if (existNgo) {
          if (existNgo.ngo_status !== 'approve') {
            await this.ngoUpdatedModel
              .findOneAndUpdate(
                { ngo_id: existNgo._id },
                { $set: { ngo_causes: data } },
                { sort: { _id: -1 } },
              )
              .lean();
          }
          uData = {
            'ngo_data.ngo_causes': data,
          };
          query = {
            ngo_causes: data,
          };
          //change ngo_causes

          await this.ngoModel.updateOne({ _id: existNgo._id }, query).lean();
          await this.userModel
            .updateMany(
              { 'ngo_data._id': existNgo._id, is_deleted: false },
              { $set: uData },
            )
            .lean();

          const msg = await this.commonService.changeString(
            mConfig.noti_msg_owner_changed_ngo_causes,
            { '{{ngo_name}}': existNgo?.ngo_name },
          );
          //send notification to admin
          const input: any = {
            message: msg,
            title: mConfig.noti_title_ngo_causes_updated,
            type: 'ngo',
            ngoId: existNgo._id,
          };
          this.commonService.sendAdminNotification(input);

          //send notification to ngo trustee
          const userId = await this.commonService.getNgoUserIds(
            existNgo._id,
            this.request.user._id,
          );

          if (!_.isEmpty(userId)) {
            input.userId = userId;
            this.commonService.notification(input);
          }
        } else {
          return res.json({
            success: false,
            message: mConfig.Something_went_wrong,
          });
        }
      } else {
        uData = {
          my_causes: data,
        };
        const query = {
          _id: ObjectID(this.request.user._id),
        };

        //change donor_causes
        await this.userModel.updateOne(query, uData).exec();
      }

      return res.json({
        success: true,
        cause_data: data,
        message: mConfig.Causes_updated,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-selectCauses',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Apple verified login function
  verifyAppleLogin = async (idToken, platform) => {
    try {
      let clientId = process.env.apple_client_id;
      if (platform == 'web') {
        clientId = process.env.web_apple_client_id;
      }
      const jwtClaims = await verifyAppleToken({
        idToken: idToken,
        clientId,
      });

      if (jwtClaims.exp > moment().unix()) {
        if (jwtClaims.email) {
          jwtClaims.isEmail = true;
          jwtClaims.first_name = jwtClaims.email.split('@')[0];
        } else {
          jwtClaims.isEmail = false;
          jwtClaims.email = jwtClaims.sub;
          jwtClaims.first_name = '';
        }
        return jwtClaims;
      } else {
        return false;
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-verifyAppleLogin',
      );
      return error;
    }
  };

  //Google verified login function
  verifyGoogleLogin = async (idToken) => {
    try {
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.google_client_id);

      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.google_client_id,
      });
      const payload = ticket.getPayload();
      payload.first_name = payload.given_name || null;
      payload.last_name = payload.family_name || null;
      payload.sImage = payload.picture || null;
      const responseData = {
        first_name: payload.first_name,
        last_name: payload.last_name,
        sImage: payload.sImage,
        sub: payload.sub,
        email: payload.email,
      };
      return responseData;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-verifyGoogleLogin',
      );
      return error;
    }
  };

  //Facebook verified login function
  verifyFacebookToken = async (token) => {
    return new Promise(async (resolve) => {
      try {
        const request = require('request');
        request(
          {
            method: 'GET',
            url: `https://graph.facebook.com/v15.0/me?fields=id%2Cname%2Cemail%2Cpicture.height(500)%2Cgender%2Cname_format%2Cfirst_name%2Clast_name&access_token=${token}`,
            // url: `https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`,
            headers: {},
          },
          (error, response) => {
            if (error) {
              resolve(false);
            }

            if (response.statusCode === 200) {
              const res = JSON.parse(response.body);

              if (res.email) {
                res.isEmail = true;
                res.email = res.email;
              } else {
                res.isEmail = false;
              }
              res.sub = res.id;
              res.sImage = res.picture.data.url;
              const name = res.name ? res.name.split(' ') : [];
              res.first_name = name[0] ? name[0] : null;
              res.last_name = name[1] ? name[1] : null;
              delete res.picture;
              resolve(res);
            } else {
              resolve(false);
            }
          },
        );
      } catch (error) {
        this.errorlogService.errorLog(
          error,
          'app/controllers/user.controller.js-verifyFacebookToken',
        );
        resolve(false);
      }
    });
  };

  //Function to download file
  downloadImage = async (url, filename) => {
    return new Promise(async (resolve) => {
      try {
        const webPath = `./uploads/temp/${filename}`;
        const writer = fs.createWriteStream(webPath);

        const response = await this.httpService.axiosRef({
          url,
          method: 'GET',
          responseType: 'stream',
        });

        response.data.pipe(writer);
        writer.on('finish', async () => {
          await this.commonService.uploadFileOnS3(filename, 'user');
          resolve(true);
        });
        writer.on('error', () => {
          resolve(false);
        });
      } catch (error) {
        this.errorlogService.errorLog(
          error,
          'app/controllers/user.controller.js-downloadImage',
        );
        resolve(false);
      }
    });
  };

  //Common function for social login
  verifySocialLogin = async (check, dto, type) => {
    try {
      let user: any = {};
      if (check.type == 'facebook_phone_login') {
        const query = {
          phone_code: dto.phone_code,
          phone: dto.phone,
          is_deleted: false,
        };
        user = await this.userModel.findOne(query).lean();
      }
      let dtl = {};
      let hasUser = true;
      if (_.isEmpty(user) || (user && user.is_guest)) {
        if (check.sImage) {
          const filename = parseInt(moment().format('X')) + '.png';
          const checkImage = await this.downloadImage(check.sImage, filename);
          if (checkImage) {
            check.image = filename;
          }
        }

        const countryData = await this.commonService.getCountry(
          dto.country_name,
        );

        const latitude = Number(dto.latitude) || 0;
        const longitude = Number(dto.longitude) || 0;
        const timezonesName = await this.commonService.getTimezoneFromLatLon(
          latitude,
          longitude,
        );

        //Create new user if account is not exist
        dtl = {
          first_name: dto.first_name ? dto.first_name : check.first_name,
          last_name: dto.last_name ? dto.last_name : check.last_name,
          email: check.email || null,
          phone_code: dto.phone_code,
          display_name: dto.display_name ? dto.display_name : check.first_name,
          phone: dto.phone,
          phone_country_short_name: dto.phone_country_short_name,
          phone_country_full_name: dto.phone_country_full_name,
          image: check.image || null,
          is_user: dto.is_user,
          is_donor: dto.is_donor,
          is_volunteer: dto.is_volunteer,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
            city: dto.city,
          },
          is_restaurant: false,
          restaurant_name: null,
          restaurant_location: null,
          is_veg: false,
          country_data: countryData ? countryData : null,
          default_country: dto.country_name,
          time_zone: timezonesName,
          race: dto.race || null,
          religion: dto.religion || null,
        };

        if (dto.is_donor) {
          dtl['my_causes'] = dto.my_causes;
        }
        if (type == 'google') {
          dtl['google_id'] = check.sub;
        } else if (type == 'apple') {
          dtl['apple_id'] = check.sub;
        } else if (type == 'facebook') {
          dtl['facebook_id'] = check.sub;
        }
        let result1;

        const createUser = new this.userModel(dtl);
        result1 = await createUser.save();

        const result = await this.makeLogin(result1, dto.uuid, dto.platform);

        return result;
      } else {
        //update social id & make login
        if (check.type == 'facebook_phone_login' && dto.phone) {
          if (user.facebook_id != null && user.facebook_id != check.id) {
            return {
              success: false,
              message: mConfig.Account_already_exist,
            };
          } else {
            hasUser = false;
          }
        }
        // if (
        //   user.access_token &&
        //   user.uuid != dto.uuid &&
        //   check.type !== 'facebook_phone_login'
        // ) {
        //   return {
        //     success: false,
        //     alreadyExist: true,
        //     userId: user._id,
        //   };
        // }

        if (!hasUser) {
          if (type == 'google') {
            dtl['google_id'] = check.sub;
          } else if (type == 'apple') {
            dtl['apple_id'] = check.sub;
          } else if (type == 'facebook') {
            dtl['facebook_id'] = check.sub;
          }
          if (check.type == 'facebook_phone_login') {
            dtl['display_name'] = dto.display_name;

            if (dto.is_user || dto.is_donor || dto.is_volunteer) {
              dtl['is_user'] = dto.is_user;
              dtl['is_donor'] = dto.is_donor;
              dtl['is_volunteer'] = dto.is_volunteer;
              if (dto.is_donor && !_.isEmpty(dto.my_causes)) {
                dtl['my_causes'] = dto.my_causes;
              }
            }
            if (!_.isUndefined(dto.longitude) && !_.isUndefined(dto.latitude)) {
              const latitude = Number(dto.latitude);
              const longitude = Number(dto.longitude);
              const timezonesName =
                await this.commonService.getTimezoneFromLatLon(
                  latitude,
                  longitude,
                );

              dtl['location'] = {
                type: 'Point',
                coordinates: [longitude, latitude],
                city: dto.city,
              };
              dtl['time_zone'] = timezonesName;
            }
            if (dto.race && !_.isUndefined(dto.race)) {
              dtl['race'] = dto.race;
            }
            if (dto.religion && !_.isUndefined(dto.religion)) {
              dtl['religion'] = dto.religion;
            }
          }
          user = await this.userModel
            .findByIdAndUpdate({ _id: user._id }, dtl, { new: true })
            .lean();
        }

        const result = await this.makeLogin(user, dto.uuid, dto.platform);

        return result;
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'app/controllers/user.controller.js-verifySocialLogin',
      );
      return error;
    }
  };

  //Api for get user profile details
  public async getUserDetail(id: string, res: any): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const userData: any = await this.userModel
        .findById(id, {
          access_token: 0,
          uuid: 0,
          favourite_ngos: 0,
          current_location: 0,
          socket_id: 0,
          is_deleted: 0,
          my_request: 0,
          apple_id: 0,
          google_id: 0,
          facebook_id: 0,
          time_zone: 0,
        })
        .lean();
      if (!_.isEmpty(userData)) {
        userData.image = _.isNull(userData.image)
          ? userData.image
          : authConfig.imageUrl + 'user/' + userData.image;

        const query = {
          user_id: userData._id,
        };
        const getBankData = await this.bankService.getBankLists(query);

        userData.bank_data = getBankData;

        if (userData.is_ngo && !_.isUndefined(userData.ngo_data)) {
          const findNGO: any = await this.ngoModel
            .findOne(
              { _id: userData?.ngo_data?._id },
              { _id: 1, trustees_name: 1, ngo_status: 1 },
            )
            .lean();
          if (!_.isUndefined(findNGO)) {
            const findTrustee = findNGO.trustees_name.find(
              (i: any) => i._id.toString() == id.toString(),
            );
            if (
              findTrustee &&
              findTrustee.is_owner &&
              findTrustee.is_owner === true
            ) {
              userData.ngo_data.account_type = 'Primary';
            } else {
              userData.ngo_data.account_type = 'Secondary';
            }
          }
        }

        return res.json({
          success: true,
          data: userData,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.User_not_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-getUserDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get user profile details
  public async userProfileDetails(
    id: string,
    platform: string,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id, platform },
      );
      const userDetails = await this.queueService.getUserDetail(id, platform);
      if (!_.isEmpty(userDetails)) {
        return res.json({
          success: true,
          data: userDetails,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.User_not_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-userProfileDetails',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for login if already access token
  public async accessTokenLogin(
    accessTokenDto: AccessTokenDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        accessTokenDto,
      );
      const user = await this.userModel.findById(accessTokenDto.user_id).lean();
      if (!_.isEmpty(user)) {
        if (user.blocked) {
          return res.json({
            success: false,
            blockedUser: true,
          });
        }
        const result: any = await this.makeLogin(
          user,
          accessTokenDto.uuid,
          accessTokenDto.platform,
        );
        return res.json({
          success: result.success,
          data: result.data,
          token: result.token,
          message: result.message,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.User_not_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-accessTokenLogin',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for change country
  public async changeCountry(country: string, res: any): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        country,
      );
      const countryData = await this.commonService.getCountry(country);
      const data = countryData ? countryData : null;
      const timezonesName = timezone.getTimezones(countryData.country);

      const change = {
        country_data: data,
        time_zone: timezonesName[0],
      };

      const result = await this.userModel
        .findByIdAndUpdate(this.request.user._id, change, { new: true })
        .lean();

      await this.ngoModel
        .findOneAndUpdate(
          {
            'trustees_name._id': ObjectID(this.request.user._id),
            'trustees_name.is_owner': true,
          },
          change,
          { new: true },
        )
        .lean();

      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        return res.json({
          message: mConfig.Country_change,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.changeCountry',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete user from admin panel
  public async deleteUser(
    userId: string,
    deleteAccountDto: DeleteAccountDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        deleteAccountDto,
      );
      const user = await this.userModel
        .findById(userId, { _id: 1, ngo_data: 1 })
        .lean();
      if (!user) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const query = {
          user_id: user._id,
        };
        const updateData = {
          is_deleted: true,
        };
        const updateData1 = {
          $set: {
            is_deleted: true,
            deletedAt: new Date(),
            delete_account_reason: deleteAccountDto.reason,
          },
          $unset: { access_token: 1, uuid: 1, platform: 1, socket_id: 1 },
        };
        await Promise.all([
          this.bankModel.updateMany(query, updateData).lean(),
          this.transactionModel.updateMany(query, updateData).lean(),
          this.requestModel.updateMany(query, updateData).lean(),
          this.notificationModel.updateMany(query, updateData).lean(),
          this.paymentProcessModel.updateMany(query, updateData).lean(),
          this.adminNotificationModel.updateMany(query, updateData).lean(),
          this.featureTransactionModel.updateMany(query, updateData).lean(),
          this.userTokenModel.deleteMany(query).lean(),
        ]);
        if (user.ngo_data) {
          let findTrustee: any = {};
          const findNGO: any = await this.ngoModel
            .findOne(
              { _id: user?.ngo_data?._id },
              { _id: 1, trustees_name: 1, ngo_status: 1 },
            )
            .lean();
          findTrustee = findNGO.trustees_name.find(
            (i: any) => i._id.toString() == user._id.toString(),
          );

          if (
            findTrustee &&
            findTrustee.is_owner &&
            findTrustee.is_owner === true
          ) {
            const trustee2 = findNGO.trustees_name.find(
              (i: any) => i.is_owner != true,
            );
            if (trustee2 && trustee2._id) {
              await this.userModel
                .findByIdAndUpdate(
                  { _id: trustee2._id },
                  { $unset: { is_ngo: 1, ngo_data: 1, ngo_id: 1 } },
                )
                .select({ _id: 1 })
                .lean();
            }

            //send notification to both trustee
            const input = {
              message: mConfig.noti_msg_deleted_ngo_by_admin,
              title: mConfig.noti_title_ngo_deleted,
              type: 'ngo',
              ngoId: findNGO._id,
            };
            const ngoUsers = await this.commonService.getNgoUserIds(
              findNGO._id,
            );
            if (ngoUsers) {
              this.commonService.sendAllNotification(ngoUsers, input);
            }
            await this.ngoModel
              .findByIdAndUpdate({ _id: user.ngo_data._id }, updateData1)
              .select({ _id: 1 })
              .lean();

            await this.ngoUpdatedModel.updateMany(
              { ngo_id: ObjectID(user.ngo_data._id) },
              { is_deleted: true },
            );
          } else {
            const updateNgoData: any = {
              $pull: { trustees_name: { _id: ObjectID(user._id) } },
            };

            await this.ngoModel
              .findByIdAndUpdate(
                { _id: ObjectID(user.ngo_data._id) },
                updateNgoData,
              )
              .select({ _id: 1 })
              .lean();

            if (findNGO.ngo_status === 'waiting_for_verify') {
              await this.ngoUpdatedModel
                .findOneAndUpdate(
                  { ngo_id: ObjectID(user.ngo_data._id) },
                  updateNgoData,
                  { sort: { _id: -1 } },
                )
                .lean();
            }

            //send notification to both trustee
          }
        }
        await this.userModel
          .findByIdAndUpdate(user._id, updateData1, { new: true })
          .select({ _id: 1 })
          .lean();

        //Add Activity Log
        const logData = {
          action: 'delete',
          user_id: user._id,
          entity_name: 'Delete User Account',
          description: 'User Account deleted successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.send({
          success: true,
          message: mConfig.User_deleted,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.delteUser',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async deleteAccount(deleteAccountDto: DeleteAccountDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        deleteAccountDto,
      );
      const userData = this.request.user;
      const uname = userData.display_name
        ? userData.display_name
        : userData.first_name + ' ' + userData.last_name;
      const query = {
        user_id: userData._id,
      };
      const updateData = {
        is_deleted: true,
      };
      await Promise.all([
        this.bankModel.updateMany(query, updateData).lean(),
        this.favouriteNgoModel.updateMany(query, updateData).lean(),
        this.featureTransactionModel.updateMany(query, updateData).lean(),
        this.notificationModel.deleteMany(query).lean(),
        this.transactionModel.updateMany(query, updateData).lean(),
        this.requestModel.updateMany(query, updateData).lean(),
        this.commentModel.deleteMany(query).lean(),
        this.userTokenModel.deleteMany(query).lean(),
      ]);
      if (!_.isEmpty(userData.ngo_data)) {
        let findTrustee: any = {};
        const findNGO: any = await this.ngoModel
          .findOne({ _id: userData.ngo_data._id })
          .select({ _id: 1, trustees_name: 1, ngo_status: 1 })
          .lean();
        findTrustee = findNGO.trustees_name.find(
          (i: any) => i._id.toString() == userData._id.toString(),
        );

        if (findTrustee?.is_owner && findTrustee?.is_owner === true) {
          const trustee2 = findNGO.trustees_name.find(
            (i: any) => i.is_owner != true,
          );
          if (trustee2 && trustee2._id) {
            await this.userModel
              .findByIdAndUpdate(
                { _id: trustee2._id },
                { $unset: { is_ngo: 1, ngo_data: 1, ngo_id: 1 } },
              )
              .select({ _id: 1 })
              .lean();
            //send notification to trustee
            const input = {
              message: mConfig.noti_msg_deleted_ngo,
              title: mConfig.noti_title_ngo_deleted,
              type: 'ngo',
              userId: trustee2._id,
            };
            this.commonService.notification(input);
          }
          await this.ngoModel
            .findByIdAndUpdate(
              { _id: userData.ngo_data._id },
              {
                is_deleted: true,
                deletedAt: new Date(),
                delete_account_reason: deleteAccountDto.reason,
              },
            )
            .select({ _id: 1 })
            .lean();
          await this.ngoUpdatedModel.updateMany(
            { ngo_id: ObjectID(userData.ngo_data._id) },
            { is_deleted: true },
          );
        } else {
          const updateNgoData: any = {
            $pull: { trustees_name: { _id: ObjectID(userData._id) } },
          };

          await this.ngoModel
            .findByIdAndUpdate(
              { _id: ObjectID(userData.ngo_data._id) },
              updateNgoData,
            )
            .select({ _id: 1 })
            .lean();

          const owner = findNGO.trustees_name.find(
            (i: any) => i.is_owner == true,
          );
          //Handle response message key
          if (owner && owner._id) {
            const notiMessage = await this.commonService.changeString(
              mConfig.noti_msg_reason,
              { '{{reason}}': deleteAccountDto.reason },
            );
            const notiTitle = await this.commonService.changeString(
              mConfig.noti_title_trustee_left_from_ngo,
              { '{{uname}}': uname },
            );
            //send notification to specific user
            const input = {
              message: notiMessage,
              title: notiTitle,
              type: 'ngo',
              userId: owner._id,
            };
            this.commonService.notification(input);
          }
        }
      }
      const updateData1 = {
        $set: {
          is_deleted: true,
          deletedAt: new Date(),
          delete_account_reason: deleteAccountDto.reason,
        },
        $unset: { access_token: 1, uuid: 1, platform: 1, socket_id: 1 },
      };
      await this.userModel
        .findByIdAndUpdate(userData._id, updateData1, { new: true })
        .select({ _id: 1 })
        .lean();
      return res.json({
        success: true,
        message: mConfig.Delete_account,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user/user.service.ts-delete-account',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async blockUnblockAccount(
    blockedAccountDto: BlockedAccountDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        blockedAccountDto,
      );
      const user = await this.userModel.findById(blockedAccountDto.id).lean();
      if (!user) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let updateData;
        let notiTitle;
        let notiMsg;
        let mailInput;
        if (user.blocked) {
          updateData = {
            $set: { blocked: false },
            $unset: { blocked_account_reason: 1 },
          };
          mailInput = {
            to: user.email,
            subject: mConfig.noti_title_account_unblocked,
            message: `Hello ${user.first_name} ${user.last_name}, Your Saayam account has been unblocked, and it has now been activated.`,
          };
          notiTitle = mConfig.noti_title_account_unblocked;
          notiMsg = mConfig.noti_msg_account_unblocked;
        } else {
          updateData = {
            $set: {
              blocked: true,
              blocked_account_reason: blockedAccountDto.reason,
            },
          };
          notiTitle = mConfig.noti_title_account_blocked;
          notiMsg = mConfig.noti_msg_account_blocked;
          mailInput = {
            to: user.email,
            subject: mConfig.noti_title_account_blocked,
            message: `Hello ${user.first_name} ${user.last_name}, Your Saayam account has been blocked by Saayam team.`,
          };
        }

        await this.userModel
          .findByIdAndUpdate(blockedAccountDto.id, updateData)
          .select({ _id: 1 })
          .lean();
        //send notification to specific user
        const status = user.blocked ? 'unblock' : 'block';
        const input = {
          message: notiMsg,
          title: notiTitle,
          type: status,
          userId: user._id,
        };
        this.commonService.notification(input);
        await this.commonService.sendMail(mailInput, this.request.originalUrl);

        //Add Activity Log
        const logData = {
          action: status,
          user_id: user._id,
          entity_name: user.blocked
            ? 'Block User Account'
            : 'Unblock User Account',
          description: `User ${status}ed successfully.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: user.blocked ? mConfig.Unblocked : mConfig.Blocked,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user/user.service.ts-blockUnblockAccount',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async getHungerData(res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', '');
      const userReqData: any = await this.queueService.findUserRequestData(
        this.request.user._id,
      );

      return res.send({
        success: true,
        data: userReqData,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user/user.service.ts-getHungerData',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get user profile details
  public async profileCount(
    id: string,
    userType: string,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      let data;
      const userData = this.request.user;

      if (userType === 'ngo') {
        data = await this.ngoModel.aggregate([
          {
            $match: {
              _id: ObjectID(id),
              is_deleted: { $ne: true },
            },
          },
          {
            $lookup: {
              from: 'ngo-updated-data',
              let: { id: '$_id', status: '$ngo_status' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$ngo_id', '$$id'] },
                        { $eq: ['$$status', 'waiting_for_verify'] },
                      ],
                    },
                  },
                },
                { $sort: { _id: -1 } },
                { $limit: 1 },
              ],
              as: 'updatedData',
            },
          },
          {
            $unwind: {
              path: '$updatedData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'requests',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$user_ngo_id', '$$id'] },
                        { $ne: ['$status', 'draft'] },
                        { $ne: ['$is_deleted', true] },
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
              from: 'requests',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$donor_ngo_id', '$$id'] },
                        { $eq: ['$status', 'delivered'] },
                        { $ne: ['$is_deleted', true] },
                      ],
                    },
                  },
                },
              ],
              as: 'donorData',
            },
          },
          {
            $lookup: {
              from: 'requests',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$volunteer_ngo_id', '$$id'] },
                        { $eq: ['$status', 'delivered'] },
                        { $ne: ['$is_deleted', true] },
                      ],
                    },
                  },
                },
              ],
              as: 'volunteerData',
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
                        { $eq: ['$donor_id', '$$id'] },
                        { $eq: ['$is_donor_ngo', true] },
                        {
                          $in: [
                            '$transaction_type',
                            ['ngo-donation', 'donation'],
                          ],
                        },
                        { $ne: ['$saayam_community', true] },
                      ],
                    },
                  },
                },
                {
                  $lookup: {
                    from: 'currency_rates',
                    let: {
                      transactionDate: {
                        $dateToString: {
                          format: '%Y-%m-%d',
                          date: '$createdAt',
                        },
                      },
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$currency', 'USD'] },
                              { $eq: ['$date', '$$transactionDate'] },
                            ],
                          },
                        },
                      },
                    ],
                    as: 'rates',
                  },
                },
                {
                  $unwind: {
                    path: '$rates',
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
              as: 'donorTData',
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
                        { $eq: ['$user_id', '$$id'] },
                        { $eq: ['$is_user_ngo', true] },
                        {
                          $in: [
                            '$transaction_type',
                            ['ngo-donation', 'donation'],
                          ],
                        },
                        { $ne: ['$saayam_community', true] },
                      ],
                    },
                  },
                },
                {
                  $lookup: {
                    from: 'currency_rates',
                    let: {
                      transactionDate: {
                        $dateToString: {
                          format: '%Y-%m-%d',
                          date: '$createdAt',
                        },
                      },
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$currency', 'USD'] },
                              { $eq: ['$date', '$$transactionDate'] },
                            ],
                          },
                        },
                      },
                    ],
                    as: 'rates',
                  },
                },
                {
                  $unwind: {
                    path: '$rates',
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
              as: 'myDonationData',
            },
          },
          {
            $lookup: {
              from: 'user',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$$id', '$ngo_id'] }],
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
            $lookup: {
              from: 'user',
              localField: 'trustees_name._id',
              foreignField: '_id',
              as: 'tUserData',
            },
          },
          {
            $lookup: {
              from: 'user',
              localField: 'updatedData.trustees_name._id',
              foreignField: '_id',
              as: 'updatedTUserData',
            },
          },
          {
            $lookup: {
              from: 'bookmark_items',
              let: { id: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$category_slug', 'ngo'],
                        },
                        {
                          $eq: ['$user_id', ObjectID(userData?._id)],
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
            $set: {
              trustees_name: {
                $map: {
                  input: '$trustees_name',
                  in: {
                    $mergeObjects: [
                      '$$this',
                      {
                        user: {
                          $arrayElemAt: [
                            '$tUserData',
                            { $indexOfArray: ['$tUserData._id', '$$this._id'] },
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
            $set: {
              updated_trustees_name: {
                $map: {
                  input: '$updatedData.trustees_name',
                  in: {
                    $mergeObjects: [
                      '$$this',
                      {
                        user: {
                          $arrayElemAt: [
                            '$updatedTUserData',
                            {
                              $indexOfArray: [
                                '$updatedTUserData._id',
                                '$$this._id',
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
            $set: {
              converted_donation_amount: {
                $function: {
                  body: function (transactions, userCurrency) {
                    return transactions
                      .filter((e) => e.transaction_type === 'donation')
                      .map((element) => {
                        if (element?.rates && element.rates?.rates) {
                          const transactionCur =
                            element.currency_code.toUpperCase();
                          const fromRate =
                            transactionCur !== 'USD'
                              ? element.rates.rates[transactionCur]
                              : 1;
                          const toRate =
                            userCurrency[0].name.toLowerCase() !== 'usd'
                              ? element.rates.rates[
                                  userCurrency[0].name.toUpperCase()
                                ]
                              : 1;
                          const conversionRate = toRate / fromRate;
                          return element.amount * conversionRate;
                        }
                        return element.amount;
                      });
                  },
                  args: ['$donorTData', '$country_data.currency'],
                  lang: 'js',
                },
              },
              converted_ngo_amount: {
                $function: {
                  body: function (transactions, userCurrency) {
                    return transactions
                      .filter((e) => e.transaction_type === 'ngo-donation')
                      .map((element) => {
                        if (element?.rates && element.rates?.rates) {
                          const transactionCur =
                            element.currency_code.toUpperCase();
                          const fromRate =
                            transactionCur !== 'USD'
                              ? element.rates.rates[transactionCur]
                              : 1;
                          const toRate =
                            userCurrency[0].name.toLowerCase() !== 'usd'
                              ? element.rates.rates[
                                  userCurrency[0].name.toUpperCase()
                                ]
                              : 1;
                          const conversionRate = toRate / fromRate;
                          return element.amount * conversionRate;
                        }
                        return element.amount;
                      });
                  },
                  args: ['$donorTData', '$country_data.currency'],
                  lang: 'js',
                },
              },
              converted_my_donation_amount: {
                $function: {
                  body: function (transactions, userCurrency) {
                    return transactions
                      .filter((e) => e.transaction_type === 'donation')
                      .map((element) => {
                        if (element?.rates && element.rates?.rates) {
                          const transactionCur =
                            element.currency_code.toUpperCase();
                          const fromRate =
                            transactionCur !== 'USD'
                              ? element.rates.rates[transactionCur]
                              : 1;
                          const toRate =
                            userCurrency[0].name.toLowerCase() !== 'usd'
                              ? element.rates.rates[
                                  userCurrency[0].name.toUpperCase()
                                ]
                              : 1;
                          const conversionRate = toRate / fromRate;
                          return element.amount * conversionRate;
                        }
                        return element.amount;
                      });
                  },
                  args: ['$myDonationData', '$country_data.currency'],
                  lang: 'js',
                },
              },
              converted_my_ngo_amount: {
                $function: {
                  body: function (transactions, userCurrency) {
                    return transactions
                      .filter((e) => e.transaction_type === 'ngo-donation')
                      .map((element) => {
                        if (element?.rates && element.rates?.rates) {
                          const transactionCur =
                            element.currency_code.toUpperCase();
                          const fromRate =
                            transactionCur !== 'USD'
                              ? element.rates.rates[transactionCur]
                              : 1;
                          const toRate =
                            userCurrency[0].name.toLowerCase() !== 'usd'
                              ? element.rates.rates[
                                  userCurrency[0].name.toUpperCase()
                                ]
                              : 1;
                          const conversionRate = toRate / fromRate;
                          return element.amount * conversionRate;
                        }
                        return element.amount;
                      });
                  },
                  args: ['$myDonationData', '$country_data.currency'],
                  lang: 'js',
                },
              },
            },
          },
          {
            $project: {
              ngo: '$ngo_causes',
              total_requests: { $size: '$requestData' },
              hunger_requests: {
                $sum: {
                  $map: {
                    input: '$requestData',
                    as: 'req',
                    in: {
                      $cond: [
                        {
                          $and: [
                            {
                              $eq: ['$$req.category_slug', 'hunger'],
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
              request_for_myself: {
                $sum: {
                  $map: {
                    input: '$requestData',
                    as: 'req',
                    in: {
                      $cond: [
                        {
                          $and: [
                            {
                              $or: [
                                {
                                  $eq: [
                                    '$$req.form_data.request_for_self',
                                    true,
                                  ],
                                },
                                {
                                  $eq: [
                                    '$$req.form_data.food_for_myself',
                                    true,
                                  ],
                                },
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
              hunger_donated: { $size: '$donorData' },
              volunteer_in_hunger: { $size: '$volunteerData' },
              'total_donation_to_user.count': {
                $sum: {
                  $map: {
                    input: '$donorTData',
                    as: 'transaction',
                    in: {
                      $cond: [
                        { $eq: ['$$transaction.transaction_type', 'donation'] },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              'total_donation_to_user.total_amount': {
                $sum: '$converted_donation_amount',
              },

              'total_donation_to_ngo.count': {
                $sum: {
                  $map: {
                    input: '$donorTData',
                    as: 'transaction',
                    in: {
                      $cond: [
                        {
                          $eq: [
                            '$$transaction.transaction_type',
                            'ngo-donation',
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              'total_donation_to_ngo.total_amount': {
                $sum: '$converted_ngo_amount',
              },

              'total_donation_in_my_requests.count': {
                $sum: {
                  $map: {
                    input: '$myDonationData',
                    as: 'transaction',
                    in: {
                      $cond: [
                        { $eq: ['$$transaction.transaction_type', 'donation'] },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              'total_donation_in_my_requests.total_amount': {
                $sum: '$converted_my_donation_amount',
              },

              'total_donation_in_my_ngo.count': {
                $sum: {
                  $map: {
                    input: '$myDonationData',
                    as: 'transaction',
                    in: {
                      $cond: [
                        {
                          $eq: [
                            '$$transaction.transaction_type',
                            'ngo-donation',
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              'total_donation_in_my_ngo.total_amount': {
                $sum: '$converted_my_ngo_amount',
              },

              _id: 1,
              country_data: 1,
              ngo_cover_image: {
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
              ngo_name: '$form_data.ngo_name',
              ngo_email: '$form_data.ngo_email',
              first_name: '$form_data.first_name',
              last_name: '$form_data.last_name',
              ngo_phone: '$form_data.ngo_mobile_number.phoneNumber',
              ngo_phone_code: '$form_data.ngo_mobile_number.countryCodeD',
              ngo_status: 1,
              ngo_location: '$ngo_address',
              createdAt: 1,
              registration_certificate_number:
                '$form_data.registration_certificate_number',
              website_link: '$form_data.website_link',
              about_us: '$form_data.about_your_ngo',
              established_year: '$form_data.established_year',
              organisation_status: '$form_data.organisation_status',
              level_of_action: '$form_data.level_of_action',
              registered_under_act: '$form_data.registered_under_act',
              _12a_registration_number: '$form_data._12a_registration_number',
              _80g_registration_number: '$form_data._80g_registration_number',
              fcra_registration_number: '$form_data.fcra_registration_number',
              vission: '$vission',
              mission: '$mission',
              programs: '$programs',
              history: '$history',
              values_and_principles: '$values_and_principles',
              is_bookmark: {
                $cond: {
                  if: { $gt: [{ $size: '$bookmarkData' }, 0] }, // Check if bookmarks array is not empty
                  then: true, // Bookmarks exist
                  else: false, // No bookmarks
                },
              },
              trustees_name: {
                $map: {
                  input: '$trustees_name',
                  as: 'trustee',
                  in: {
                    _id: '$$trustee._id',
                    first_name: '$$trustee.user.first_name',
                    last_name: '$$trustee.user.last_name',
                    email: '$$trustee.user.email',
                    image: {
                      $ifNull: [
                        {
                          $concat: [
                            authConfig.imageUrl,
                            'user/',
                            '$$trustee.user.image',
                          ],
                        },
                        null,
                      ],
                    },
                    phone_code: '$$trustee.user.phone_code',
                    phone: '$$trustee.user.phone',
                    country_code: '$$trustee.country_code',
                    added_time: '$$trustee.added_time',
                    removed_time: '$$trustee.removed_time',
                    is_owner: '$$trustee.is_owner',
                    verified: '$$trustee.verified',
                    flag: '$$trustee.user.phone_country_short_name',
                  },
                },
              },
              updated_data: {
                $cond: {
                  if: {
                    $eq: ['$updatedData', null],
                  },
                  then: {},
                  else: {
                    ngo_name: '$updatedData.form_data.ngo_name',
                    ngo_email: '$updatedData.form_data.ngo_email',
                    trustees_name: {
                      $map: {
                        input: '$updated_trustees_name',
                        as: 'trustee',
                        in: {
                          _id: '$$trustee._id',
                          first_name: '$$trustee.user.first_name',
                          last_name: '$$trustee.user.last_name',
                          email: '$$trustee.user.email',
                          image: {
                            $ifNull: [
                              {
                                $concat: [
                                  authConfig.imageUrl,
                                  'user/',
                                  '$$trustee.user.image',
                                ],
                              },
                              null,
                            ],
                          },
                          phone_code: '$$trustee.user.phone_code',
                          phone: '$$trustee.user.phone',
                          country_code: '$$trustee.country_code',
                          about_us: '$$trustee.about_us',
                          added_time: '$$trustee.added_time',
                          removed_time: '$$trustee.removed_time',
                          is_owner: '$$trustee.is_owner',
                          verified: '$$trustee.verified',
                          flag: '$$trustee.user.phone_country_short_name',
                        },
                      },
                    },
                    ngo_location: '$updatedData.ngo_address',
                    last_name: '$updatedData.form_data.last_name',
                    first_name: '$updatedData.form_data.first_name',
                    ngo_phone:
                      '$updatedData.form_data.ngo_mobile_number.phoneNumber',
                    ngo_phone_code:
                      '$updatedData.form_data.ngo_mobile_number.countryCodeD',
                    registration_certificate_number:
                      '$updatedData.form_data.registration_certificate_number',
                    website_link: '$updatedData.form_data.website_link',
                    about_us: '$updatedData.form_data.about_your_ngo',
                    established_year: '$updatedData.form_data.established_year',
                    organisation_status:
                      '$updatedData.form_data.organisation_status',
                    level_of_action: '$updatedData.form_data.level_of_action',
                    registered_under_act:
                      '$updatedData.form_data.registered_under_act',
                    _12a_registration_number:
                      '$updatedData.form_data._12a_registration_number',
                    _80g_registration_number:
                      '$updatedData.form_data._80g_registration_number',
                    fcra_registration_number:
                      '$updatedData.form_data.fcra_registration_number',
                    ngo_cover_image: {
                      $concat: [
                        authConfig.imageUrl,
                        'ngo/',
                        { $toString: '$_id' },
                        '/',
                        {
                          $arrayElemAt: [
                            '$updatedData.form_data.files.ngo_cover_photo',
                            0,
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        ]);
      } else {
        data = await this.userModel
          .aggregate([
            {
              $match: { _id: ObjectID(id) },
            },
            {
              $lookup: {
                from: 'requests',
                let: { id: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$user_id', '$$id'] },
                          { $ne: ['$status', 'draft'] },
                          { $ne: ['$is_deleted', true] },
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
                from: 'requests',
                let: { id: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$donor_id', '$$id'] },
                          { $eq: ['$status', 'delivered'] },
                          { $ne: ['$is_deleted', true] },
                        ],
                      },
                    },
                  },
                ],
                as: 'donorData',
              },
            },
            {
              $lookup: {
                from: 'requests',
                let: { id: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$volunteer_id', '$$id'] },
                          { $eq: ['$status', 'delivered'] },
                          { $ne: ['$is_deleted', true] },
                        ],
                      },
                    },
                  },
                ],
                as: 'volunteerData',
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
                          { $eq: ['$donor_id', '$$id'] },
                          { $eq: ['$is_donor_ngo', false] },
                          {
                            $in: [
                              '$transaction_type',
                              ['ngo-donation', 'donation'],
                            ],
                          },
                          { $ne: ['$saayam_community', true] },
                        ],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'currency_rates',
                      let: {
                        transactionDate: {
                          $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                          },
                        },
                      },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $and: [
                                { $eq: ['$currency', 'USD'] },
                                { $eq: ['$date', '$$transactionDate'] },
                              ],
                            },
                          },
                        },
                      ],
                      as: 'rates',
                    },
                  },
                  {
                    $unwind: {
                      path: '$rates',
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ],
                as: 'donorTData',
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
                          { $eq: ['$user_id', '$$id'] },
                          { $eq: ['$is_user_ngo', false] },
                          { $eq: ['$transaction_type', 'donation'] },
                          { $ne: ['$saayam_community', true] },
                        ],
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: 'currency_rates',
                      let: {
                        transactionDate: {
                          $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                          },
                        },
                      },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $and: [
                                { $eq: ['$currency', 'USD'] },
                                { $eq: ['$date', '$$transactionDate'] },
                              ],
                            },
                          },
                        },
                      ],
                      as: 'rates',
                    },
                  },
                  {
                    $unwind: {
                      path: '$rates',
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ],
                as: 'reqTData',
              },
            },

            {
              $set: {
                converted_request_amount: {
                  $function: {
                    body: function (transactions, userCurrency) {
                      return transactions.map((element) => {
                        if (element?.rates && element.rates?.rates) {
                          const transactionCur =
                            element.currency_code.toUpperCase();
                          const fromRate =
                            transactionCur !== 'USD'
                              ? element.rates.rates[transactionCur]
                              : 1;
                          const toRate =
                            userCurrency[0].name.toLowerCase() !== 'usd'
                              ? element.rates.rates[
                                  userCurrency[0].name.toUpperCase()
                                ]
                              : 1;
                          const conversionRate = toRate / fromRate;
                          return element.amount * conversionRate;
                        }
                        return element.amount;
                      });
                    },
                    args: ['$reqTData', '$country_data.currency'],
                    lang: 'js',
                  },
                },
                converted_ngo_amount: {
                  $function: {
                    body: function (transactions, userCurrency) {
                      return transactions
                        .filter((e) => e.transaction_type === 'ngo-donation')
                        .map((element) => {
                          if (element?.rates && element.rates?.rates) {
                            const transactionCur =
                              element.currency_code.toUpperCase();
                            const fromRate =
                              transactionCur !== 'USD'
                                ? element.rates.rates[transactionCur]
                                : 1;
                            const toRate =
                              userCurrency[0].name.toLowerCase() !== 'usd'
                                ? element.rates.rates[
                                    userCurrency[0].name.toUpperCase()
                                  ]
                                : 1;
                            const conversionRate = toRate / fromRate;
                            return element.amount * conversionRate;
                          }
                          return element.amount;
                        });
                    },
                    args: ['$donorTData', '$country_data.currency'],
                    lang: 'js',
                  },
                },
                converted_donation_amount: {
                  $function: {
                    body: function (transactions, userCurrency) {
                      return transactions
                        .filter((e) => e.transaction_type === 'donation')
                        .map((element) => {
                          if (element?.rates && element.rates?.rates) {
                            const transactionCur =
                              element.currency_code.toUpperCase();
                            const fromRate =
                              transactionCur !== 'USD'
                                ? element.rates.rates[transactionCur]
                                : 1;
                            const toRate =
                              userCurrency[0].name.toLowerCase() !== 'usd'
                                ? element.rates.rates[
                                    userCurrency[0].name.toUpperCase()
                                  ]
                                : 1;
                            const conversionRate = toRate / fromRate;
                            return element.amount * conversionRate;
                          }
                          return element.amount;
                        });
                    },
                    args: ['$donorTData', '$country_data.currency'],
                    lang: 'js',
                  },
                },
              },
            },
            {
              $project: {
                is_volunteer: 1,
                is_donor: 1,
                is_user: 1,
                my_causes: 1,
                total_requests: { $size: '$requestData' },
                hunger_requests: {
                  $sum: {
                    $map: {
                      input: '$requestData',
                      as: 'req',
                      in: {
                        $cond: [
                          {
                            $and: [
                              {
                                $eq: ['$$req.category_slug', 'hunger'],
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
                request_for_myself: {
                  $sum: {
                    $map: {
                      input: '$requestData',
                      as: 'req',
                      in: {
                        $cond: [
                          {
                            $and: [
                              {
                                $or: [
                                  {
                                    $eq: [
                                      '$$req.form_data.request_for_self',
                                      true,
                                    ],
                                  },
                                  {
                                    $eq: [
                                      '$$req.form_data.food_for_myself',
                                      true,
                                    ],
                                  },
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
                hunger_donated: { $size: '$donorData' },
                volunteer_in_hunger: { $size: '$volunteerData' },
                'total_donation_to_user.count': {
                  $sum: {
                    $map: {
                      input: '$donorTData',
                      as: 'transaction',
                      in: {
                        $cond: [
                          {
                            $eq: ['$$transaction.transaction_type', 'donation'],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
                'total_donation_to_user.total_amount': {
                  $sum: '$converted_donation_amount',
                },

                'total_donation_to_ngo.count': {
                  $sum: {
                    $map: {
                      input: '$donorTData',
                      as: 'transaction',
                      in: {
                        $cond: [
                          {
                            $eq: [
                              '$$transaction.transaction_type',
                              'ngo-donation',
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
                'total_donation_to_ngo.total_amount': {
                  $sum: '$converted_ngo_amount',
                },

                'total_donation_in_my_requests.count': {
                  $size: '$reqTData',
                },
                'total_donation_in_my_requests.total_amount': {
                  $sum: '$converted_request_amount',
                },
                _id: 1,
                display_name: 1,
                last_name: 1,
                first_name: 1,
                image: {
                  $ifNull: [
                    { $concat: [authConfig.imageUrl, 'user/', '$image'] },
                    null,
                  ],
                },
                country_data: 1,
              },
            },
          ])
          .exec();
        if (!_.isEmpty(data) && !_.isEmpty(data[0])) {
          const userD = {
            is_donor: data[0].is_donor,
            is_user: data[0].is_user,
            is_volunteer: data[0].is_volunteer,
            my_causes: data[0].my_causes,
          };
          const { userCauses } = await this.queueService.userCauses(
            userD,
            null,
          );
          data[0].user = userCauses;
        }
      }

      if (!_.isEmpty(data) && !_.isEmpty(data[0])) {
        return res.json({
          success: true,
          data: data[0],
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
        'src/controller/users/users.service.ts-profileCount',
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
      const query = {
        phone_code: sendOtpDto.phone_code,
        phone: sendOtpDto.phone,
        $or: [{ platform: sendOtpDto.platform }, { is_default: true }],
      };
      const otpData = await this.otpVerifyModel.findOne(query).lean();

      if (!_.isEmpty(otpData)) {
        if (otpData.is_default && !_.isUndefined(otpData.is_default)) {
          return res.json({
            success: true,
            message: mConfig.OTP_sent,
          });
        } else {
          if (
            sendOtpDto.platform == 'app' &&
            otpData.app_otp_resend_time >= parseInt(moment().format('X'))
          ) {
            return res.json({
              message: mConfig.Already_send_OTP,
              success: true,
            });
          } else if (
            sendOtpDto.platform == 'web' &&
            otpData.web_otp_resend_time >= parseInt(moment().format('X'))
          ) {
            return res.json({
              message: mConfig.Already_send_OTP,
              success: true,
            });
          }
        }
      }

      const OTP = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
      const expiredTime = parseInt(moment().add(1, 'minutes').format('X'));
      const resendTime = parseInt(moment().add(20, 'seconds').format('X'));
      let data = {};
      if (sendOtpDto.platform == 'web') {
        data = {
          phone_code: sendOtpDto.phone_code,
          phone: sendOtpDto.phone,
          web_otp: String(OTP),
          web_otp_expired_at: expiredTime,
          web_otp_resend_time: resendTime,
          platform: sendOtpDto.platform,
        };
      } else {
        data = {
          phone_code: sendOtpDto.phone_code,
          phone: sendOtpDto.phone,
          app_otp: String(OTP),
          app_otp_expired_at: expiredTime,
          app_otp_resend_time: resendTime,
          platform: sendOtpDto.platform,
        };
      }
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
      const text = {
        phone: [sendOtpDto.phone_code + ' ' + sendOtpDto.phone],
        message: message,
      };
      const response: any = await this.commonService.sendTextMessage(
        text,
        this.request.originalUrl,
      );
      if (response.success) {
        return res.json({
          success: true,
          message: mConfig.OTP_sent,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.Something_went_wrong,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user/user.service.ts-sendOtp',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for verify otp
  public async verifyOtp(verifyOtpDto: VerifyOtpDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        verifyOtpDto,
      );
      const user = await this.userModel
        .findOne({
          phone_code: verifyOtpDto.phone_code,
          phone: verifyOtpDto.phone,
          is_deleted: false,
        })
        .lean();
      if (!user) {
        return res.json({
          message: mConfig.User_not_found,
          success: false,
        });
      } else {
        const verifyOTP = await this.commonService.verifyOtp(verifyOtpDto);

        if (verifyOTP['verified']) {
          const result = await this.makeLogin(
            user,
            verifyOtpDto.uuid,
            verifyOtpDto.platform,
          );
          return res.json(result);
        } else {
          return res.json(verifyOTP);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user/user.service.ts-verifyOtp',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for register user with verify otp
  public async webSignup(
    file: object,
    createDto: WebSignupDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createDto,
      );
      //BVerifying any type of otp
      const verifyOTP = await this.commonService.verifyOtp(createDto);
      if (verifyOTP['verified']) {
        let user;
        const existUser = await this.userModel
          .findOne({
            phone_code: createDto.phone_code,
            phone: createDto.phone,
            is_deleted: false,
          })
          .lean();

        if (_.isEmpty(existUser) || (existUser && existUser.is_guest)) {
          const imageId: any = await this.commonService.checkAndLoadImage(
            file,
            'user',
          );
          const latitude = Number(createDto.latitude);
          const longitude = Number(createDto.longitude);
          // Add code for no country found.
          const countryData = await this.commonService.getCountry(
            createDto.country_name,
          );
          const timezonesName = await this.commonService.getTimezoneFromLatLon(
            latitude,
            longitude,
          );

          const dtl: any = {
            first_name: createDto.first_name,
            last_name: createDto.last_name,
            phone_code: createDto.phone_code,
            phone: createDto.phone,
            phone_country_full_name: createDto.phone_country_full_name,
            phone_country_short_name: createDto.phone_country_short_name,
            email: createDto.email,
            is_donor: createDto.is_donor,
            is_user: createDto.is_user,
            is_volunteer: createDto.is_volunteer,
            display_name: createDto.display_name,
            location: {
              type: 'Point',
              coordinates: [longitude, latitude],
              city: createDto.city,
            },
            image: imageId && imageId.file_name ? imageId.file_name : null,
            is_restaurant: false,
            restaurant_name: null,
            restaurant_location: null,
            is_veg: false,
            country_data: countryData ? countryData : null,
            default_country: createDto.country_name,
            time_zone: timezonesName,
            race: createDto.race ? createDto.race : null,
            religion: createDto.religion ? createDto.religion : null,
            blood_group: createDto.blood_group || null,
            dob: createDto.dob || null,
            gender: createDto.gender || null,
            my_causes: createDto.my_causes,
          };

          const createUser = new this.userModel(dtl);
          user = await createUser.save();

          const result1 = await this.makeLogin(
            user,
            createDto.uuid,
            createDto.platform,
          );
          return res.json(result1);
        } else {
          return res.json({
            success: false,
            message: mConfig.Phone_is_already_exist,
          });
        }
      } else {
        return res.json(verifyOTP);
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-webSignup',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for register guest user
  public async guestSignup(
    createUserDto: GuestSignupDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createUserDto,
      );
      const verifyOTP = await this.commonService.verifyOtp(createUserDto);
      if (verifyOTP['verified']) {
        let user = await this.userModel
          .findOne({
            phone_code: createUserDto.phone_code,
            phone: createUserDto.phone,
            is_deleted: false,
          })
          .lean();

        if (_.isEmpty(user)) {
          const latitude = Number(createUserDto.latitude);
          const longitude = Number(createUserDto.longitude);
          // Add code for no country found.
          const countryData = await this.commonService.getCountry(
            createUserDto.country_name,
          );
          const timezonesName = await this.commonService.getTimezoneFromLatLon(
            latitude,
            longitude,
          );

          const dtl: any = {
            first_name: createUserDto.name,
            display_name: createUserDto.name,
            phone_code: createUserDto.phone_code,
            phone: createUserDto.phone,
            phone_country_full_name: createUserDto.phone_country_full_name,
            phone_country_short_name: createUserDto.phone_country_short_name,
            is_user: true,
            location: {
              type: 'Point',
              coordinates: [longitude, latitude],
              city: createUserDto.city,
            },
            country_data: countryData ? countryData : null,
            default_country: createUserDto.country_name,
            time_zone: timezonesName,
          };
          const createUser = new this.userModel(dtl);
          user = await createUser.save();

          if (_.isEmpty(user)) {
            return res.json({
              success: false,
              message: mConfig.Invalid,
            });
          }
        }

        const result1 = await this.makeLogin(
          user,
          createUserDto.uuid,
          createUserDto.platform,
        );
        return res.json(result1);
      } else {
        return res.json(verifyOTP);
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-guestSignup',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for verify phone otp
  public async verifyPhoneOtp(verifyOtpDto: VerifyPhoneOtpDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        verifyOtpDto,
      );
      //verifying any type of otp
      const verifyOTP = await this.commonService.verifyOtp(verifyOtpDto);

      if (verifyOTP['verified']) {
        return res.json({
          success: true,
          message: mConfig.OTP_verified,
        });
      } else {
        return res.json(verifyOTP);
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/user/user.service.ts-verifyPhoneOtp',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for signup user
  public async createInterviewSignup(
    signupDto: InterviewSignupDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        signupDto,
      );
      const existUser: any = await this.userModel
        .findOne({
          email: new RegExp('^' + signupDto.email + '$', 'i'),
          is_deleted: false,
        })
        .select({ email: 1 })
        .lean();

      if (_.isEmpty(existUser)) {
        const saveData: any = {
          first_name: signupDto.first_name,
          last_name: signupDto.last_name,
          email: signupDto.email,
          password: signupDto.password
            ? bcrypt.hashSync(signupDto.password, 8)
            : null,
          interview_user: true,
        };

        const createUser = new this.userModel(saveData);
        const user = await createUser.save();

        const result1 = await this.interviewMakeLogin(user);
        return res.json(result1);
      } else {
        return res.json({
          success: false,
          message: mConfig.User_exists_with_email,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-createInterviewSignup',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for user login
  public async interviewLogin(
    loginUserDto: InterviewLogin,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        loginUserDto,
      );
      const existUser = await this.userModel
        .findOne({
          email: new RegExp('^' + loginUserDto.email + '$', 'i'),
          is_deleted: false,
          interview_user: true,
        })
        .lean();

      if (_.isEmpty(existUser)) {
        return res.json({
          message: mConfig.User_not_found,
          success: false,
        });
      } else {
        const validPassword = await bcrypt.compare(
          loginUserDto.password,
          existUser.password,
        );

        if (!validPassword)
          return res.json({
            success: false,
            message: mConfig.Password_did_not_match,
          });

        const result = await this.interviewMakeLogin(existUser);
        return res.json(result);
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-interviewLogin',
      );
      return res.status(500).json({
        message: mConfig.Something_went_wrong,
        success: false,
      });
    }
  }

  public async interviewMakeLogin(user: any) {
    try {
      const badge: any = await this.commonService.badgeCount(user._id);
      const userDtl: any = {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        badge,
      };

      const token: any = await this.commonService.randomTokenGenerator(32);

      let updateData: any = {};

      updateData = {
        $push: {
          access_token: token,
        },
      };

      await this.userModel.updateOne({ _id: user._id }, updateData).lean();

      return {
        success: true,
        data: userDtl,
        token: token,
        message: mConfig.Login_successfully,
      };
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-interviewMakeLogin',
      );
    }
  }

  public async userList(param, res: any): Promise<UserDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      let query: any = { is_deleted: { $ne: true } };
      let search = param.search;

      if (search && !_.isUndefined(search)) {
        const escapedSearch = _.escapeRegExp(search);
        const regexPattern = new RegExp(escapedSearch, 'i');
        query = {
          $or: [
            { user_name: { $regex: regexPattern } },
            {
              phone: { $regex: regexPattern },
            },
            {
              email: { $regex: regexPattern },
            },
          ],
        };
      }

      const data = await this.userModel
        .aggregate(
          [
            { $match: query },
            {
              $project: {
                _id: 1,
                email: 1,
                user_name: {
                  $concat: [
                    '$first_name',
                    {
                      $cond: {
                        if: { $ifNull: ['$last_name', null] },
                        then: { $concat: [' ', '$last_name'] },
                        else: '',
                      },
                    },
                    {
                      $cond: {
                        if: { $ifNull: ['$phone', null] },
                        then: {
                          $concat: ['(', '$phone_code', '-', '$phone', ')'],
                        },
                        else: '',
                      },
                    },
                  ],
                },
                image: {
                  $ifNull: [
                    { $concat: [authConfig.imageUrl, 'user/', '$image'] },
                    null,
                  ],
                },
              },
            },
            { $sort: { user_name: 1 } },
          ],
          { collation: authConfig.collation },
        )
        .limit(10);

      return res.json({
        data,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-userList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async getAddress(res: any) {
    try {
      //Get client public ip address
      const ipAddress = this.request.headers['x-forwarded-for'];

      const locationObj = await this.commonService.getIpLocation(ipAddress);
      return res.json({
        data: locationObj,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-getAddress',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for change user role
  public async setActiveRole(
    setActiveRoleDto: SetActiveRoleDto,
    res: any,
  ): Promise<User> {
    try {
      const userData = this.request.user;
      const tokenData: any = await this.userTokenModel
        .findOneAndUpdate(
          { user_id: userData._id, uuid: setActiveRoleDto.uuid },
          { $set: { active_role: setActiveRoleDto.active_role } },
        )
        .select({ active_role: 1 })
        .lean();

      const badge = await this.commonService.badgeCount(
        userData._id,
        tokenData.active_role,
      );

      return res.json({
        success: true,
        badge,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/users/users.service.ts-setActiveRole',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
