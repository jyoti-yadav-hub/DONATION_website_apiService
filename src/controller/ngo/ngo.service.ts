/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import moment from 'moment';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { code, flag } from 'country-emoji';
import {
  NgoUpdated,
  NgoUpdatedDocument,
} from './entities/ngo_updated_data.entity';
import {
  FavouriteNgo,
  FavouriteNgoDocument,
} from './entities/favourite_ngo.entity';
import {
  NgoCertificate,
  NgoCertificateDocument,
} from './entities/ngo_certificates.entity';

import { HttpService } from '@nestjs/axios';
import {
  SocialData,
  SocialDataDocument,
} from '../users/entities/socialData.entity';
import { Fund, FundDocument } from '../fund/entities/fund.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  AdminTransactionModel,
  AdminTransactionDocument,
} from '../donation/entities/admin-transaction.entity';
import {
  AdminNotification,
  AdminNotificationDocument,
} from '../notification/entities/admin-notification.entity';
import { Inject, Injectable } from '@nestjs/common';
import { CreateNgoDto } from './dto/create-ngo.dto';
import { VerifyNgoDto } from './dto/verify-ngo.dto';
import {
  Notification,
  NotificationDocument,
} from '../notification/entities/notification.entity';
import {
  RequestModel,
  RequestDocument,
} from '../request/entities/request.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { GetUserByMailDto } from './dto/get-user.dto';
import { authConfig } from '../../config/auth.config';
import { UsersService } from '../users/users.service';
import admin, { ServiceAccount } from 'firebase-admin';
import { AddTrusteesDto } from './dto/add-trustees.dto';
import { Ngo, NgoDocument } from './entities/ngo.entity';
import mConfig from '../../config/message.config.json';
import { QueueService } from '../../common/queue.service';
import { CommonService } from '../../common/common.service';
import { RemoveTrusteeDto } from './dto/remove-trustee.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import firebaseJson from '../../config/firebase.config.json';
import { ErrorlogService } from '../error-log/error-log.service';
import { Bank, BankDocument } from '../bank/entities/bank.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import {
  NgoTeamMember,
  NgoTeamMemberDocument,
} from './entities/ngo_team_member.entity';
import { Admin, AdminDocument } from '../admin/entities/admin.entity';
import {
  PaymentProcessModel,
  PaymentProcessDocument,
} from '../donation/entities/payment-process.entity';
import {
  TransactionModel,
  TransactionDocument,
} from '../donation/entities/transaction.entity';
import { StripeService } from 'src/stripe/stripe.service';
import { LogService } from 'src/common/log.service';
import { EditHistoryDto } from './dto/edit-history.dto';
import { EditVissionDto } from './dto/edit-vission.dto';
import { NgoPost, NgoPostDocument } from './entities/ngo_post.entity';
import { LikeDislikeDto } from '../drive/dto/like-dislike.dto';
import { Comment, CommentDocument } from '../request/entities/comments.entity';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectID = require('mongodb').ObjectID;
import timezone from 'country-timezone';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { CreateNgo } from './dto/create.dto';
import { NgoModel, NgoModelDocument } from './entities/ngo_model.entity';
import { RequestService } from '../request/request.service';
import { UpdateDto } from './dto/update.dto';
import { AdminCreateNgoDto } from './dto/admin-create-ngo.dto';
import { AdminNgoCreateDto } from './dto/admin-ngo-create.dto';
import { AdminNgoUpdateDto } from './dto/admin-ngo-update.dto';
import { NgoForm, NgoFormDocument } from '../ngo-form/entities/ngo-form.entity';

const adminConfig: ServiceAccount = {
  projectId: firebaseJson.project_id,
  clientEmail: firebaseJson.client_email,
  privateKey: firebaseJson.private_key.replace(/\\n/g, '\n'),
};
const app = !admin.apps.length ? admin.initializeApp() : admin.app();
@Injectable()
export class NGOService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private jwtService: JwtService,
    private httpService: HttpService,
    private readonly queueService: QueueService,
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
    private readonly requestService: RequestService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(NgoForm.name)
    private ngoFormModel: Model<NgoFormDocument>,
    @InjectModel(Bank.name)
    private bankModel: Model<BankDocument>,
    @InjectModel(Comment.name)
    private commentModel: Model<CommentDocument>,
    @InjectModel(NgoPost.name)
    private ngoPostModel: Model<NgoPostDocument>,
    @InjectModel(NgoTeamMember.name)
    private ngoTeamMemberModel: Model<NgoTeamMemberDocument>,
    @InjectModel(NgoUpdated.name)
    private ngoUpdatedModel: Model<NgoUpdatedDocument>,
    @InjectModel(SocialData.name)
    private socialDataModel: Model<SocialDataDocument>,
    @InjectModel(FavouriteNgo.name)
    private favouriteNgoModel: Model<FavouriteNgoDocument>,
    @InjectModel(AdminTransactionModel.name)
    private adminTransactionModel: Model<AdminTransactionDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Fund.name)
    private fundModel: Model<FundDocument>,
    @InjectModel(PaymentProcessModel.name)
    private paymentProcessModel: Model<PaymentProcessDocument>,
    @InjectModel(AdminNotification.name)
    private adminNotification: Model<AdminNotificationDocument>,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(Ngo.name) private ngo: Model<NgoDocument>,
    @InjectModel(NgoModel.name) private ngoModel: Model<NgoModelDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(NgoCertificate.name)
    private ngoCertificateModel: Model<NgoCertificateDocument>,
  ) {}

  //Api for register NGO
  public async ngoCreate(createNgoDto: CreateNgoDto, res: any): Promise<Ngo> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        createNgoDto,
      );
      if (
        createNgoDto.otp &&
        !_.isEmpty(createNgoDto.otp) &&
        createNgoDto.otp_platform &&
        !_.isEmpty(createNgoDto.otp_platform)
      ) {
        const verifyData = {
          phone: createNgoDto.ngo_phone,
          phone_code: createNgoDto.ngo_phone_code,
          otp_platform: createNgoDto.otp_platform,
          otp: createNgoDto.otp,
        };
        //verify otp
        const verifyOTP = await this.commonService.verifyOtp(verifyData);
        if (verifyOTP['success'] == false || verifyOTP['success'] == true) {
          return res.json(verifyOTP);
        }
      }
      //if create ngo using social login
      let facebookData: any = {};

      if (
        createNgoDto.type &&
        !_.isUndefined(createNgoDto.type) &&
        createNgoDto.data_id &&
        !_.isUndefined(createNgoDto.data_id)
      ) {
        const date = new Date();
        facebookData = await this.socialDataModel
          .findOne({
            _id: ObjectID(createNgoDto.data_id),
            createdAt: { $gte: new Date(date.getTime() - 1000 * 60 * 20) },
          })
          .lean();

        //if create time is greater than 5 minutes then throw error
        if (_.isEmpty(facebookData)) {
          return res.json({
            success: false,
            message: mConfig.Please_try_again,
          });
        } else {
          if (facebookData.data && facebookData.data.sImage) {
            const filename = parseInt(moment().format('X')) + '.png';
            const checkImage = await this.usersService.downloadImage(
              facebookData.sImage,
              filename,
            );
            if (checkImage) {
              facebookData.data.image = filename;
            }
          }
        }
      }

      let existUser = await this.userModel
        .findOne({
          phone: createNgoDto.ngo_phone,
          phone_code: createNgoDto.ngo_phone_code,
          is_deleted: false,
        })
        .select({ _id: 1, email: 1, phone_country_short_name: 1 })
        .lean();

      const latitude = Number(createNgoDto.latitude);
      const longitude = Number(createNgoDto.longitude);

      const ngoLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
        city: createNgoDto.city,
      };
      //Get country detail latest object
      const countryData = await this.commonService.getCountry(
        createNgoDto.country_name,
      );
      //Get timezone name
      const timezonesName = await this.commonService.getTimezoneFromLatLon(
        latitude,
        longitude,
      );

      let query = {};
      //if user not exist then create as a donor in user tbl
      if (!existUser) {
        const dtl = {
          is_donor: true,
          is_user: true,
          is_volunteer: true,
          phone_code: createNgoDto.ngo_phone_code,
          phone: createNgoDto.ngo_phone,
          first_name: createNgoDto.first_name,
          display_name: createNgoDto.first_name,
          last_name: createNgoDto.last_name,
          phone_country_full_name: createNgoDto.phone_country_full_name,
          phone_country_short_name: createNgoDto.phone_country_short_name,
          location: ngoLocation,
          image:
            facebookData && facebookData.data && facebookData.data.image
              ? facebookData.data.image
              : null,
          email: createNgoDto.ngo_email,
          is_restaurant: false,
          restaurant_name: null,
          restaurant_location: null,
          is_veg: false,
          country_data: countryData ? countryData : null,
          default_country: createNgoDto.country_name,
          time_zone: timezonesName,
          my_causes: createNgoDto.ngo_causes,
        };

        const createUser = new this.userModel(dtl);
        existUser = await createUser.save();
      } else {
        query = {
          is_donor: true,
          is_user: true,
          is_volunteer: true,
        };
      }

      //Add default trustee
      const defaultTrustee = [
        {
          _id: existUser._id,
          first_name: createNgoDto.first_name,
          last_name: createNgoDto.last_name,
          email: existUser.email,
          phone: createNgoDto.ngo_phone,
          phone_code: createNgoDto.ngo_phone_code,
          flag: flag(existUser.phone_country_short_name),
          country_code: countryData.country_code, //need to verify
          is_owner: true,
          verified: true,
          added_time: new Date(),
        },
      ];
      const detail: any = {
        ngo_name: createNgoDto.ngo_name,
        first_name: createNgoDto.first_name,
        last_name: createNgoDto.last_name,
        ngo_email: createNgoDto.ngo_email,
        expiry_date: createNgoDto.expiry_date,
        website_link: createNgoDto.website_link,
        phone_country_full_name: createNgoDto.phone_country_full_name,
        phone_country_short_name: createNgoDto.phone_country_short_name,
        secondary_country_full_name: createNgoDto.secondary_country_full_name,
        secondary_country_short_name: createNgoDto.secondary_country_short_name,
        ngo_location: ngoLocation,
        ngo_phone_code: createNgoDto.ngo_phone_code,
        ngo_phone: createNgoDto.ngo_phone,
        secondary_phone_code: createNgoDto.secondary_phone_code,
        secondary_phone: createNgoDto.secondary_phone,
        ngo_registration_number: createNgoDto.ngo_registration_number,
        ngo_cover_image: createNgoDto.ngo_cover_image
          ? createNgoDto.ngo_cover_image
          : null,
        ngo_deed: createNgoDto.ngo_deed ? createNgoDto.ngo_deed : null,
        ngo_certificate: createNgoDto.ngo_certificate
          ? createNgoDto.ngo_certificate
          : null,
        trustees_name: defaultTrustee,
        removed_trustee_doc: [],
        ngo_causes: createNgoDto.ngo_causes,
        is_enable: false,
        ngo_status: 'pending',
        country_data: countryData ? countryData : null,
        time_zone: timezonesName,
        about_us: createNgoDto.about_us,
        upload_12A_80G_certificate: createNgoDto?.upload_12A_80G_certificate,
        upload_FCRA_certificate: createNgoDto?.upload_FCRA_certificate,
        ngo_12A_certificate: createNgoDto?.ngo_12A_certificate,
        ngo_80G_certificate: createNgoDto?.ngo_80G_certificate,
        ngo_FCRA_certificate: createNgoDto?.ngo_FCRA_certificate,
      };

      const createNgo = new this.ngo(detail);
      const ngo = await createNgo.save();

      if (_.isEmpty(ngo)) {
        return res.json({
          success: false,
          message: mConfig.Invalid,
        });
      } else {
        //Move uploaded images in tmp to site folder
        if (!_.isEmpty(createNgoDto.ngo_cover_image)) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_cover_image,
            'ngo/' + ngo._id + '/cover-image',
          );
        }
        if (!_.isEmpty(createNgoDto.ngo_deed)) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_deed,
            'ngo/' + ngo._id + '/deed',
          );
        }
        if (!_.isEmpty(createNgoDto.ngo_certificate)) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_certificate,
            'ngo/' + ngo._id + '/certificate',
          );
        }

        if (
          createNgoDto?.upload_12A_80G_certificate &&
          !_.isEmpty(createNgoDto?.ngo_12A_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_12A_certificate,
            'ngo/' + ngo._id + '/ngo-12A-certificate',
          );
        }

        if (
          createNgoDto?.upload_12A_80G_certificate &&
          !_.isEmpty(createNgoDto?.ngo_80G_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_80G_certificate,
            'ngo/' + ngo._id + '/ngo-80G-certificate',
          );
        }

        if (
          createNgoDto?.upload_FCRA_certificate &&
          !_.isEmpty(createNgoDto?.ngo_FCRA_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_FCRA_certificate,
            'ngo/' + ngo._id + '/ngo-FCRA-certificate',
          );
        }

        const ngoData = {
          _id: ngo._id,
          ngo_name: ngo.ngo_name,
          ngo_causes: ngo.ngo_causes,
          ngo_status: ngo.ngo_status,
          ngo_location: ngo.ngo_location,
        };

        query['is_ngo'] = true;
        query['ngo_data'] = ngoData;

        //if create ngo using social login
        if (facebookData && facebookData.data) {
          if (createNgoDto.type == 'google') {
            query['google_id'] = facebookData.data.sub;
          } else if (createNgoDto.type == 'apple') {
            query['apple_id'] = facebookData.data.sub;
          } else if (createNgoDto.type == 'facebook') {
            query['facebook_id'] = facebookData.data.sub;
          }
        }

        const updateUser = await this.userModel
          .findByIdAndUpdate(
            { _id: existUser._id },
            { $set: query },
            { new: true },
          )
          .lean();

        //send notification to admin
        const input = {
          message: mConfig.noti_msg_New_NGO_registered,
          title: mConfig.noti_title_ngo_registered,
          type: 'ngo',
          ngoId: ngo._id,
        };
        this.commonService.sendAdminNotification(input);

        const result1 = await this.usersService.makeLogin(
          updateUser,
          createNgoDto.uuid,
          createNgoDto.platform,
        );
        return res.json(result1);
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-ngoCreate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for register NGO from admin panel
  public async adminNgoCreate(
    createNgoDto: AdminCreateNgoDto,
    res: any,
  ): Promise<Ngo> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        createNgoDto,
      );

      let existUser = await this.userModel
        .findOne({
          phone: createNgoDto.ngo_phone,
          phone_code: createNgoDto.ngo_phone_code,
          is_deleted: false,
        })
        .select({ _id: 1, email: 1, phone_country_short_name: 1 })
        .lean();

      const latitude = Number(createNgoDto.latitude);
      const longitude = Number(createNgoDto.longitude);

      const ngoLocation = {
        type: 'Point',
        coordinates: [longitude, latitude],
        city: createNgoDto.city,
      };
      //Get country object
      const countryData = await this.commonService.getCountry(
        createNgoDto.country_name,
      );
      //Get timezone name
      const timezonesName = await this.commonService.getTimezoneFromLatLon(
        latitude,
        longitude,
      );

      let query = {};
      //if user not exist then create as a donor in user tbl
      if (!existUser) {
        const dtl = {
          is_donor: true,
          is_user: true,
          is_volunteer: true,
          phone_code: createNgoDto.ngo_phone_code,
          phone: createNgoDto.ngo_phone,
          first_name: createNgoDto.first_name,
          display_name: createNgoDto.first_name,
          last_name: createNgoDto.last_name,
          phone_country_full_name: createNgoDto.phone_country_full_name,
          phone_country_short_name: createNgoDto.phone_country_short_name,
          location: ngoLocation,
          email: createNgoDto.ngo_email,
          is_restaurant: false,
          restaurant_name: null,
          restaurant_location: null,
          is_veg: false,
          country_data: countryData ? countryData : null,
          default_country: createNgoDto.country_name,
          time_zone: timezonesName,
          my_causes: createNgoDto.ngo_causes,
        };

        const createUser = new this.userModel(dtl);
        existUser = await createUser.save();
      } else {
        query = {
          first_name: createNgoDto.first_name,
          last_name: createNgoDto.last_name,
          is_donor: true,
          is_user: true,
          is_volunteer: true,
        };
      }

      //Add default trustee
      const defaultTrustee = [
        {
          _id: existUser._id,
          first_name: createNgoDto.first_name,
          last_name: createNgoDto.last_name,
          email: existUser.email,
          phone: createNgoDto.ngo_phone,
          phone_code: createNgoDto.ngo_phone_code,
          flag: flag(existUser.phone_country_short_name),
          country_code: countryData.country_code, //need to verify
          is_owner: true,
          verified: true,
          added_time: new Date(),
        },
      ];
      const detail: any = {
        ngo_name: createNgoDto.ngo_name,
        first_name: createNgoDto.first_name,
        last_name: createNgoDto.last_name,
        ngo_email: createNgoDto.ngo_email,
        expiry_date: createNgoDto.expiry_date,
        website_link: createNgoDto.website_link,
        phone_country_full_name: createNgoDto.phone_country_full_name,
        phone_country_short_name: createNgoDto.phone_country_short_name,
        secondary_country_full_name: createNgoDto.secondary_country_full_name,
        secondary_country_short_name: createNgoDto.secondary_country_short_name,
        ngo_location: ngoLocation,
        ngo_phone_code: createNgoDto.ngo_phone_code,
        ngo_phone: createNgoDto.ngo_phone,
        secondary_phone_code: createNgoDto.secondary_phone_code,
        secondary_phone: createNgoDto.secondary_phone,
        ngo_registration_number: createNgoDto.ngo_registration_number,
        ngo_cover_image: createNgoDto.ngo_cover_image
          ? createNgoDto.ngo_cover_image
          : null,
        ngo_deed: createNgoDto.ngo_deed ? createNgoDto.ngo_deed : null,
        ngo_certificate: createNgoDto.ngo_certificate
          ? createNgoDto.ngo_certificate
          : null,
        trustees_name: defaultTrustee,
        removed_trustee_doc: [],
        ngo_causes: createNgoDto.ngo_causes,
        is_enable: false,
        ngo_status: 'approve',
        country_data: countryData ? countryData : null,
        time_zone: timezonesName,
        about_us: createNgoDto.about_us,
        upload_12A_80G_certificate: createNgoDto?.upload_12A_80G_certificate,
        upload_FCRA_certificate: createNgoDto?.upload_FCRA_certificate,
        ngo_12A_certificate: createNgoDto?.ngo_12A_certificate,
        ngo_80G_certificate: createNgoDto?.ngo_80G_certificate,
        ngo_FCRA_certificate: createNgoDto?.ngo_FCRA_certificate,
        created_by_admin: true,
      };

      const createNgo = new this.ngo(detail);
      const ngo = await createNgo.save();

      if (_.isEmpty(ngo)) {
        return res.json({
          success: false,
          message: mConfig.Invalid,
        });
      } else {
        //Move uploaded images in tmp to site folder
        if (!_.isEmpty(createNgoDto.ngo_cover_image)) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_cover_image,
            'ngo/' + ngo._id + '/cover-image',
          );
        }
        if (!_.isEmpty(createNgoDto.ngo_deed)) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_deed,
            'ngo/' + ngo._id + '/deed',
          );
        }
        if (!_.isEmpty(createNgoDto.ngo_certificate)) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_certificate,
            'ngo/' + ngo._id + '/certificate',
          );
        }

        if (
          createNgoDto?.upload_12A_80G_certificate &&
          !_.isEmpty(createNgoDto?.ngo_12A_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_12A_certificate,
            'ngo/' + ngo._id + '/ngo-12A-certificate',
          );
        }

        if (
          createNgoDto?.upload_12A_80G_certificate &&
          !_.isEmpty(createNgoDto?.ngo_80G_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_80G_certificate,
            'ngo/' + ngo._id + '/ngo-80G-certificate',
          );
        }

        if (
          createNgoDto?.upload_FCRA_certificate &&
          !_.isEmpty(createNgoDto?.ngo_FCRA_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            createNgoDto.ngo_FCRA_certificate,
            'ngo/' + ngo._id + '/ngo-FCRA-certificate',
          );
        }

        const ngoData = {
          _id: ngo._id,
          ngo_name: ngo.ngo_name,
          ngo_causes: ngo.ngo_causes,
          ngo_status: ngo.ngo_status,
          ngo_location: ngo.ngo_location,
        };

        query['is_ngo'] = true;
        query['ngo_data'] = ngoData;

        await this.userModel
          .findByIdAndUpdate(
            { _id: existUser._id },
            { $set: query },
            { new: true },
          )
          .lean();

        return res.json({
          success: true,
          message: mConfig.Ngo_created_successfully,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-adminNgoCreate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for Admin Update NGO
  public async adminNgoUpdate(
    ngoId: string,
    updateNgoDto: any,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateNgoDto,
      );
      const existNgo: any = await this.ngo.findById(ngoId).lean();
      if (!existNgo) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        //Move uploaded images to particular folder
        if (!_.isEmpty(updateNgoDto.ngo_cover_image)) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_cover_image,
            'ngo/' + ngoId + '/cover-image',
          );
        }
        if (!_.isEmpty(updateNgoDto.ngo_deed)) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_deed,
            'ngo/' + ngoId + '/deed',
          );
        }
        if (!_.isEmpty(updateNgoDto.ngo_certificate)) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_certificate,
            'ngo/' + ngoId + '/certificate',
          );
        }

        if (
          updateNgoDto?.upload_12A_80G_certificate &&
          !_.isEmpty(updateNgoDto?.ngo_12A_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_12A_certificate,
            'ngo/' + ngoId + '/ngo-12A-certificate',
          );
        }

        if (
          updateNgoDto.upload_12A_80G_certificate &&
          !_.isEmpty(updateNgoDto.ngo_80G_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_80G_certificate,
            'ngo/' + ngoId + '/ngo-80G-certificate',
          );
        }

        if (
          updateNgoDto.upload_FCRA_certificate &&
          !_.isEmpty(updateNgoDto.ngo_FCRA_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_FCRA_certificate,
            'ngo/' + ngoId + '/ngo-FCRA-certificate',
          );
        }

        if (
          !_.isEmpty(updateNgoDto.ngo_deed) ||
          !_.isEmpty(updateNgoDto.ngo_certificate) ||
          !_.isEmpty(updateNgoDto.expiry_date)
        ) {
          let certificateData: any = {};
          if (
            !_.isEmpty(updateNgoDto.expiry_date) &&
            moment(existNgo.expiry_date).format('YYYY/MM/DD') !=
              moment(updateNgoDto.expiry_date).format('YYYY/MM/DD')
          ) {
            certificateData.expiry_date = updateNgoDto.expiry_date;
          }
          if (
            !_.isEmpty(updateNgoDto.ngo_deed) &&
            existNgo.ngo_deed != updateNgoDto.ngo_deed
          ) {
            certificateData.ngo_deed = updateNgoDto.ngo_deed;
          }
          if (
            !_.isEmpty(updateNgoDto.ngo_certificate) &&
            existNgo.ngo_certificate != updateNgoDto.ngo_certificate
          ) {
            certificateData.ngo_certificate = updateNgoDto.ngo_certificate;
          }
          if (!_.isEmpty(certificateData)) {
            certificateData.ngo_id = ngoId;
            const createCertificate = new this.ngoCertificateModel(
              certificateData,
            );
            createCertificate.save();
          }
        }

        if (
          !_.isEmpty(updateNgoDto.city) &&
          !_.isUndefined(updateNgoDto.longitude) &&
          !_.isUndefined(updateNgoDto.latitude)
        ) {
          const latitude = Number(updateNgoDto.latitude);
          const longitude = Number(updateNgoDto.longitude);

          const timezonesName = await this.commonService.getTimezoneFromLatLon(
            latitude,
            longitude,
          );
          updateNgoDto['ngo_location'] = {
            type: 'Point',
            coordinates: [longitude, latitude],
            city: updateNgoDto.city,
          };
          updateNgoDto['time_zone'] = timezonesName;

          if (!_.isUndefined(updateNgoDto.country_name)) {
            const countryData = await this.commonService.getCountry(
              updateNgoDto.country_name,
            );
            updateNgoDto['country_data'] = countryData;
          }
        }
        let query: any = {};

        updateNgoDto.ngo_cover_image = !_.isEmpty(updateNgoDto.ngo_cover_image)
          ? updateNgoDto.ngo_cover_image
          : null;
        updateNgoDto.ngo_deed = !_.isEmpty(updateNgoDto.ngo_deed)
          ? updateNgoDto.ngo_deed
          : null;
        updateNgoDto.ngo_certificate = !_.isEmpty(updateNgoDto.ngo_certificate)
          ? updateNgoDto.ngo_certificate
          : null;
        updateNgoDto.ngo_12A_certificate = !_.isEmpty(
          updateNgoDto.ngo_12A_certificate,
        )
          ? updateNgoDto.ngo_12A_certificate
          : null;
        updateNgoDto.ngo_80G_certificate = !_.isEmpty(
          updateNgoDto.ngo_80G_certificate,
        )
          ? updateNgoDto.ngo_80G_certificate
          : null;
        updateNgoDto.ngo_FCRA_certificate = !_.isEmpty(
          updateNgoDto.ngo_FCRA_certificate,
        )
          ? updateNgoDto.ngo_FCRA_certificate
          : null;

        query = updateNgoDto;
        const query1 = {
          'ngo_data.ngo_name': updateNgoDto.ngo_name
            ? updateNgoDto.ngo_name
            : existNgo.ngo_name,
          'ngo_data.ngo_location': updateNgoDto.ngo_location
            ? updateNgoDto.ngo_location
            : existNgo.ngo_location,
        };
        await this.userModel
          .updateMany(
            { 'ngo_data._id': existNgo._id, is_deleted: false },
            { $set: query1 },
          )
          .lean();

        if (
          (updateNgoDto.removeFile || updateNgoDto.removeFile === 'true') &&
          !_.isEmpty(existNgo.ngo_cover_image)
        ) {
          // await this.commonService.unlinkFileFunction(
          //   'ngo/'+existNgo._id+'/cover-image',
          //   existNgo.ngo_cover_image,
          // );
          query.ngo_cover_image = null;
        }
        await this.ngoModel.findByIdAndUpdate(ngoId, query).lean();

        return res.json({
          success: true,
          message: mConfig.Ngo_updated_successfully,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-adminNgoUpdate',
      );

      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Edit ngo api
  public async editNgo(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const ngo = await this.commonService.getNGODetailForAdmin(id);
      if (_.isEmpty(ngo)) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        return res.json({
          success: true,
          data: ngo,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-editNgo',
      );

      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for Update NGO
  public async ngoupdate(
    ngoId: string,
    updateNgoDto: any,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        updateNgoDto,
      );
      const existNgo: any = await this.ngo.findById(ngoId).lean();
      if (!existNgo) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        if (
          updateNgoDto.otp &&
          !_.isEmpty(updateNgoDto.otp) &&
          updateNgoDto.otp_platform &&
          !_.isEmpty(updateNgoDto.otp_platform)
        ) {
          const verifyData = {
            phone: updateNgoDto.ngo_phone,
            phone_code: updateNgoDto.ngo_phone_code,
            otp_platform: updateNgoDto.otp_platform,
            otp: updateNgoDto.otp,
          };
          //verify otp
          const verifyOtp = await this.commonService.verifyOtp(verifyData);
          if (verifyOtp['success'] == false || verifyOtp['success'] == true) {
            return res.json(verifyOtp);
          }
        }
        //Move uploaded images to particular folder
        if (!_.isEmpty(updateNgoDto.ngo_cover_image)) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_cover_image,
            'ngo/' + ngoId + '/cover-image',
          );
        }
        if (!_.isEmpty(updateNgoDto.ngo_deed)) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_deed,
            'ngo/' + ngoId + '/deed',
          );
        }
        if (!_.isEmpty(updateNgoDto.ngo_certificate)) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_certificate,
            'ngo/' + ngoId + '/certificate',
          );
        }
        if (
          updateNgoDto?.upload_12A_80G_certificate &&
          !_.isEmpty(updateNgoDto?.ngo_12A_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_12A_certificate,
            'ngo/' + ngoId + '/ngo-12A-certificate',
          );
        }

        if (
          updateNgoDto?.upload_12A_80G_certificate &&
          !_.isEmpty(updateNgoDto?.ngo_80G_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_80G_certificate,
            'ngo/' + ngoId + '/ngo-80G-certificate',
          );
        }

        if (
          updateNgoDto.upload_FCRA_certificate &&
          !_.isEmpty(updateNgoDto?.ngo_FCRA_certificate)
        ) {
          await this.commonService.uploadFileOnS3(
            updateNgoDto.ngo_FCRA_certificate,
            'ngo/' + ngoId + '/ngo-FCRA-certificate',
          );
        }

        if (
          !_.isEmpty(updateNgoDto.ngo_deed) ||
          !_.isEmpty(updateNgoDto.ngo_certificate) ||
          !_.isEmpty(updateNgoDto.expiry_date)
        ) {
          let certificateData: any = {};
          if (
            !_.isEmpty(updateNgoDto.expiry_date) &&
            moment(existNgo.expiry_date).format('YYYY/MM/DD') !=
              moment(updateNgoDto.expiry_date).format('YYYY/MM/DD')
          ) {
            certificateData.expiry_date = updateNgoDto.expiry_date;
          }
          if (
            !_.isEmpty(updateNgoDto.ngo_deed) &&
            existNgo.ngo_deed != updateNgoDto.ngo_deed
          ) {
            certificateData.ngo_deed = updateNgoDto.ngo_deed;
          }
          if (
            !_.isEmpty(updateNgoDto.ngo_certificate) &&
            existNgo.ngo_certificate != updateNgoDto.ngo_certificate
          ) {
            certificateData.ngo_certificate = updateNgoDto.ngo_certificate;
          }
          if (!_.isEmpty(certificateData)) {
            certificateData.ngo_id = ngoId;
            const createCertificate = new this.ngoCertificateModel(
              certificateData,
            );
            createCertificate.save();
          }
        }

        if (
          !_.isEmpty(updateNgoDto.city) &&
          !_.isUndefined(updateNgoDto.longitude) &&
          !_.isUndefined(updateNgoDto.latitude)
        ) {
          const latitude = Number(updateNgoDto.latitude);
          const longitude = Number(updateNgoDto.longitude);
          //get tmezone name
          const timezonesName = await this.commonService.getTimezoneFromLatLon(
            latitude,
            longitude,
          );
          updateNgoDto['ngo_location'] = {
            type: 'Point',
            coordinates: [longitude, latitude],
            city: updateNgoDto.city,
          };
          updateNgoDto['time_zone'] = timezonesName;

          if (!_.isUndefined(updateNgoDto.country_name)) {
            const countryData = await this.commonService.getCountry(
              updateNgoDto.country_name,
            );
            updateNgoDto['country_data'] = countryData;
          }
        }
        let query: any = {};
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_Owner_has_changed_ngo_profile,
          { '{{ngo}}': existNgo.ngo_name },
        );
        if (existNgo.ngo_status !== 'pending') {
          if (existNgo.ngo_status !== 'blocked') {
            query = {
              ngo_status: 'waiting_for_verify',
              is_enable: false,
            };
          }

          updateNgoDto.ngo_cover_image = updateNgoDto.ngo_cover_image
            ? updateNgoDto.ngo_cover_image
            : updateNgoDto.removeFile || updateNgoDto.removeFile === 'true'
            ? null
            : existNgo.ngo_cover_image;
          updateNgoDto.ngo_deed = updateNgoDto.ngo_deed
            ? updateNgoDto.ngo_deed
            : existNgo.ngo_deed;
          updateNgoDto.ngo_certificate = updateNgoDto.ngo_certificate
            ? updateNgoDto.ngo_certificate
            : existNgo.ngo_certificate;

          await this.addNgoUpdatedData(existNgo, updateNgoDto);

          //send notification to ngo owner
          const input1 = {
            message: mConfig.noti_msg_ngo_under_verify,
            title: mConfig.noti_title_ngo_verify,
            type: 'ngo',
            ngoId: ngoId,
            userId: this.request.user._id,
          };
          this.commonService.notification(input1);
        } else {
          query = updateNgoDto;
          const query1 = {
            'ngo_data.ngo_name': updateNgoDto.ngo_name
              ? updateNgoDto.ngo_name
              : existNgo.ngo_name,
            'ngo_data.ngo_location': updateNgoDto.ngo_location
              ? updateNgoDto.ngo_location
              : existNgo.ngo_location,
          };
          await this.userModel
            .updateMany(
              { 'ngo_data._id': existNgo._id, is_deleted: false },
              { $set: query1 },
            )
            .lean();
        }
        if (
          (updateNgoDto.removeFile || updateNgoDto.removeFile === 'true') &&
          !_.isEmpty(existNgo.ngo_cover_image)
        ) {
          // await this.commonService.unlinkFileFunction(
          //   'ngo/'+existNgo._id+'/cover-image',
          //   existNgo.ngo_cover_image,
          // );
          query.ngo_cover_image = null;
        }

        await this.ngo.findByIdAndUpdate(ngoId, query).lean();

        const trustee2 = existNgo.trustees_name.filter(function (obj) {
          return obj.is_owner === false;
        })[0];
        if (!_.isEmpty(trustee2)) {
          const input: any = {
            message: msg,
            title: mConfig.noti_title_NGO_Profile_Update,
            type: 'ngo',
            ngoId: ngoId,
            userId: trustee2._id,
          };
          this.commonService.notification(input);
        }

        //send notification to admin
        const input1: any = {
          message: msg,
          title: mConfig.noti_title_NGO_Profile_Update,
          type: 'ngo',
          ngoId: ngoId,
        };
        this.commonService.sendAdminNotification(input1);

        return res.json({
          success: true,
          message: mConfig.Ngo_profile_updated,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-ngoupdate',
      );

      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get user detail by email and number
  public async userByMailPhone(
    getUserByMailDto: GetUserByMailDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
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
        is_ngo: { $ne: true },
      };

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
              country_data: 1,
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
        'src/controller/ngo/ngo.service.ts-userByMailPhone',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for add trustee in NGO
  public async addTrustees(
    ngoId: string,
    addTrusteesDto: AddTrusteesDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        addTrusteesDto,
      );

      if (
        addTrusteesDto.otp &&
        addTrusteesDto.otp_platform &&
        !_.isEmpty(addTrusteesDto.otp) &&
        !_.isEmpty(addTrusteesDto.otp_platform)
      ) {
        //Common function for otp verification
        const verifyOTP = await this.commonService.verifyOtp(addTrusteesDto);
        if (verifyOTP['success'] == false || verifyOTP['success'] == true) {
          return res.json(verifyOTP);
        }
      }

      const findNGO: any = await this.ngo
        .findOne({ _id: ObjectID(ngoId) })
        .lean();
      if (findNGO) {
        let trusteesLength: any = findNGO.trustees_name.length;
        if (findNGO.ngo_status !== 'pending') {
          const findUpdatedNgo = await this.ngoUpdatedModel
            .findOne({ ngo_id: findNGO._id }, { _id: 1, trustees_name: 1 })
            .sort({ _id: -1 })
            .lean();
          if (findUpdatedNgo && !_.isUndefined(findUpdatedNgo)) {
            trusteesLength = findUpdatedNgo?.trustees_name?.length;
          }
        }
        if (trusteesLength < 2) {
          let findUser = await this.userModel
            .findOne({
              phone_code: addTrusteesDto.phone_code,
              phone: addTrusteesDto.phone,
              is_deleted: false,
            })
            .select({
              _id: 1,
              phone_country_short_name: 1,
              first_name: 1,
              last_name: 1,
              phone: 1,
              phone_code: 1,
              email: 1,
              country_data: 1,
            })
            .exec();

          const country = findNGO?.country_data?.country;

          const countryData = await this.commonService.getCountry(country);

          if (!findUser) {
            const timezonesName =
              await this.commonService.getTimezoneFromLatLon(
                findNGO?.ngo_address?.coordinates[1],
                findNGO?.ngo_address?.coordinates[0],
              );

            const dtl = {
              is_donor: true,
              phone_code: addTrusteesDto.phone_code,
              phone: addTrusteesDto.phone,
              email: addTrusteesDto.email,
              first_name: addTrusteesDto.first_name,
              last_name: addTrusteesDto.last_name,
              phone_country_full_name: addTrusteesDto.phone_country_full_name,
              phone_country_short_name: addTrusteesDto.phone_country_short_name,
              display_name: addTrusteesDto.first_name,
              location: findNGO?.ngo_address,
              country_data: countryData ? countryData : null,
              default_country: addTrusteesDto.country_name,
              time_zone: timezonesName,
            };
            const createUser = new this.userModel(dtl);
            findUser = await createUser.save();
          }

          const detail: any = {
            _id: findUser._id,
            first_name: findUser.first_name,
            last_name: findUser.last_name,
            email: findUser.email,
            phone_code: findUser.phone_code,
            phone: findUser.phone,
            country_code: countryData ? countryData.country_code : null,
            flag: flag(findUser.phone_country_short_name),
            verified: false,
            is_owner: false,
            added_time: new Date(),
          };

          let query = {};
          if (findNGO.ngo_status !== 'pending') {
            query = {
              ngo_status: 'waiting_for_verify',
              is_enable: false,
            };

            const query1 = {
              $push: { trustees_name: detail },
            };
            await this.saveNgoUpdatedData(findNGO, query1);

            //send notification to ngo owner
            const input1 = {
              message: mConfig.noti_msg_ngo_under_verify,
              title: mConfig.noti_title_ngo_verify,
              type: 'ngo',
              ngoId: ngoId,
              userId: this.request.user._id,
            };
            this.commonService.notification(input1);
          } else {
            const msg = await this.commonService.changeString(
              mConfig.noti_msg_has_added_new_trustee_in_NGO,
              { '{{ngo}}': findNGO?.form_data?.ngo_name },
            );
            const input: any = {
              title: mConfig.noti_title_New_trustee_add,
              type: 'ngo',
              ngoId: ngoId,
              message: msg,
            };
            query = { $push: { trustees_name: detail } };
            //send notification to admin
            this.commonService.sendAdminNotification(input);
          }
          await this.ngo.updateOne({ _id: ObjectID(ngoId) }, query).lean();

          //send notification to trustee2
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_You_are_added_as_a_trustee_in_NGO,
            { '{{ngo}}': findNGO?.form_data?.ngo_name },
          );
          const input2 = {
            message: msg,
            title: mConfig.noti_title_NGO_added_you_as_a_trustee,
            type: 'ngo',
            ngoId: ngoId,
            userId: findUser._id,
            additionalData: { verified: false },
          };
          this.commonService.notification(input2);
        }

        return res.json({
          success: true,
          message: mConfig.Trustee_added,
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
        'src/controller/ngo/ngo.service.ts-addTrustees',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for remove trustee and add remove documents
  public async removeTrustees(
    ngoId: string,
    removeTrusteeDto: RemoveTrusteeDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'delete',
        removeTrusteeDto,
      );
      const findNGO: any = await this.ngo.findOne({ _id: ngoId }).lean();
      let idMatched: any = '';
      if (findNGO) {
        let trusteesName: any = findNGO.trustees_name;
        if (findNGO.ngo_status === 'waiting_for_verify') {
          const ngoUpdatedData = await this.ngoUpdatedModel
            .findOne({ ngo_id: findNGO._id })
            .select({ _id: 1, trustees_name: 1 })
            .sort({ _id: -1 })
            .lean();
          trusteesName = ngoUpdatedData.trustees_name;
        }
        if (!_.isEmpty(trusteesName)) {
          idMatched = trusteesName.find(
            (i: any) => i._id == removeTrusteeDto._id,
          );
        }
        if (idMatched && !_.isEmpty(idMatched) && !_.isUndefined(idMatched)) {
          const input: any = {
            title: mConfig.noti_title_Remove_trustee_from_NGO,
            type: 'ngo',
            ngoId: ngoId,
          };

          const input1 = {
            message: mConfig.noti_msg_NGO_owner_has_removed_you,
            title: mConfig.noti_title_ngo_remove_trustee,
            type: 'ngo',
            ngoId: ngoId,
            userId: removeTrusteeDto._id,
          };

          //add documents in remove_doc and remove it from trustee array
          const addData: any = {
            _id: idMatched._id,
            first_name: idMatched.first_name,
            last_name: idMatched.last_name,
            email: idMatched.email,
            phone_code: idMatched.phone_code,
            phone: idMatched.phone,
            country_code: idMatched.country_code,
            documents: removeTrusteeDto?.documents,
            verified: idMatched.verified,
            added_time: idMatched.added_time,
            removed_time: new Date(),
          };
          let query = {};
          if (findNGO.ngo_status !== 'pending') {
            const msg = await this.commonService.changeString(
              mConfig.noti_msg_owner_wants_to_remove_trustee,
              { '{{ngo}}': findNGO?.form_data?.ngo_name },
            );
            input.message = msg;
            query = {
              ngo_status: 'waiting_for_verify',
              is_enable: false,
            };

            let query1;
            if (idMatched.verified) {
              query1 = {
                $push: { removed_trustee: addData },
                new_removed_trustee: addData,
                $pull: {
                  trustees_name: { _id: ObjectID(removeTrusteeDto._id) },
                },
              };
            } else {
              query1 = {
                new_removed_trustee: addData,
                $pull: {
                  trustees_name: { _id: ObjectID(removeTrusteeDto._id) },
                },
              };
            }
            await this.saveNgoUpdatedData(findNGO, query1);
            // this.commonService.notification(input1, true);

            //send notification to ngo owner
            const input2 = {
              message: mConfig.noti_msg_ngo_under_verify,
              title: mConfig.noti_title_ngo_verify,
              type: 'ngo',
              ngoId: ngoId,
              userId: this.request.user._id,
            };
            this.commonService.notification(input2);
          } else {
            const msg1 = await this.commonService.changeString(
              mConfig.noti_msg_owner_has_removed_trustee,
              { '{{ngo}}': findNGO?.form_data?.ngo_name },
            );
            input.message = msg1;

            if (idMatched.verified) {
              query = {
                $push: { removed_trustee: addData },
                $pull: {
                  trustees_name: { _id: ObjectID(removeTrusteeDto._id) },
                },
              };
            } else {
              query = {
                $pull: {
                  trustees_name: { _id: ObjectID(removeTrusteeDto._id) },
                },
              };
            }

            await this.userModel
              .findByIdAndUpdate(
                { _id: idMatched._id },
                { $unset: { is_ngo: 1, ngo_data: 1, ngo_id: 1 } },
              )
              .lean();
          }

          await this.notificationModel
            .findOneAndUpdate(
              {
                ngo_id: findNGO._id.toString(),
                user_id: ObjectID(removeTrusteeDto._id),
                'additional_data.verified': false,
              },
              { 'additional_data.verified': true },
            )
            .lean();
          await this.ngo
            .findByIdAndUpdate({ _id: ngoId }, query, {
              new: true,
            })
            .lean();

          if (
            removeTrusteeDto.documents &&
            !_.isEmpty(removeTrusteeDto.documents)
          ) {
            this.commonService.moveImage(
              removeTrusteeDto.documents,
              'ngo/' + ngoId + '/remove-trustee',
            );
          }

          //send notification to trustee
          this.commonService.notification(input1);

          //send notification to admin
          this.commonService.sendAdminNotification(input);
          return res.json({
            success: true,
            message: mConfig.Trustee_removed,
          });
        } else {
          return res.json({
            success: false,
            message: mConfig.Trustee_not_found,
          });
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.Ngo_not_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-removeTrustees',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for transfer trustee ownership
  public async transferOwnership(
    ngoId: string,
    transferOwnershipDto: TransferOwnershipDto,
    res: any,
  ): Promise<User> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        transferOwnershipDto,
      );
      const findNGO: any = await this.ngo.findById(ngoId).lean();
      if (!findNGO) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        if (findNGO.trustees_name && findNGO.trustees_name.length < 2) {
          return res.json({
            message: mConfig.NGO_cant_transfer_ownership,
            success: false,
          });
        } else {
          //Move uploaded images to particular folder
          if (!_.isEmpty(transferOwnershipDto.transfer_documents)) {
            this.commonService.moveImage(
              transferOwnershipDto.transfer_documents,
              'transfer-ownership',
            );
          }
          let updatedData: any = {
            transfer_documents: transferOwnershipDto.transfer_documents,
            transfer_reason: transferOwnershipDto.transfer_reason,
            transfer_account: true,
          };
          if (findNGO.ngo_status !== 'pending') {
            await this.saveNgoUpdatedData(findNGO, updatedData);

            updatedData = {
              ngo_status: 'waiting_for_verify',
              is_enable: false,
            };

            //send notification to ngo owner
            const input1 = {
              message: mConfig.noti_msg_ngo_under_verify,
              title: mConfig.noti_title_ngo_verify,
              type: 'ngo',
              ngoId: ngoId,
              userId: this.request.user._id,
            };
            this.commonService.notification(input1);
          }
          await this.ngo
            .findByIdAndUpdate({ _id: findNGO._id }, updatedData)
            .lean();
          // send notification to admin
          const msg = await this.commonService.changeString(
            mConfig.ngo_msg_owner_wants_to_transfer_his_ownership,
            { '{{ngo}}': findNGO?.form_data?.ngo_name },
          );
          const input: any = {
            message: msg,
            title: mConfig.noti_title_Transfer_Ownership,
            type: 'ngo',
            ngoId: ngoId,
          };
          this.commonService.sendAdminNotification(input);

          return res.json({
            success: true,
            message: mConfig.Request_has_been_sent,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-transferOwnership',
      );

      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api For NGO List
  public async getNgoList(param, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
      let deleted = false;

      const match = {};
      let query = [];
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.deleted) && filter.deleted == 1) {
          deleted = true;
        }

        if (!_.isUndefined(filter.ngo_name) && filter.ngo_name) {
          const query = await this.commonService.filter(
            operator,
            filter.ngo_name,
            'ngo_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.ngo_phone) && filter.ngo_phone) {
          const query = await this.commonService.filter(
            operator,
            filter.ngo_phone,
            'ngo_phone',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.secondary_phone) && filter.secondary_phone) {
          const query = await this.commonService.filter(
            operator,
            filter.secondary_phone,
            'secondary_phone',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.ngo_registration_number) &&
          filter.ngo_registration_number
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.ngo_registration_number,
            'ngo_registration_number',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.ngo_causes) && filter.ngo_causes) {
          const query = await this.commonService.filter(
            operator,
            filter.ngo_causes,
            'ngo_causes',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.ngo_location) && filter.ngo_location) {
          const query = await this.commonService.filter(
            operator,
            filter.ngo_location,
            'ngo_location.city',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.is_enable) && filter.is_enable) {
          const query = await this.commonService.filter(
            'boolean',
            filter.is_enable,
            'is_enable',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.upload_FCRA_certificate) &&
          filter.upload_FCRA_certificate
        ) {
          const query = await this.commonService.filter(
            'boolean',
            filter.upload_FCRA_certificate,
            'upload_FCRA_certificate',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.upload_12A_80G_certificate) &&
          filter.upload_12A_80G_certificate
        ) {
          const query = await this.commonService.filter(
            'boolean',
            filter.upload_12A_80G_certificate,
            'upload_12A_80G_certificate',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.ngo_status) && filter.ngo_status) {
          const query = await this.commonService.filter(
            operator,
            filter.ngo_status,
            'ngo_status',
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
        if (!_.isUndefined(filter.deletedAt) && filter.deletedAt) {
          const query = await this.commonService.filter(
            'date',
            filter.deletedAt,
            'deletedAt',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'ngo_name',
            'ngo_phone',
            'secondary_phone',
            'ngo_registration_number',
            'ngo_causes',
            'ngo_location.city',
            'ngo_status',
            'deletedAt',
            'updatedAt',
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
      match['is_deleted'] = deleted;
      const sortData = {
        _id: '_id',
        ngo_name: 'ngo_name',
        ngo_phone: 'ngo_phone',
        secondary_phone: 'secondary_phone',
        ngo_registration_number: 'ngo_registration_number',
        ngo_causes: 'ngo_causes',
        ngo_location: 'ngo_location.city',
        is_enable: 'is_enable',
        createdAt: 'createdAt',
        ngo_status: 'ngo_status',
        deletedAt: 'deletedAt',
        upload_FCRA_certificate: 'upload_FCRA_certificate',
        upload_12A_80G_certificate: 'upload_12A_80G_certificate',
      };

      const addFields = {
        $addFields: {
          ngo_phone: {
            $concat: [
              '$form_data.ngo_mobile_number.countryCodeD',
              ' ',
              '$form_data.ngo_mobile_number.phoneNumber',
            ],
          },
          secondary_phone: {
            $cond: {
              if: {
                $ne: ['$form_data.secondary_mobile_number.phoneNumber', ''],
              },
              then: {
                $concat: [
                  '$form_data.secondary_mobile_number.countryCodeD',
                  ' ',
                  '$form_data.secondary_mobile_number.phoneNumber',
                ],
              },
              else: '',
            },
          },
        },
      };

      const total = await this.ngo
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

      const result = await this.ngo.aggregate(
        [
          addFields,
          {
            $project: {
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
              ngo_registration_number:
                '$form_data.registration_certificate_number',
              ngo_name: '$form_data.ngo_name',
              first_name: '$form_data.first_name',
              last_name: '$form_data.last_name',
              ngo_causes: 1,
              ngo_location: '$ngo_address',
              ngo_phone: 1,
              is_deleted: 1,
              secondary_phone: 1,
              createdAt: 1,
              deletedAt: 1,
              is_enable: 1,
              ngo_status: 1,
              phone_country_short_name:
                '$form_data.ngo_mobile_number.short_name',
              secondary_country_short_name:
                '$form_data.secondary_mobile_number.short_name',
              delete_account_reason: 1,
              upload_FCRA_certificate: '$form_data.fcra_certificates',
              upload_12A_80G_certificate: '$form_data._12a_or_80g_certificates',
              country_data: 1,
            },
          },
          {
            $match: match,
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
        'src/controller/ngo/ngo.service.ts-getNgoList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for get NGO profile details
  public async getNgoDetails(id: string, res: any): Promise<Ngo> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', {
        id,
      });
      const userData = this.request.user;
      const ngo = await this.commonService.getNGODetailForApp(id, userData._id);
      if (_.isEmpty(ngo)) {
        return res.json({
          success: false,
          message: mConfig.Ngo_not_found,
        });
      } else {
        const query = {
          category_slug: { $ne: 'hunger' },
          active_type: 'ngo',
          user_ngo_id: ObjectID(id),
          status: { $ne: 'draft' },
          is_deleted: { $ne: true },
        };
        const fundraiser = await this.requestModel.count(query).lean();
        query['form_data.request_for_self'] = true;
        const myFundraiser = await this.requestModel.count(query).lean();

        const query2 = {
          category_slug: 'hunger',
          donor_ngo_id: ObjectID(id),
          is_deleted: { $ne: true },
        };
        const foodDonated = await this.requestModel.count(query2).lean();

        const query3 = {
          transaction_type: 'ngo-donation',
          user_id: ObjectID(id),
          saayam_community: { $ne: true },
          is_user_ngo: true,
        };
        const totalDonation = await this.transactionModel.count(query3).lean();
        ngo.totalDonation = totalDonation;
        ngo.my_fundraiser = myFundraiser;
        ngo.fundraiser = fundraiser;
        ngo.food_donated = foodDonated;
        return res.json({
          success: true,
          data: ngo,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-getNgoDetails',
        id,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get NGO profile details
  public async getNgoData(id: string, res: any): Promise<Ngo> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', {
        id,
      });
      const ngo = await this.commonService.getNGODetailForAdmin(id);
      if (_.isEmpty(ngo)) {
        return res.json({
          success: false,
          message: mConfig.Ngo_not_found,
        });
      } else {
        const bankData: any = await this.bankModel.findOne(
          { ngo_id: ObjectID(id) },
          { form_data: 1, ngo_id: 1, user_id: 1, selected_for_ngo_donation: 1 },
        );
        if (!_.isEmpty(bankData)) {
          const file = bankData.form_data.files.photos;

          if (file && file.length > 0) {
            for (let i = 0; i < file.length; i++) {
              const photo = file[i];
              bankData.form_data.files.photos[i] =
                authConfig.imageUrl + 'bank-doc/' + photo;
            }
          }
        }
        ngo.bank_detail = bankData;

        return res.json({
          success: true,
          data: ngo,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-getNgoData',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for verify NGO by admin
  public async ngoVerify(
    ngoId: string,
    verifyNgoDto: VerifyNgoDto,
    res: any,
  ): Promise<Ngo> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        verifyNgoDto,
      );
      const ngo = await this.commonService.getNGODetail(ngoId);
      if (!_.isEmpty(ngo)) {
        let updateData: any = {};
        let unsetData: any = {};
        let findUpdatedData: any = {};
        const input: any = {
          type: 'ngo',
          ngoId: ngo._id,
        };

        if (verifyNgoDto.ngo_status === 'approve') {
          if (ngo.ngo_status === 'waiting_for_verify') {
            findUpdatedData = await this.ngoUpdatedModel
              .findOne({
                ngo_id: ngo._id,
              })
              .sort({ _id: -1 });
            //This is done if ngo has added new trutee means if trustee2 is different in both tbl & status waiting

            if (!_.isEmpty(findUpdatedData)) {
              delete findUpdatedData._id;
              delete findUpdatedData.ngo_id;
              updateData = {
                trustees_name: findUpdatedData.trustees_name,
                ngo_registration_number:
                  findUpdatedData.ngo_registration_number,
                last_name: findUpdatedData.last_name,
                first_name: findUpdatedData.first_name,
                ngo_name: findUpdatedData.ngo_name,
                ngo_causes: findUpdatedData.ngo_causes,
                website_link: findUpdatedData.website_link,
                expiry_date: findUpdatedData.expiry_date,
                ngo_email: findUpdatedData.ngo_email,
                ngo_location: findUpdatedData.ngo_location,
                secondary_phone: findUpdatedData.secondary_phone,
                secondary_phone_code: findUpdatedData.secondary_phone_code,
                ngo_phone: findUpdatedData.ngo_phone,
                ngo_phone_code: findUpdatedData.ngo_phone_code,
                upload_12A_80G_certificate:
                  findUpdatedData.upload_12A_80G_certificate,
                upload_FCRA_certificate:
                  findUpdatedData.upload_FCRA_certificate,
                ngo_12A_certificate: findUpdatedData.ngo_12A_certificate,
                ngo_80G_certificate: findUpdatedData.ngo_80G_certificate,
                ngo_FCRA_certificate: findUpdatedData.ngo_FCRA_certificate,
                ngo_certificate: findUpdatedData.ngo_certificate,
                ngo_cover_image: findUpdatedData.ngo_cover_image,
                ngo_deed: findUpdatedData.ngo_deed,
                removed_trustee: findUpdatedData.removed_trustee,
                about_us: findUpdatedData.about_us,
              };
            }
          }
          updateData.ngo_status = verifyNgoDto.ngo_status;
          updateData.approve_time = new Date();
          updateData.is_enable = true;
          input.message = mConfig.noti_msg_ngo_approved;
          input.title = mConfig.noti_title_ngo_approved;
        } else if (verifyNgoDto.ngo_status === 'reject') {
          if (ngo.ngo_status === 'waiting_for_verify') {
            await this.ngoUpdatedModel.deleteOne({ ngo_id: ngo._id }).lean();
            await this.notificationModel
              .updateMany(
                { ngo_id: ngo._id.toString() },
                { 'additional_data.verified': true },
              )
              .lean();
            // send notification to added new trustee
          }
          updateData = {
            ngo_status: verifyNgoDto.ngo_status,
            reject_reason: verifyNgoDto.reject_reason,
            reject_time: new Date(),
            is_enable: false,
          };

          const ngoData = {
            _id: ngo._id,
            ngo_name: ngo.ngo_name,
            ngo_causes: ngo.ngo_causes,
            ngo_status: verifyNgoDto.ngo_status,
            ngo_location: ngo.ngo_location,
          };
          await this.userModel
            .updateMany(
              { 'ngo_data._id': ngo._id, is_deleted: false },
              { ngo_data: ngoData },
            )
            .lean();
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_reason,
            { '{{reason}}': verifyNgoDto.reject_reason },
          );

          input.message = msg;
          input.title = mConfig.noti_title_ngo_rejected;
        } else {
          updateData = {
            ngo_status: verifyNgoDto.ngo_status,
            reverify_time: new Date(),
            is_enable: false,
          };
          input.message = mConfig.noti_msg_NGO_is_under_verification;
        }

        if (
          verifyNgoDto.ngo_status === 'approve' ||
          verifyNgoDto.ngo_status === 'reject'
        ) {
          await this.ngoCertificateModel
            .updateMany(
              { ngo_id: ngo._id.toString(), status: 'pending' },
              { status: verifyNgoDto.ngo_status },
            )
            .lean();
        }

        if (!_.isEmpty(findUpdatedData)) {
          //only apply when status approve
          const updatedDate = moment(findUpdatedData.expiry_date).format(
            'YYYY-MM-DD',
          );
          const oldDate = moment(ngo.expiry_date).format('YYYY-MM-DD');
          if (ngo.is_expired && !moment(updatedDate).isSame(oldDate)) {
            unsetData = { is_expired: 1 };
          }
        }

        if (ngo.ngo_status == 'blocked') {
          unsetData = {
            report_ngo: 1,
            block_reason: 1,
            block_type: 1,
          };

          const ubnlockMsg = await this.commonService.changeString(
            mConfig.noti_msg_unblocked_ngo,
            {
              '{{ngo_name}}': ngo.ngo_name,
            },
          );
          input.title = mConfig.noti_title_unblock_ngo;
          input.message = ubnlockMsg;
        }

        const query = {
          $set: {
            'ngo_data.ngo_status': verifyNgoDto.ngo_status,
          },
        };

        await this.userModel
          .updateMany({ 'ngo_data._id': ngo._id }, query)
          .lean();

        const result: any = await this.ngo
          .findByIdAndUpdate(
            { _id: ObjectID(ngoId) },
            { $set: updateData, $unset: unsetData },
            {
              new: true,
            },
          )
          .lean();

        if (
          (ngo.ngo_status === 'pending' ||
            ngo.ngo_status === 'waiting_for_verify') &&
          verifyNgoDto.ngo_status === 'approve'
        ) {
          result.trustees_name.map(async (item: any) => {
            const ngoData = {
              _id: result._id,
              ngo_name: findUpdatedData.ngo_name
                ? findUpdatedData.ngo_name
                : result.ngo_name,
              ngo_causes: findUpdatedData.ngo_causes
                ? findUpdatedData.ngo_causes
                : result.ngo_causes,
              ngo_status: verifyNgoDto.ngo_status,
              ngo_location: findUpdatedData.ngo_location
                ? findUpdatedData.ngo_location
                : result.ngo_location,
            };
            const query = {
              is_ngo: true,
              ngo_data: ngoData,
              ngo_id: ObjectID(result._id),
            };
            await this.userModel
              .findByIdAndUpdate({ _id: item._id }, query)
              .lean();
          });

          if (
            !_.isUndefined(findUpdatedData?.new_removed_trustee) &&
            findUpdatedData?.new_removed_trustee
          ) {
            const input1 = {
              message: mConfig.noti_msg_NGO_owner_has_removed_you,
              title: mConfig.noti_title_ngo_remove_trustee,
              type: 'ngo',
              ngoId: findUpdatedData.ngo_id,
              userId: findUpdatedData.new_removed_trustee._id,
            };
            this.commonService.notification(input1);

            await this.userModel
              .findByIdAndUpdate(
                { _id: findUpdatedData.new_removed_trustee._id },
                { $unset: { is_ngo: 1, ngo_data: 1, ngo_id: 1 } },
              )
              .lean();
          }
          //set owner in user model
          // const updatedData: any = await this.ngoUpdatedModel.findOne({
          //   ngo_id: ngo._id,
          // });

          //find transfer account true
          if (
            (findUpdatedData &&
              findUpdatedData.transfer_account &&
              findUpdatedData.trustees_name.length === 2) ||
            (ngo.transfer_account && ngo.trustees_name.length === 2)
          ) {
            let trusty1 = false;
            let trusty2 = true;
            if (
              (findUpdatedData?.transfer_account &&
                findUpdatedData?.trustees_name[0]?.is_owner == false) ||
              (ngo?.transfer_account &&
                ngo?.trustees_name[0]?.is_owner == false)
            ) {
              trusty1 = true;
              trusty2 = false;
            }
            const ngoNewData: any = await this.ngo
              .findByIdAndUpdate(
                { _id: ngo._id },
                {
                  $set: {
                    'trustees_name.0.is_owner': trusty1,
                    'trustees_name.1.is_owner': trusty2,
                  },
                  $unset: {
                    transfer_account: 1,
                    transfer_documents: 1,
                    transfer_reason: 1,
                  },
                },
                { new: true },
              )
              .lean();

            const findOwner = ngoNewData.trustees_name.filter(function (obj) {
              return obj.is_owner === true;
            })[0];

            const change = {
              is_volunteer: true,
              is_donor: true,
              is_user: true,
            };
            await this.userModel.updateOne(
              { _id: ObjectID(findOwner._id) },
              change,
            );

            input.title = mConfig.noti_title_transfer_ngo_ownership;
            let trusty_msg = 'Your NGO approved by admin.';
            let owner_msg = 'Your NGO approved by admin.';
            let owner_id = '';
            let trusty_id = '';
            if (ngoNewData?.trustees_name[0]?.is_owner == false) {
              //0 index trusty

              trusty_msg = await this.commonService.changeString(
                mConfig.noti_msg_transfer_ownership_trusty_msg,
                {
                  '{{owner_name}}': ngoNewData?.trustees_name[1]?.first_name,
                },
              );

              owner_msg = await this.commonService.changeString(
                mConfig.noti_msg_transfer_ownership_owner_msg,
                {
                  '{{trusty_name}}': ngoNewData?.trustees_name[0]?.first_name,
                },
              );

              owner_id = ngoNewData?.trustees_name[1]?._id;
              trusty_id = ngoNewData?.trustees_name[0]?._id;
            } else if (ngoNewData?.trustees_name[0]?.is_owner == true) {
              //1 index trusty

              trusty_msg = await this.commonService.changeString(
                mConfig.noti_msg_transfer_ownership_trusty_msg,
                {
                  '{{owner_name}}': ngoNewData?.trustees_name[0]?.first_name,
                },
              );

              owner_msg = await this.commonService.changeString(
                mConfig.noti_msg_transfer_ownership_owner_msg,
                {
                  '{{trusty_name}}': ngoNewData?.trustees_name[1]?.first_name,
                },
              );

              owner_id = ngoNewData?.trustees_name[0]?._id; //owner_msg
              trusty_id = ngoNewData?.trustees_name[1]?._id; //trusty_msg
            }
            //send notification to trusty
            input.userId = trusty_id;
            input.message = trusty_msg;
            await this.commonService.notification(input, false);

            //send notification to owner
            input.userId = owner_id;
            input.message = owner_msg;
            await this.commonService.notification(input, false);
          }
          await this.ngoUpdatedModel.deleteOne({ ngo_id: ngo._id }).lean();
        }

        if (!findUpdatedData.transfer_account && !ngo.transfer_account) {
          //send notification to user
          const ids = result.trustees_name.map((item) => {
            return item._id;
          });
          this.commonService.sendAllNotification(ids, input);
        }

        const status =
          verifyNgoDto.ngo_status === 'approve'
            ? 'approved'
            : verifyNgoDto.ngo_status === 'reject'
            ? 'rejected'
            : verifyNgoDto.ngo_status;
        //Add Activity Log
        const logData = {
          action: 'verify',
          ngo_id: ngo._id,
          entity_name: `Verify NGO`,
          description: `NGO has been ${status} - ${result.ngo_name}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          data: result,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.Ngo_not_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-ngoVerify',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for verify trustee by app side
  public async verifyTrustee(
    ngoId: string,
    verifyNgoDto: VerifyNgoDto,
    res: any,
  ): Promise<Ngo> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        verifyNgoDto,
      );
      const ngo: any = await this.ngo
        .findById(ngoId)
        .select({
          _id: 1,
          trustees_name: 1,
          ngo_status: 1,
          'form_data.ngo_name': 1,
          ngo_causes: 1,
          ngo_address: 1,
        })
        .lean();
      if (!_.isEmpty(ngo)) {
        const findOwner = ngo.trustees_name.filter(function (obj) {
          return obj.is_owner === true;
        })[0];
        const userName =
          this.request.user.first_name + ' ' + this.request.user.last_name;
        //send notification to owner
        if (verifyNgoDto.ngo_status === 'approve') {
          if (ngo.ngo_status !== 'pending') {
            await this.ngoUpdatedModel
              .findOneAndUpdate(
                { ngo_id: ngo._id, 'trustees_name._id': this.request.user._id },
                { $set: { 'trustees_name.$.verified': true } },
                { sort: { _id: -1 } },
              )
              .lean();

            const msg = await this.commonService.changeString(
              mConfig.noti_msg_has_added_new_trustee_in_NGO,
              { '{{ngo}}': ngo.form_data.ngo_name },
            );

            //send notification to admin
            const input1: any = {
              title: mConfig.noti_title_New_trustee_add,
              message: msg,
              type: 'ngo',
              ngoId: ngo._id,
            };

            this.commonService.sendAdminNotification(input1);
          } else {
            await this.ngo
              .findOneAndUpdate(
                { _id: ngo._id, 'trustees_name._id': this.request.user._id },
                { $set: { 'trustees_name.$.verified': true } },
              )
              .lean();
          }
          const ngoData = {
            _id: ngo._id,
            ngo_name: ngo.form_data.ngo_name,
            ngo_causes: ngo.ngo_causes,
            ngo_status: ngo.ngo_status,
            ngo_address: ngo.ngo_address,
          };
          const query: any = {
            is_ngo: true,
            ngo_id: ObjectID(ngo._id),
            ngo_data: ngoData,
            is_user: true,
            is_donor: true,
            is_volunteer: true,
          };
          await this.userModel
            .findByIdAndUpdate({ _id: this.request.user._id }, query)
            .lean();
        } else if (verifyNgoDto.ngo_status === 'reject') {
          if (ngo.ngo_status !== 'pending') {
            await this.ngoUpdatedModel
              .findOneAndUpdate(
                { ngo_id: ngo._id },
                {
                  $pull: { trustees_name: { _id: this.request.user._id } },
                },
                { sort: { _id: -1 } },
              )
              .lean();
          }
          //remove from trustees
          await this.ngo
            .findByIdAndUpdate(
              { _id: ngo._id },
              {
                $pull: { trustees_name: { _id: this.request.user._id } },
              },
            )
            .lean();
        }

        const updateData = {
          '{{userName}}': userName,
          '{{ngo_status}}':
            verifyNgoDto.ngo_status === 'approve'
              ? 'approved'
              : verifyNgoDto.ngo_status,
        };

        const msg = await this.commonService.changeString(
          mConfig.noti_msg_your_request_for_ngo_trustee,
          updateData,
        );
        const input: any = {
          title: mConfig.noti_title_trustee_verification,
          message: msg,
          type: 'ngo',
          ngoId: ngo._id,
          userId: findOwner._id.toString(),
        };
        await this.notificationModel
          .findOneAndUpdate(
            {
              _id: verifyNgoDto.noti_id,
              'additional_data.verified': false,
            },
            { 'additional_data.verified': true },
          )
          .lean();

        this.commonService.notification(input);

        return res.json({
          success: true,
          message:
            verifyNgoDto.ngo_status === 'approve'
              ? mConfig.You_are_added_as_trustee_in_ngo
              : mConfig.Request_rejected_by_you,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.Ngo_not_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-verifyTrustee',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  /*Function for add data in ngo update table
   * @param existNgo
   * @param query
   * @returns
   */
  public async addNgoUpdatedData(existNgo, query) {
    try {
      const findUpdatedNgo = await this.ngoUpdatedModel
        .findOne({ ngo_id: existNgo._id })
        .select({ ngo_cover_image: 1 })
        .lean();

      if (!findUpdatedNgo) {
        const createUpdatedData = {
          ngo_id: existNgo._id,
          ngo_name: existNgo.ngo_name,
          first_name: existNgo.first_name,
          last_name: existNgo.last_name,
          expiry_date: existNgo.expiry_date,
          website_link: existNgo.website_link,
          phone_country_full_name: existNgo.phone_country_full_name,
          phone_country_short_name: existNgo.phone_country_short_name,
          secondary_country_full_name: existNgo.secondary_country_full_name,
          secondary_country_short_name: existNgo.secondary_country_short_name,
          ngo_location: existNgo.ngo_location,
          ngo_previous_status: existNgo.ngo_status,
          ngo_phone_code: existNgo.ngo_phone_code,
          ngo_email: existNgo.ngo_email,
          ngo_phone: existNgo.ngo_phone,
          display_name: existNgo.display_name,
          secondary_phone_code: existNgo.secondary_phone_code,
          secondary_phone: existNgo.secondary_phone,
          ngo_registration_number: existNgo.ngo_registration_number,
          ngo_causes: existNgo.ngo_causes,
          trustees_name: existNgo.trustees_name,
          upload_12A_80G_certificate: existNgo.upload_12A_80G_certificate,
          upload_FCRA_certificate: existNgo.upload_FCRA_certificate,
          ngo_12A_certificate: existNgo.ngo_12A_certificate,
          ngo_80G_certificate: existNgo.ngo_80G_certificate,
          ngo_FCRA_certificate: existNgo.ngo_FCRA_certificate,
          removed_trustee: existNgo.removed_trustee,
          ngo_cover_image: existNgo.ngo_cover_image,
          ngo_deed: existNgo.ngo_deed,
          ngo_certificate: existNgo.ngo_certificate,
          about_us: existNgo.about_us,
        };

        const createDuplicateNgo = new this.ngoUpdatedModel(createUpdatedData);
        await createDuplicateNgo.save();
      } else {
        if (
          (query.removeFile || query.removeFile === 'true') &&
          !_.isEmpty(findUpdatedNgo.ngo_cover_image)
        ) {
          // await this.commonService.unlinkFileFunction(
          //   'ngo/'+existNgo._id+'/cover-image',
          //   findUpdatedNgo.ngo_cover_image,
          // );
          query.ngo_cover_image = null;
        }
      }
      await this.ngoUpdatedModel
        .updateOne({ ngo_id: existNgo._id }, query)
        .lean();
      await this.userModel
        .updateMany(
          { 'ngo_data._id': existNgo._id, is_deleted: false },
          { $set: { 'ngo_data.ngo_status': 'waiting_for_verify' } },
        )
        .lean();
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-addNgoUpdatedData',
      );
      return error;
    }
  }

  /*Function for add data in ngo update table
   * @param existNgo
   * @param query
   * @returns
   */
  public async saveNgoUpdatedData(existNgo, query) {
    try {
      let data;
      if (existNgo.ngo_status === 'approve') {
        const finalObj = {
          ngo_id: existNgo._id,
          ngo_previous_status: existNgo.ngo_status,
          ngo_causes: existNgo.ngo_causes,
          trustees_name: existNgo.trustees_name,
          removed_trustee: existNgo.removed_trustee,
          ngo_address: existNgo.ngo_address,
          form_settings: existNgo.form_settings,
          form_data: existNgo.form_data,
          form_country_code: existNgo.form_country_code,
          country_data: existNgo.country_data,
        };
        const createDuplicateNgo = new this.ngoUpdatedModel(finalObj);
        data = await createDuplicateNgo.save();
      } else {
        data = await this.ngoUpdatedModel
          .findOne({ ngo_id: existNgo._id })
          .select({ _id: 1 })
          .sort({ _id: -1 })
          .lean();
      }

      await this.ngoUpdatedModel.updateOne({ _id: data._id }, query).lean();
      await this.userModel
        .updateMany(
          { 'ngo_data._id': existNgo._id, is_deleted: false },
          { $set: { 'ngo_data.ngo_status': 'waiting_for_verify' } },
        )
        .lean();
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-saveNgoUpdatedData',
      );
      return error;
    }
  }

  //  Api for favourite/unfavourite NGO
  public async ngoFavourite(id: string, res: any): Promise<Ngo> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'put', {
        id,
      });
      const findFavourite: any = this.request.user;
      if (!findFavourite) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        let msg;

        const query = {
          user_id: findFavourite._id,
          ngo_id: ObjectID(id),
        };
        const data: any = await this.favouriteNgoModel
          .findOne(query)
          .select({ _id: 1 })
          .lean();

        if (data) {
          msg = mConfig.ngo_removed_from_favourites;
          const deleted = await this.favouriteNgoModel
            .findByIdAndDelete(data._id)
            .select({ index: 1 })
            .lean();

          const updateQuery = {
            user_id: findFavourite._id,
            index: {
              $gt: deleted.index,
            },
          };
          const greaterIndex = await this.favouriteNgoModel
            .find(updateQuery)
            .lean();
          if (!_.isEmpty(greaterIndex)) {
            await greaterIndex.map(async (item) => {
              await this.favouriteNgoModel
                .updateOne({ _id: item._id }, { index: item.index - 1 })
                .lean();
            });
          }
        } else {
          msg = mConfig.ngo_added_to_favourites;
          const favouriteNgoCount: any = await this.favouriteNgoModel
            .count({ user_id: findFavourite._id })
            .lean();
          const favouriteData: any = {
            user_id: findFavourite._id,
            ngo_id: ObjectID(id),
            index: 1,
          };
          if (favouriteNgoCount > 0) {
            favouriteData.index = favouriteNgoCount + 1;
          }
          const createFavourite = new this.favouriteNgoModel(favouriteData);
          createFavourite.save();
        }

        return res.json({
          success: true,
          message: msg,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-ngoFavourite',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api favourite/unfavourite NGO list for app
  public async allNgoList(param: any, res: any): Promise<Ngo[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
      let query1 = {};
      if (
        param.favourite &&
        !_.isUndefined(param.favourite) &&
        !_.isEmpty(param.favourite)
      ) {
        query1 = {
          is_bookmark: true,
        };
      }

      const query: any = {
        ngo_status: 'approve',
        is_expired: { $ne: true },
        is_deleted: false,
      };

      if (!_.isEmpty(param) && param.search && !_.isUndefined(param.search)) {
        query['form_data.ngo_name'] = new RegExp(param.search, 'i');
      }

      const total = await this.ngo
        .aggregate([
          { $match: query },
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
                          $eq: ['category_slug', 'ngo'],
                        },
                        {
                          $eq: ['$user_id', ObjectID(param?.user_id)],
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
            $addFields: {
              is_bookmark: {
                $cond: {
                  if: { $gt: ['$bookmarkData', null] },
                  then: true,
                  else: false,
                },
              },
            },
          },
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
        null,
        null,
        null,
      );

      const result = await this.ngo.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: 'favourite-ngo',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ['$user_id', ObjectID(param?.user_id)],
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
                        $eq: ['$user_id', ObjectID(param?.user_id)],
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
            path: '$favouriteData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
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
            ngo_registration_number:
              '$form_data.registration_certificate_number',
            phone_country_short_name: 1,
            ngo_address: 1,
            first_name: '$form_data.first_name',
            last_name: '$form_data.last_name',
            ngo_phone: '$form_data.ngo_mobile_number.phoneNumber',
            ngo_phone_code: '$form_data.ngo_mobile_number.countryCodeD',
            createdAt: 1,
            is_favourite: {
              $cond: {
                if: { $gt: ['$favouriteData', null] },
                then: true,
                else: false,
              },
            },
            is_bookmark: {
              $cond: {
                if: { $gt: ['$bookmarkData', null] },
                then: true,
                else: false,
              },
            },
            index: '$favouriteData.index',
            country_data: 1,
          },
        },
        { $match: query1 },
        { $sort: { is_favourite: -1, index: 1, ngo_name: 1 } },
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
        'src/controller/ngo/ngo.service.ts-allNgoList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api favourite NGO list for app
  public async findFavouriteNGO(param: any, res: any): Promise<Ngo[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );

      const userData = this.request.user;

      let user_id = param.user_id;
      let userCurrency;
      let countryData;
      if (!_.isUndefined(userData) && !_.isEmpty(userData)) {
        user_id = userData?._id.toString();
        userCurrency = userData.country_data?.currency[0].name;
        countryData = userData.country_data;
      }

      if (user_id && !_.isEmpty(user_id) && user_id.length == 24) {
        if (param.favourite == 1) {
          const setting = await this.queueService.getSetting(
            'home-screen-per-page',
          );
          param.per_page = !_.isEmpty(setting)
            ? Number(setting)
            : param.per_page;
        }

        const match: any = {
          user_id: ObjectID(user_id),
          'ngoData.ngo_status': 'approve',
          'ngoData.is_expired': { $ne: true },
          'ngoData.is_deleted': false,
        };
        const lookup = {
          $lookup: {
            from: 'ngo', // collection name in db
            localField: 'ngo_id',
            foreignField: '_id',
            as: 'ngoData',
          },
        };

        const total = await this.favouriteNgoModel
          .aggregate([
            lookup,
            { $unwind: '$ngoData' },
            { $match: match },
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
          null,
          null,
          null,
        );

        const query: any = {
          // user_id:ObjectID(param.user_id),
          is_deleted: { $exists: false },
          status: { $ne: 'draft' },
          category_slug: { $ne: 'hunger' },
        };

        if (
          param.corporate_id &&
          !_.isEmpty(param.corporate_id) &&
          param.corporate_id.length == 24
        ) {
          query.corporate_id = ObjectID(param.corporate_id);
        }

        const total_request_count = await this.requestModel
          .aggregate([
            { $match: query },
            {
              $group: {
                _id: null,
                total_count: {
                  $sum: 1,
                },
                total_user_count: {
                  $sum: {
                    $cond: [{ $eq: ['$user_id', ObjectID(user_id)] }, 1, 0],
                  },
                },
              },
            },
          ])
          .exec();
        // const total_donation: any = await this.transactionModel
        //   .aggregate([
        //     {
        //       $match: {
        //         donor_id: ObjectID(param.user_id),
        //         transaction_type: { $ne: 'fund-received' },
        //       },
        //     },
        //     {
        //       $group: {
        //         _id: '$donor_id',
        //         total_count: {
        //           $sum: 1,
        //         },
        //         total_amount: {
        //           $sum: '$amount',
        //         },
        //       },
        //     },
        //   ])
        //   .exec();

        const total_donation: any = await this.transactionModel
          .aggregate([
            {
              $match: {
                donor_id: ObjectID(user_id),
                transaction_type: { $nin: ['fund-received'] },
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
                          {
                            $eq: ['$currency', 'USD'],
                          },
                          {
                            $eq: ['$date', '$$transactionDate'],
                          },
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
            {
              $group: {
                _id: '$_id',
                transaction: { $first: '$$ROOT' },
              },
            },
            {
              $project: {
                _id: 1,
                donor_id: 1,
                total_count: 1,
                total_amount: 1,
                converted_amount: {
                  $function: {
                    body: function (transaction, rates, userCurrency) {
                      if (rates) {
                        const transactionCur =
                          transaction.currency_code.toUpperCase();
                        const fromRate =
                          transactionCur != 'USD' ? rates[transactionCur] : 1;

                        const toRate =
                          userCurrency.toLowerCase() != 'usd'
                            ? rates[userCurrency.toUpperCase()]
                            : 1;

                        const conversionRate = toRate / fromRate;
                        const convertedAmount =
                          transaction.amount * conversionRate;

                        return convertedAmount;
                      }
                      return transaction.amount;
                    },
                    args: [
                      '$transaction',
                      '$transaction.rates.rates',
                      userCurrency,
                    ],
                    lang: 'js',
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
            {
              $group: {
                _id: '$donor_id',
                total_count: {
                  $sum: 1,
                },
                total_amount: {
                  $sum: '$converted_amount',
                },
              },
            },
          ])
          .exec();

        const fund_query: any = {
          is_deleted: { $ne: true },
          $or: [
            { user_id: ObjectID(user_id) },
            {
              admins: {
                $elemMatch: {
                  user_id: ObjectID(user_id),
                  is_deleted: { $ne: true },
                },
              },
              status: 'approve',
            },
          ],
        };
        if (
          param.corporate_id &&
          !_.isEmpty(param.corporate_id) &&
          param.corporate_id.length == 24
        ) {
          fund_query.corporate_id = ObjectID(param.corporate_id);
        }

        const total_fund = await this.fundModel
          .aggregate([
            { $match: fund_query },
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
            { $unwind: '$donations' },
            {
              $group: {
                _id: '$donations.transaction_type',
                total_amount: {
                  $sum: '$donations.converted_total_amt',
                },
              },
            },
          ])
          .exec();

        const count = await this.fundModel
          .count({
            is_deleted: { $ne: true },
            status: { $ne: 'draft' },
          })
          .lean();

        const total_request =
          total_request_count &&
          total_request_count[0] &&
          total_request_count[0].total_count
            ? total_request_count[0].total_count + count
            : 0 + count;
        const total_user_request =
          total_request_count &&
          total_request_count[0] &&
          total_request_count[0].total_user_count
            ? total_request_count[0].total_user_count
            : 0;

        const total_donated_count =
          total_donation && total_donation[0] && total_donation[0].total_count
            ? total_donation[0].total_count
            : 0;
        const total_donated_amount =
          total_donation && total_donation[0] && total_donation[0].total_amount
            ? total_donation[0].total_amount
            : 0;

        const total_fund_amount =
          total_fund && total_fund[0] && total_fund[0].total_amount
            ? total_fund[0].total_amount
            : 0;

        const staticData: any = [
          {
            default: true,
            lifeYouImpacted: true,
            count: total_user_request,
            donate_to_fundraiser: total_donated_count,
            total_donated: total_donated_amount.toFixed(2),
            text: "Lives you've Impacted",
            country_data: countryData,
          },
          {
            default: true,
            lifeSaayamImpacted: true,
            count: total_request,
            text: 'Lives Saayam has Impacted',
            country_data: countryData,
          },
          {
            default: true,
            totalFundBalance: true,
            text: 'Total Fund Balance',
            count: total_fund_amount.toFixed(2),
            country_data: countryData,
          },
        ];

        const ngo = await this.favouriteNgoModel.aggregate([
          lookup,
          { $unwind: '$ngoData' },
          {
            $match: match,
          },
          {
            $project: {
              index: 1,
              ngo_id: '$ngoData._id',
              ngo_cover_image: {
                $concat: [
                  authConfig.imageUrl,
                  'ngo/',
                  { $toString: '$ngoData._id' },
                  '/',
                  {
                    $arrayElemAt: [
                      '$ngoData.form_data.files.ngo_cover_photo',
                      0,
                    ],
                  },
                ],
              },
              ngo_name: '$ngoData.form_data.ngo_name',
            },
          },
          { $sort: { index: 1 } },
          { $skip: start_from },
          { $limit: per_page },
        ]);
        const result = staticData.concat(ngo);
        if (param.favourite == 1) {
          if (total_record > per_page) {
            result.push({ next: true });
          }
        }

        result.push({ default: true });

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
      } else {
        const total_request_count = await this.requestModel.count({
          is_deleted: { $exists: false },
          category_slug: { $ne: 'hunger' },
          status: { $ne: 'draft' },
        });

        const total_request = total_request_count ? total_request_count : 0;

        const data = [
          {
            default: true,
            lifeSaayamImpacted: true,
            count: total_request,
            text: 'Lives Saayam has Impacted',
          },
        ];
        return res.json({
          success: true,
          data,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-findFavouriteNGO',
        param,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for change favourite NGO position
  public async changeIndex(body: any, res: any): Promise<Ngo> {
    try {
      const userData = this.request.user;
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        body.newArray,
      );
      if (!_.isEmpty(body.newArray)) {
        let newIndex = 0;
        await body.newArray.map(async (item) => {
          newIndex = newIndex + 1;
          await this.favouriteNgoModel
            .updateOne(
              { user_id: ObjectID(userData?._id), ngo_id: ObjectID(item._id) },
              { index: newIndex },
            )
            .lean();
        });
        return res.json({
          success: true,
          message: mConfig.favourite_list_update,
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
        'src/controller/ngo/ngo.service.ts-changeIndex',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete ngo from admin panel
  public async deleteNgo(
    ngoId: string,
    delete_reason: string,
    res: any,
  ): Promise<Ngo> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        delete_reason,
      );
      // const user = await this.userModel.findById(ObjectID(ngoId)).exec();

      const findNGO: any = await this.ngo
        .findOne({ _id: ngoId })
        .select({ _id: 1, trustees_name: 1, 'form_data.ngo_name': 1 })
        .lean();
      if (!findNGO) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const match: any = {
          $or: [
            { user_ngo_id: ObjectID(ngoId) },
            { donor_ngo_id: ObjectID(ngoId) },
            { volunteer_ngo_id: ObjectID(ngoId) },
          ],
          status: {
            $in: [
              'approve',
              'pending',
              'donor_accept',
              'volunteer_accept',
              'waiting_for_volunteer',
              'pickup',
              'reverify',
            ],
          },
        };

        const count = await this.requestModel.count(match).lean();
        if (count > 0) {
          const msg = await this.commonService.changeString(
            mConfig.You_cant_delete_this_ngo,
            { '{{count}}': count },
          );
          return res.json({ success: false, message: msg });
        }

        const updateData: any = {
          is_deleted: true,
        };
        // await this.bankModel.updateMany(query, updateData).exec();
        // await this.transactionModel.updateMany(query, updateData).exec();
        // await this.requestModel.updateMany(query, updateData).exec();
        await this.notificationModel
          .updateMany({ ngoId: findNGO._id }, updateData)
          .lean();
        await this.paymentProcessModel
          .updateMany({ ngo_id: findNGO._id }, updateData)
          .lean();
        await this.adminNotification
          .updateMany({ ngo_id: findNGO._id }, updateData)
          .lean();

        const ids = findNGO.trustees_name.map(async (item) => {
          await this.userModel
            .findByIdAndUpdate(
              { _id: item._id },
              { $unset: { is_ngo: 1, ngo_data: 1, ngo_id: 1 } },
            )
            .lean();
          return item._id;
        });

        await this.ngo
          .findByIdAndUpdate(
            { _id: ngoId },
            {
              is_deleted: true,
              deletedAt: new Date(),
              delete_account_reason: delete_reason,
            },
          )
          .lean();
        await this.ngoUpdatedModel
          .updateMany(
            { ngo_id: ObjectID(ngoId) },
            {
              is_deleted: true,
            },
          )
          .lean();
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_NGO_deactivate,
          { '{{ngo}}': findNGO?.form_data?.ngo_name },
        );
        const input: any = {
          message: msg,
          title: mConfig.noti_title_NGO_deactivate,
          type: 'ngo',
          ngoId: findNGO._id,
        };

        this.commonService.sendAllNotification(ids, input);

        //Add Activity Log
        const logData = {
          action: 'delete',
          ngo_id: findNGO._id,
          entity_name: `Deactivate NGO`,
          description: `NGO has been deactivated - ${findNGO?.form_data?.ngo_name}`,
        };
        this.logService.createAdminLog(logData);

        return res.send({
          success: true,
          message: mConfig.NGO_deactivated,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.deleteNGO',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for report NGO
  public async reportNgo(id: string, description: string, res: any) {
    try {
      const userDetail = this.request.user;
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'put',
        description,
      );

      const userId = userDetail._id;
      const uname = userDetail.display_name
        ? userDetail.display_name
        : userDetail.first_name + ' ' + userDetail.last_name;
      const ngoData: any = await this.ngo.findById({ _id: id }).lean();
      if (!ngoData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const addData: any = {
          user_id: userId,
          user_name: uname,
          description,
          added_time: new Date(),
        };
        await this.ngo
          .findByIdAndUpdate(
            { _id: ngoData._id },
            { $push: { report_ngo: addData } },
          )
          .lean();

        const updateData1 = {
          '{{uname}}': uname,
          '{{ngo}}': ngoData?.form_data?.ngo_name,
        };
        const reportTitle = await this.commonService.changeString(
          mConfig.noti_title_report_ngo,
          updateData1,
        );
        const reportMsg = await this.commonService.changeString(
          mConfig.noti_msg_reason,
          { '{{reason}}': description },
        );
        //send notification to user_id
        const input: any = {
          title: reportTitle,
          type: 'ngo',
          ngoId: ngoData._id,
          message: reportMsg,
        };
        this.commonService.sendAdminNotification(input);

        // const data = await this.commonService.getNGODetail(ngoData._id);
        return res.json({
          message: mConfig.Reported_successfully,
          // data,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-reportNgo',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for add certificate NGO
  public async addCertificate(
    ngoId: string,
    cerfificateName: string,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        cerfificateName,
      );
      const findNGO: any = await this.ngo.findOne({ _id: ngoId }).lean();
      if (!findNGO) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        await this.commonService.uploadFileOnS3(
          cerfificateName,
          'ngo/' + ngoId + '/certificate',
        );

        const certificateData: any = {
          ngo_id: ObjectID(ngoId),
          ngo_certificate: cerfificateName,
        };

        const createCertificate = new this.ngoCertificateModel(certificateData);
        createCertificate.save();

        return res.json({
          success: true,
          message: 'Added successfully',
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-addCertificate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api For NGO List
  public async ngoCertificateList(ngoId: string, param, res) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);

      const match = { ngo_id: ObjectID(ngoId) };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        const operator = param.operator ? param.operator.trim() : '=';

        if (!_.isUndefined(filter.ngo_certificate) && filter.ngo_certificate) {
          const query = await this.commonService.filter(
            operator,
            filter.ngo_certificate,
            'ngo_certificate',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.ngo_id) && filter.ngo_id) {
          const query = await this.commonService.filter(
            'objectId',
            filter.ngo_id,
            'ngo_id',
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

        if (!_.isEmpty(where)) {
          match['$and'] = where;
        }
      }
      const sortData = {
        _id: '_id',
        ngo_id: 'ngo_id',
        expiry_date: 'expiry_date',
        ngo_deed: 'ngo_deed',
        ngo_certificate: 'ngo_certificate',
        createdAt: 'createdAt',
      };
      const total = await this.ngoCertificateModel
        .aggregate([{ $match: match }, { $count: 'count' }])
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

      const result = await this.ngoCertificateModel.aggregate([
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            ngo_id: '$ngo_id',
            expiry_date: 1,
            status: 1,
            ngo_deed: 1,
            ngo_certificate: 1,
            createdAt: 1,
            ngo_deed_url: {
              $concat: [
                authConfig.imageUrl,
                'ngo/',
                { $toString: '$ngo_id' },
                '/',
                '$ngo_deed',
              ],
            },
            ngo_certificate_url: {
              $concat: [
                authConfig.imageUrl,
                'ngo/',
                { $toString: '$ngo_id' },
                '/',
                '$ngo_certificate',
              ],
            },
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
        'src/controller/ngo/ngo.service.ts-ngoCertificateList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for accept/reject certificate
  public async ngoCertificateAction(id: string, body, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        body,
      );
      const findCertificate: any = await this.ngoCertificateModel
        .aggregate([
          { $match: { _id: ObjectID(id) } },
          {
            $lookup: {
              from: 'ngo',
              localField: 'ngo_id',
              foreignField: '_id',
              as: 'ngoData',
            },
          },
          {
            $unwind: '$ngoData',
          },
          {
            $project: {
              _id: 1,
              ngo_id: 1,
              ngo_name: '$ngoData.form_data.ngo_name',
            },
          },
        ])
        .exec();

      if (_.isEmpty(findCertificate) && _.isEmpty(findCertificate[0])) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        if (body.status != 'approve' && body.status != 'reject') {
          return res.json({
            success: false,
            message: 'Invalid status',
          });
        }

        const query = {
          status: body?.status,
          reason: body?.reason,
        };

        await this.ngoCertificateModel
          .findByIdAndUpdate(
            { _id: findCertificate[0]._id },
            { $set: query },
            { new: true },
          )
          .lean();

        const status = body.status === 'approve' ? 'approved' : 'rejected';
        //Add Activity Log
        const logData = {
          action: 'verify',
          ngo_id: findCertificate[0]._id,
          entity_id: findCertificate[0].ngo_id,
          entity_name: `Verify NGO Certificate`,
          description: `NGO Certificate has been ${status} - ${findCertificate[0].ngo_name}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message:
            body.status == 'approve'
              ? mConfig.certificate_approved_msg
              : mConfig.certificate_rejected_msg,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-ngoCertificateAction',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for reject current changes in NGO
  public async rejectCurrentChange(id: string, reason: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        reason,
      );
      let findNGO: any = await this.ngo.aggregate([
        {
          $match: { _id: ObjectID(id), ngo_status: 'waiting_for_verify' },
        },
        {
          $lookup: {
            from: 'ngo-updated-data',
            let: { id: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$ngo_id', '$$id'] }],
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
          $unwind: '$updatedData',
        },
        {
          $project: {
            _id: 1,
            trustees_name: 1,
            ngo_previous_status: '$updatedData.ngo_previous_status',
            updated_trustees: '$updatedData.trustees_name',
          },
        },
      ]);

      if (_.isEmpty(findNGO) && _.isEmpty(findNGO[0])) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        findNGO = findNGO[0];
        const query = {
          ngo_status: findNGO.ngo_previous_status,
        };
        await this.ngo
          .findByIdAndUpdate(
            { _id: findNGO._id },
            { $set: query },
            { new: true },
          )
          .lean();

        await this.ngoUpdatedModel
          .findOneAndDelete(
            { ngo_id: ObjectID(findNGO._id) },
            { sort: { _id: -1 } },
          )
          .lean();

        //send notification to trustees in ngo data
        const input = {
          message: mConfig.noti_message_ngo_changes_rejeted,
          title: mConfig.noti_title_ngo_changes_rejeted,
          type: 'ngo',
          ngoId: findNGO.ngo_id,
        };
        const ids = findNGO.trustees_name.map((item) => {
          return item._id;
        });
        this.commonService.sendAllNotification(ids, input);

        findNGO.updated_trustees.map(async (t) => {
          if (!ids.map((s) => s.toString()).includes(t._id.toString())) {
            if (t.verified) {
              await this.userModel
                .findByIdAndUpdate(
                  { _id: t._id },
                  { $unset: { is_ngo: 1, ngo_data: 1, ngo_id: 1 } },
                )
                .lean();
            }

            await this.notificationModel.updateMany(
              { user_id: ObjectID(t._id), ngo_id: findNGO._id },
              { is_deleted: true },
            );

            //send notification to trustee in ngo updated data
            const input = {
              message: mConfig.noti_msg_NGO_owner_has_removed_you,
              title: mConfig.noti_title_ngo_remove_trustee,
              type: 'ngo',
              ngoId: findNGO._id,
              userId: t._id,
            };

            this.commonService.notification(input);
          }
        });

        //Add Activity Log
        const logData = {
          action: 'delete',
          ngo_id: findNGO._id,
          entity_name: `Reject NGO Changes`,
          description: `NGO Current changes has been rejected - ${findNGO?.form_data?.ngo_name}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.change_rejected,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-rejectCurrentChange',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for edit ngo vission, mission, programs
  public async editVission(
    id: string,
    editVissionDto: EditVissionDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        editVissionDto,
      );
      const result: any = await this.ngo
        .findByIdAndUpdate({ _id: id }, { $set: editVissionDto }, { new: true })
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        return res.json({
          message: mConfig.NGO_vission_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-editVission',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for edit ngo history, values_and_principles
  public async editHistory(
    id: string,
    editHistoryDto: EditHistoryDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        editHistoryDto,
      );
      const result: any = await this.ngo
        .findByIdAndUpdate({ _id: id }, { $set: editHistoryDto }, { new: true })
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        return res.json({
          message: mConfig.NGO_history_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-editHistory',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async formData(id: string, status: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id, status },
      );

      let ngoData: any;
      //if status waiting for verify then we are fetching data from updated collection
      if (status == 'waiting_for_verify') {
        ngoData = await this.ngoUpdatedModel
          .findOne({ ngo_id: ObjectID(id) })
          .select({
            form_settings: 1,
            image_url: {
              $concat: [
                authConfig.imageUrl,
                'ngo/',
                { $toString: '$ngo_id' },
                '/',
              ],
            },
          })
          .sort({ _id: -1 })
          .lean();
      } else {
        ngoData = await this.ngo
          .findOne({ _id: ObjectID(id) })
          .select({
            form_settings: 1,
            image_url: {
              $concat: [
                authConfig.imageUrl,
                'ngo/',
                { $toString: '$_id' },
                '/',
              ],
            },
          })
          .lean();
      }

      if (ngoData && !_.isEmpty(ngoData)) {
        return res.json({
          success: true,
          data: ngoData,
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
        'src/controller/ngo/ngo.service.ts-formData',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for add team member in ngo
  public async addTeamMember(addTeamMemberDto: AddTeamMemberDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        addTeamMemberDto,
      );
      const findNGO: any = await this.ngo
        .findOne({ _id: addTeamMemberDto.ngo_id, is_deleted: { $ne: true } })
        .select({ _id: 1 })
        .lean();
      if (!findNGO) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const createTeamMember = new this.ngoTeamMemberModel(addTeamMemberDto);
        const result = await createTeamMember.save();

        if (_.isEmpty(result)) {
          return res.json({
            success: false,
            message: mConfig.Invalid,
          });
        } else {
          if (!_.isEmpty(addTeamMemberDto.image)) {
            await this.commonService.uploadFileOnS3(
              addTeamMemberDto.image,
              'ngo_team_member/' + result._id,
            );
          }
        }
        return res.json({
          success: true,
          message: mConfig.NGO_team_member_added,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-addTeamMember',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for update team member in ngo
  public async updateTeamMember(
    id: string,
    updateTeamMemberDto: UpdateTeamMemberDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateTeamMemberDto,
      );
      const updateData = {
        phone_code: updateTeamMemberDto.phone_code,
        phone: updateTeamMemberDto.phone,
        email: updateTeamMemberDto.email,
        ngo_id: ObjectID(updateTeamMemberDto.ngo_id),
        image: updateTeamMemberDto.image,
        name: updateTeamMemberDto.name,
        position: updateTeamMemberDto.position,
      };
      const findNGO: any = await this.ngo
        .findOne({ _id: updateTeamMemberDto.ngo_id, is_deleted: { $ne: true } })
        .select({ _id: 1 })
        .lean();
      if (!findNGO) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const ngoTeamMember = await this.ngoTeamMemberModel
          .findOneAndUpdate(
            {
              _id: ObjectID(id),
            },
            updateData,
            {
              new: true,
            },
          )
          .lean();

        if (!ngoTeamMember) {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        } else {
          if (!_.isEmpty(updateTeamMemberDto.image)) {
            await this.commonService.uploadFileOnS3(
              updateTeamMemberDto.image,
              'ngo_team_member/' + id,
            );
          }
        }
        return res.json({
          success: true,
          message: mConfig.NGO_team_member_updated,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-updateTeamMember',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for delete team member in ngo
  public async deleteTeamMember(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const ngoTeamMember = await this.ngoTeamMemberModel
        .findOneAndUpdate(
          {
            _id: ObjectID(id),
          },
          { is_deleted: true },
          {
            new: true,
          },
        )
        .lean();

      if (!ngoTeamMember) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        if (ngoTeamMember.image && !_.isUndefined(ngoTeamMember.image)) {
          await this.commonService.s3ImageRemove(
            'ngo_team_member/' + id,
            ngoTeamMember.image,
          );
        }

        return res.json({
          success: true,
          message: mConfig.NGO_team_member_deleted,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-deleteTeamMember',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for list ngo team member
  public async teamMemberList(id, param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = { ngo_id: ObjectID(id), is_deleted: { $ne: true } };

      const total = await this.ngoTeamMemberModel
        .aggregate([{ $match: match }, { $count: 'count' }])
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
        1,
        '_id',
      );

      const result = await this.ngoTeamMemberModel.aggregate(
        [
          { $match: match },
          {
            $project: {
              _id: 1,
              name: 1,
              phone_code: 1,
              phone: 1,
              email: 1,
              position: 1,
              image: {
                $cond: {
                  if: { $ne: ['$image', ''] },
                  then: {
                    $concat: [
                      authConfig.imageUrl,
                      'ngo_team_member/',
                      { $toString: '$_id' },
                      '/',
                      '$image',
                    ],
                  },
                  else: null,
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
        'src/controller/ngo/ngo.service.ts-teamMemberList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for create post in ngo
  public async createPost(createPostDto: CreatePostDto, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createPostDto,
      );
      const findNGO: any = await this.ngoModel
        .findOne({
          _id: ObjectID(createPostDto.ngo_id),
          is_deleted: { $ne: true },
        })
        .select({
          _id: 1,
          user_id: 1,
          reference_id: 1,
          ngo_name: '$form_data.ngo_name',
        })
        .lean();

      if (!findNGO) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const userData = this.request.user;
        createPostDto.user_id = userData._id;
        const createPost = new this.ngoPostModel(createPostDto);
        const result = await createPost.save();

        if (createPostDto.photos && !_.isEmpty(createPostDto.photos)) {
          const files: any = createPostDto.photos;

          files.map(async (item) => {
            await this.commonService.uploadFileOnS3(
              item,
              'ngo/' + findNGO._id + '/post/' + result._id,
            );
          });
        }

        return res.json({ success: true, message: mConfig.Post_created });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-createPost',
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
      const postData: any = await this.ngoPostModel
        .findOne({
          _id: ObjectID(likeDislikeDto.id),
          is_deleted: { $ne: true },
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
          dtl.type = 'ngo-post-like';

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
        'src/controller/ngo/ngo.service.ts-likeUnlike',
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
        ngo_id: ObjectID(id),
        is_deleted: { $ne: true },
        is_blocked: { $ne: true },
      };
      const findNGO = await this.ngoModel
        .findOne({ _id: ObjectID(id), is_deleted: { $ne: true } })
        .select({ _id: 1 })
        .lean();
      if (!findNGO) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        const sortData = {
          _id: '_id',
          createdAt: 'createdAt',
        };

        const total = await this.ngoPostModel
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

        const data = await this.ngoPostModel
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
                        'ngo/',
                        { $toString: '$ngo_id' },
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
                          { $eq: ['$$comment.type', 'ngo-post-like'] },
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
                              { $eq: ['$$comment.type', 'ngo-post-like'] },
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
                        $cond: [{ $eq: ['$$comment.type', 'ngo'] }, 1, 0],
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
        'src/controller/ngo/ngo.service.ts-feedList',
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
        type: 'ngo-post-like',
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
        'src/controller/ngo/ngo.service.ts-likeList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  public async addComment(commentDto: any, res: any): Promise<Comment> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        commentDto,
      );
      const userDetail = this.request.user;
      const data = await this.ngoPostModel
        .findOne({
          _id: ObjectID(commentDto.post_id),
          is_blocked: { $ne: true },
        })
        .select({ _id: 1 })
        .lean();

      if (data) {
        commentDto.user_id = userDetail._id;
        commentDto.type = 'ngo';

        const addComment = new this.commentModel(commentDto);
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
        'src/controller/ngo/ngo.service.ts-addComment',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for create NGO with dynamic form
  public async create(createNgo: CreateNgo, res: any) {
    try {
      let data = JSON.parse(createNgo.data);

      const formData: any = {
        form_data: {
          files: {},
          images: {},
        },
        ngo_causes: createNgo.ngo_causes,
        ngo_status: 'pending',
        is_enable: false,
        form_country_code: createNgo.form_country,
      };

      const { data1, formData1, haveError } =
        await this.requestService.checkValidation(
          data,
          formData,
          null,
          'main',
          null,
          'ngo_form',
          null,
        );

      data = JSON.stringify(data1);
      const newData = formData1.form_data;

      //If there is an error in inputs validation then return error
      if (haveError) {
        return res.json({
          success: false,
          data,
        });
      }

      if (
        createNgo.otp &&
        !_.isEmpty(createNgo.otp) &&
        createNgo.otp_platform &&
        !_.isEmpty(createNgo.otp_platform)
      ) {
        //verify otp
        const otpData = {
          phone_code: newData.ngo_mobile_number.countryCodeD,
          phone: newData.ngo_mobile_number.phoneNumber,
          otp_platform: createNgo.otp_platform,
          otp: createNgo.otp,
        };
        const verifyOTP = await this.commonService.verifyOtp(otpData);
        if (verifyOTP['success'] == false || verifyOTP['success'] == true) {
          return res.json(verifyOTP);
        }
      }
      formData1.form_settings = data;

      //if create ngo using social login
      let facebookData: any = {};

      if (
        createNgo.type &&
        !_.isUndefined(createNgo.type) &&
        createNgo.data_id &&
        !_.isUndefined(createNgo.data_id)
      ) {
        const date = new Date();
        facebookData = await this.socialDataModel
          .findOne({
            _id: ObjectID(createNgo.data_id),
            createdAt: { $gte: new Date(date.getTime() - 1000 * 60 * 20) },
          })
          .lean();

        //if create time is greater than 5 minutes then throw error
        if (_.isEmpty(facebookData)) {
          return res.json({
            success: false,
            message: mConfig.Please_try_again,
          });
        } else {
          if (facebookData.data && facebookData.data.sImage) {
            const filename = parseInt(moment().format('X')) + '.png';
            const checkImage = await this.usersService.downloadImage(
              facebookData.sImage,
              filename,
            );
            if (checkImage) {
              facebookData.data.image = filename;
            }
          }
        }
      }

      //check user exist with phone or not
      let existUser = await this.userModel
        .findOne({
          phone: newData.ngo_mobile_number.phoneNumber,
          phone_code: newData.ngo_mobile_number.countryCodeD,
          is_deleted: false,
        })
        .select({ _id: 1, email: 1, phone_country_short_name: 1 })
        .lean();

      const latitude = Number(formData1?.ngo_address?.coordinates[1]);
      const longitude = Number(formData1?.ngo_address?.coordinates[0]);

      const countryData = await this.commonService.getCountry(
        createNgo.country_name,
      );
      const timezonesName = await this.commonService.getTimezoneFromLatLon(
        latitude,
        longitude,
      );

      let query = {};
      //if user not exist then create as a donor in user tbl
      if (!existUser) {
        const dtl = {
          is_donor: createNgo?.is_donor || true,
          is_user: createNgo?.is_user || true,
          is_volunteer: createNgo?.is_volunteer || false,
          phone_code: newData?.ngo_mobile_number?.countryCodeD,
          phone: newData?.ngo_mobile_number?.phoneNumber,
          first_name: newData?.first_name,
          display_name: newData?.first_name,
          last_name: newData?.last_name,
          phone_country_full_name:
            newData?.ngo_mobile_number?.phone_country_full_name,
          phone_country_short_name: newData?.ngo_mobile_number?.short_name,
          location: formData1?.ngo_address,
          image:
            facebookData && facebookData.data && facebookData.data.image
              ? facebookData.data.image
              : null,
          email: newData?.ngo_email,
          country_data: countryData ? countryData : null,
          default_country: createNgo.country_name,
          time_zone: timezonesName,
          my_causes: createNgo.ngo_causes,
        };

        const createUser = new this.userModel(dtl);
        existUser = await createUser.save();
      } else {
        query = {
          is_donor: createNgo?.is_donor || true,
          is_user: createNgo?.is_user || true,
          is_volunteer: createNgo?.is_volunteer || false,
        };
      }

      //Add default trustee
      const defaultTrustee = [
        {
          _id: existUser._id,
          first_name: newData?.first_name,
          last_name: newData?.last_name,
          email: existUser.email,
          phone: existUser.phone,
          phone_code: existUser.phone_code,
          flag: flag(existUser.phone_country_short_name),
          country_code: countryData.country_code, //need to verify
          is_owner: true,
          verified: true,
          added_time: new Date(),
        },
      ];

      formData1.trustees_name = defaultTrustee;
      formData1.country_data = countryData ? countryData : null;
      formData1.time_zone = timezonesName;

      const saveNgo = new this.ngoModel(formData1);
      const ngo = await saveNgo.save();

      if (_.isEmpty(ngo)) {
        return res.json({
          success: false,
          message: mConfig.Invalid,
        });
      } else {
        //Move uploaded images in tmp to site folder
        if (formData1.form_data && formData1.form_data.files) {
          const files = formData1.form_data.files;

          for (const key in files) {
            files[key].map(async (item) => {
              await this.commonService.uploadFileOnS3(item, 'ngo/' + ngo._id);
            });
          }
        }

        const ngoData = {
          _id: ngo._id,
          ngo_name: newData?.ngo_name,
          ngo_causes: ngo.ngo_causes,
          ngo_status: ngo.ngo_status,
          ngo_location: formData1?.ngo_address,
        };

        query['is_ngo'] = true;
        query['ngo_id'] = ngo._id;
        query['ngo_data'] = ngoData;

        if (facebookData && facebookData.data) {
          if (createNgo.type == 'google') {
            query['google_id'] = facebookData.data.sub;
          } else if (createNgo.type == 'apple') {
            query['apple_id'] = facebookData.data.sub;
          } else if (createNgo.type == 'facebook') {
            query['facebook_id'] = facebookData.data.sub;
          }
        }

        const updateUser = await this.userModel
          .findByIdAndUpdate(
            { _id: existUser._id },
            { $set: query },
            { new: true },
          )
          .lean();

        //send notification to admin
        const input = {
          message: mConfig.noti_msg_New_NGO_registered,
          title: mConfig.noti_title_ngo_registered,
          type: 'ngo',
          ngoId: ngo._id,
        };
        this.commonService.sendAdminNotification(input);

        const result1 = await this.usersService.makeLogin(
          updateUser,
          createNgo.uuid,
          createNgo.platform,
        );
        return res.json(result1);
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update NGO with dynamic form
  public async update(
    ngoId: string,
    updateNgoDto: UpdateDto,
    res: any,
  ): Promise<NgoModel> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateNgoDto,
      );
      const existNgo: any = await this.ngo.findById(ngoId).lean();
      if (!existNgo) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let data = JSON.parse(updateNgoDto.data);

        const formData: any = {
          form_data: {
            files: {},
            images: {},
          },
        };

        //check dynamic form validation
        const { data1, formData1, haveError } =
          await this.requestService.checkValidation(
            data,
            formData,
            null,
            'main',
            null,
            'ngo_form',
            null,
          );

        data = JSON.stringify(data1);
        const newData = formData1.form_data;

        //If there is an error in inputs validation then return error
        if (haveError) {
          return res.json({
            success: false,
            data,
          });
        }

        //verify otp
        if (
          updateNgoDto.otp &&
          !_.isEmpty(updateNgoDto.otp) &&
          updateNgoDto.otp_platform &&
          !_.isEmpty(updateNgoDto.otp_platform)
        ) {
          //verify otp
          const otpData = {
            phone_code: newData.ngo_mobile_number.countryCodeD,
            phone: newData.ngo_mobile_number.phoneNumber,
            otp_platform: updateNgoDto.otp_platform,
            otp: updateNgoDto.otp,
          };
          const verifyOTP = await this.commonService.verifyOtp(otpData);

          if (verifyOTP['success'] == false || verifyOTP['success'] == true) {
            return res.json(verifyOTP);
          }
        }

        formData1.form_settings = data;

        //add certificates in new table
        if (
          !_.isEmpty(newData?.files?.ngo_deed) ||
          !_.isEmpty(newData?.files?.upload_registration_document) ||
          !_.isUndefined(newData?.expiry_date)
        ) {
          let certificateData: any = {};
          if (
            !_.isUndefined(newData?.expiry_date) &&
            moment(existNgo?.form_data?.expiry_date).format('YYYY/MM/DD') !=
              moment(newData?.expiry_date).format('YYYY/MM/DD')
          ) {
            certificateData.expiry_date = newData.expiry_date;
          }
          if (
            !_.isEmpty(newData?.files.ngo_deed) &&
            !_.isEqual(
              existNgo?.form_data?.files?.ngo_deed,
              newData?.files?.ngo_deed,
            )
          ) {
            certificateData.ngo_deed = newData.files.ngo_deed[0];
          }
          if (
            !_.isEmpty(newData?.files?.upload_registration_document) &&
            !_.isEqual(
              existNgo?.form_data?.files.upload_registration_document,
              newData?.files?.upload_registration_document,
            )
          ) {
            certificateData.ngo_registration =
              newData.files.upload_registration_document[0];
          }
          if (!_.isEmpty(certificateData)) {
            certificateData.ngo_id = ngoId;
            const createCertificate = new this.ngoCertificateModel(
              certificateData,
            );
            createCertificate.save();
          }
        }

        if (
          !_.isEmpty(formData1) &&
          !_.isEmpty(formData1?.ngo_address) &&
          !_.isEmpty(existNgo?.ngo_address) &&
          !_.isEqual(formData1?.ngo_address, existNgo?.ngo_address)
        ) {
          const latitude = Number(formData1?.ngo_address?.coordinates[1]);
          const longitude = Number(formData1?.ngo_address?.coordinates[0]);

          const countryData = await this.commonService.getCountry(
            updateNgoDto.country_name,
          );
          const timezonesName = await this.commonService.getTimezoneFromLatLon(
            latitude,
            longitude,
          );

          formData1.country_data = countryData ? countryData : null;
          formData1.time_zone = timezonesName;
        }
        let query = {};
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_Owner_has_changed_ngo_profile,
          { '{{ngo}}': existNgo?.form_data?.ngo_name },
        );
        if (existNgo.ngo_status !== 'pending') {
          if (existNgo.ngo_status !== 'blocked') {
            query = {
              ngo_status: 'waiting_for_verify',
              is_enable: false,
            };
          }

          //Function for add data in ngo update table
          await this.saveNgoUpdatedData(existNgo, formData1);

          //send notification to ngo owner
          const input1 = {
            message: mConfig.noti_msg_ngo_under_verify,
            title: mConfig.noti_title_ngo_verify,
            type: 'ngo',
            ngoId: ngoId,
            userId: this.request.user._id,
          };
          this.commonService.notification(input1);
        } else {
          query = formData1;
          const query1 = {
            'ngo_data.ngo_name': newData?.ngo_name
              ? newData?.ngo_name
              : existNgo?.form_data?.ngo_name,
            'ngo_data.ngo_location': formData1?.ngo_address
              ? formData1?.ngo_address
              : existNgo?.ngo_address,
          };
          await this.userModel
            .updateMany(
              { 'ngo_data._id': existNgo._id, is_deleted: false },
              { $set: query1 },
            )
            .lean();
        }
        await this.ngoModel.findByIdAndUpdate(ngoId, query).lean();

        //Move uploaded images in tmp to ngo folder
        if (formData1?.form_data && formData1?.form_data?.files) {
          const files = formData1?.form_data?.files;

          for (const key in files) {
            files[key].map(async (item) => {
              await this.commonService.uploadFileOnS3(
                item,
                'ngo/' + existNgo._id,
              );
            });
          }
        }

        //Find second trustee & send notification
        const trustee2 = existNgo.trustees_name.filter(function (obj) {
          return obj.is_owner === false;
        })[0];
        if (!_.isEmpty(trustee2)) {
          const input: any = {
            message: msg,
            title: mConfig.noti_title_NGO_Profile_Update,
            type: 'ngo',
            ngoId: ngoId,
            userId: trustee2._id,
          };
          this.commonService.notification(input);
        }

        //send notification to admin
        const input1: any = {
          message: msg,
          title: mConfig.noti_title_NGO_Profile_Update,
          type: 'ngo',
          ngoId: ngoId,
        };
        this.commonService.sendAdminNotification(input1);

        return res.json({
          success: true,
          message: mConfig.Ngo_profile_updated,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for create ngo using dynamic form
  public async createNgo(createNgo: AdminNgoCreateDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createNgo,
      );
      let data = JSON.parse(createNgo.data);

      const formData: any = {
        form_data: {
          files: {},
          images: {},
        },
        ngo_causes: createNgo.ngo_causes,
        ngo_status: 'approve',
        is_enable: false,
        form_country_code: createNgo.form_country,
      };

      const { data1, formData1, haveError } =
        await this.requestService.checkValidation(
          data,
          formData,
          null,
          'main',
          null,
          'ngo_form',
          null,
        );

      data = JSON.stringify(data1);
      const newData = formData1.form_data;

      //If there is an error in inputs validation then return error
      if (haveError) {
        return res.json({
          success: false,
          data,
        });
      }

      formData1.form_settings = data;

      //check user exist with phone or not
      let existUser = await this.userModel
        .findOne({
          phone: newData.ngo_mobile_number.phoneNumber,
          phone_code: newData.ngo_mobile_number.countryCodeD,
          is_deleted: false,
        })
        .select({ _id: 1, email: 1, phone_country_short_name: 1 })
        .lean();

      const latitude = Number(formData1?.ngo_address?.coordinates[1]);
      const longitude = Number(formData1?.ngo_address?.coordinates[0]);

      const countryData = await this.commonService.getCountry(
        createNgo.country_name,
      );
      const timezonesName = await this.commonService.getTimezoneFromLatLon(
        latitude,
        longitude,
      );

      let query = {};
      //if user not exist then create as a donor in user tbl
      if (!existUser) {
        const dtl = {
          is_donor: true,
          is_user: true,
          is_volunteer: true,
          phone_code: newData?.ngo_mobile_number?.countryCodeD,
          phone: newData?.ngo_mobile_number?.phoneNumber,
          first_name: newData?.first_name,
          display_name: newData?.first_name,
          last_name: newData?.last_name,
          phone_country_full_name:
            newData?.ngo_mobile_number?.phone_country_full_name,
          phone_country_short_name: newData?.ngo_mobile_number?.short_name,
          location: formData1?.ngo_address,
          image: null,
          email: newData?.ngo_email,
          country_data: countryData ? countryData : null,
          default_country: createNgo.country_name,
          time_zone: timezonesName,
          my_causes: createNgo.ngo_causes,
        };

        const createUser = new this.userModel(dtl);
        existUser = await createUser.save();
      } else {
        query = {
          is_donor: true,
          is_user: true,
          is_volunteer: true,
        };
      }

      //Add default trustee
      const defaultTrustee = [
        {
          _id: existUser._id,
          first_name: newData?.first_name,
          last_name: newData?.last_name,
          email: existUser.email,
          phone: existUser.phone,
          phone_code: existUser.phone_code,
          flag: flag(existUser.phone_country_short_name),
          country_code: countryData.country_code, //need to verify
          is_owner: true,
          verified: true,
          added_time: new Date(),
        },
      ];

      formData1.trustees_name = defaultTrustee;
      formData1.country_data = countryData ? countryData : null;
      formData1.time_zone = timezonesName;

      const saveNgo = new this.ngoModel(formData1);
      const ngo = await saveNgo.save();

      if (_.isEmpty(ngo)) {
        return res.json({
          success: false,
          message: mConfig.Invalid,
        });
      } else {
        //Move uploaded images in tmp to site folder
        if (formData1.form_data && formData1.form_data.files) {
          const files = formData1.form_data.files;

          for (const key in files) {
            files[key].map(async (item) => {
              await this.commonService.uploadFileOnS3(item, 'ngo/' + ngo._id);
            });
          }
        }

        const ngoData = {
          _id: ngo._id,
          ngo_name: newData?.ngo_name,
          ngo_causes: ngo.ngo_causes,
          ngo_status: ngo.ngo_status,
          ngo_location: formData1?.ngo_address,
        };

        query['is_ngo'] = true;
        query['ngo_id'] = ngo._id;
        query['ngo_data'] = ngoData;

        await this.userModel
          .findByIdAndUpdate(
            { _id: existUser._id },
            { $set: query },
            { new: true },
          )
          .lean();

        return res.json({
          success: true,
          message: mConfig.Ngo_created_successfully,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-createNgo',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for update ngo details
  public async updateNGO(
    ngoId: string,
    updateNgoDto: AdminNgoUpdateDto,
    res: any,
  ): Promise<NgoModel> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateNgoDto,
      );
      const existNgo: any = await this.ngo.findById(ngoId).lean();
      if (!existNgo) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let data = JSON.parse(updateNgoDto.data);

        const formData: any = {
          form_data: {
            files: {},
            images: {},
          },
        };

        //check dynamic form validation
        const { data1, formData1, haveError } =
          await this.requestService.checkValidation(
            data,
            formData,
            null,
            'main',
            null,
            'ngo_form',
            null,
          );

        data = JSON.stringify(data1);
        const newData = formData1.form_data;

        //If there is an error in inputs validation then return error
        if (haveError) {
          return res.json({
            success: false,
            data,
          });
        }

        formData1.form_settings = data;

        //add certificates in new table
        if (
          !_.isEmpty(newData?.files?.ngo_deed) ||
          !_.isEmpty(newData?.files?.ngo_registration) ||
          !_.isUndefined(newData?.expiry_date)
        ) {
          let certificateData: any = {};
          if (
            !_.isUndefined(newData?.expiry_date) &&
            moment(existNgo?.form_data?.expiry_date).format('YYYY/MM/DD') !=
              moment(newData?.expiry_date).format('YYYY/MM/DD')
          ) {
            certificateData.expiry_date = newData.expiry_date;
          }
          if (
            !_.isEmpty(newData?.files.ngo_deed) &&
            !_.isEqual(
              existNgo?.form_data?.files?.ngo_deed,
              newData?.files?.ngo_deed,
            )
          ) {
            certificateData.ngo_deed = newData.files.ngo_deed[0];
          }
          if (
            !_.isEmpty(newData?.files?.ngo_registration) &&
            !_.isEqual(
              existNgo?.form_data?.files.ngo_registration,
              newData?.files?.ngo_registration,
            )
          ) {
            certificateData.ngo_registration =
              newData.files.ngo_registration[0];
          }
          if (!_.isEmpty(certificateData)) {
            certificateData.ngo_id = ngoId;
            const createCertificate = new this.ngoCertificateModel(
              certificateData,
            );
            createCertificate.save();
          }
        }

        if (
          !_.isEmpty(formData1) &&
          !_.isEmpty(formData1?.ngo_address) &&
          !_.isEmpty(existNgo?.ngo_address) &&
          !_.isEqual(formData1?.ngo_address, existNgo?.ngo_address)
        ) {
          const latitude = Number(formData1?.ngo_address?.coordinates[1]);
          const longitude = Number(formData1?.ngo_address?.coordinates[0]);

          const countryData = await this.commonService.getCountry(
            updateNgoDto.country_name,
          );
          const timezonesName = await this.commonService.getTimezoneFromLatLon(
            latitude,
            longitude,
          );

          formData1.country_data = countryData ? countryData : null;
          formData1.time_zone = timezonesName;
        }
        let query = {};

        if (existNgo.ngo_status !== 'pending') {
          if (existNgo.ngo_status !== 'blocked') {
            query = {
              ngo_status: 'waiting_for_verify',
              is_enable: false,
            };
          }

          //Function for add data in ngo update table
          await this.saveNgoUpdatedData(existNgo, formData1);
        } else {
          query = formData1;
          const query1 = {
            'ngo_data.ngo_name': newData?.ngo_name
              ? newData?.ngo_name
              : existNgo?.form_data?.ngo_name,
            'ngo_data.ngo_location': formData1?.ngo_address
              ? formData1?.ngo_address
              : existNgo?.ngo_address,
          };
          await this.userModel
            .updateMany(
              { 'ngo_data._id': existNgo._id, is_deleted: false },
              { $set: query1 },
            )
            .lean();
        }
        await this.ngoModel.findByIdAndUpdate(ngoId, query).lean();

        //Move uploaded images in tmp to ngo folder
        if (formData1?.form_data && formData1?.form_data?.files) {
          const files = formData1?.form_data?.files;

          for (const key in files) {
            files[key].map(async (item) => {
              await this.commonService.uploadFileOnS3(
                item,
                'ngo/' + existNgo._id,
              );
            });
          }
        }

        const ids = existNgo.trustees_name.map((item) => {
          return item._id;
        });
        const msg = await this.commonService.changeString(
          '{{ngo}} NGO profile updated by Admin',
          { '{{ngo}}': existNgo?.form_data?.ngo_name },
        );
        const input: any = {
          message: msg,
          title: mConfig.noti_title_NGO_Profile_Update,
          type: 'ngo',
          ngoId: ngoId,
          userId: ids,
        };

        await this.commonService.sendAllNotification(ids, input);

        return res.json({
          success: true,
          message: mConfig.Ngo_profile_updated,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-updateNGO',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //  Api for verify NGO by admin
  public async verifyNgo(
    ngoId: string,
    verifyNgoDto: VerifyNgoDto,
    res: any,
  ): Promise<Ngo> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        verifyNgoDto,
      );
      const ngo: any = await this.ngoModel
        .findById(ngoId)
        .select({
          _id: 1,
          ngo_status: 1,
          ngo_name: '$form_data.ngo_name',
          ngo_address: 1,
          ngo_causes: 1,
          is_expired: 1,
          expiry_date: '$form_data.expiry_date',
          transfer_account: 1,
          trustees_name: 1,
        })
        .lean();
      if (!_.isEmpty(ngo)) {
        let updateData: any = {};
        let unsetData: any = {};
        let findUpdatedData: any = {};
        const input: any = {
          type: 'ngo',
          ngoId: ngo._id,
        };

        if (verifyNgoDto.ngo_status === 'approve') {
          if (ngo.ngo_status === 'waiting_for_verify') {
            findUpdatedData = await this.ngoUpdatedModel
              .findOne({
                ngo_id: ngo._id,
              })
              .sort({ _id: -1 })
              .lean();
            //This is done if ngo has added new trutee means if trustee2 is different in both tbl & status waiting

            if (!_.isEmpty(findUpdatedData)) {
              delete findUpdatedData._id;
              delete findUpdatedData.ngo_id;
              updateData = {
                trustees_name: findUpdatedData.trustees_name,
                ngo_causes: findUpdatedData.ngo_causes,
                ngo_address: findUpdatedData.ngo_address,
                removed_trustee: findUpdatedData.removed_trustee,
                form_settings: findUpdatedData.form_settings,
                form_data: findUpdatedData.form_data,
                country_data: findUpdatedData.country_data,
                time_zone: findUpdatedData.time_zone,
              };
            }
          }
          updateData.ngo_status = verifyNgoDto.ngo_status;
          updateData.approve_time = new Date();
          updateData.is_enable = true;
          input.message = mConfig.noti_msg_ngo_approved;
          input.title = mConfig.noti_title_ngo_approved;
        } else if (verifyNgoDto.ngo_status === 'reject') {
          if (ngo.ngo_status === 'waiting_for_verify') {
            await this.notificationModel
              .updateMany(
                { ngo_id: ngo._id.toString() },
                { 'additional_data.verified': true },
              )
              .lean();
            // send notification to added new trustee
          }
          updateData = {
            ngo_status: verifyNgoDto.ngo_status,
            reject_reason: verifyNgoDto.reject_reason,
            reject_time: new Date(),
            is_enable: false,
          };

          const ngoData = {
            _id: ngo._id,
            ngo_name: ngo?.ngo_name,
            ngo_causes: ngo.ngo_causes,
            ngo_status: verifyNgoDto.ngo_status,
            ngo_location: ngo?.ngo_address,
          };
          await this.userModel
            .updateMany(
              { 'ngo_data._id': ngo._id, is_deleted: false },
              { ngo_data: ngoData },
            )
            .lean();
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_reason,
            { '{{reason}}': verifyNgoDto.reject_reason },
          );

          input.message = msg;
          input.title = mConfig.noti_title_ngo_rejected;
        } else {
          updateData = {
            ngo_status: verifyNgoDto.ngo_status,
            reverify_time: new Date(),
            is_enable: false,
          };
          input.message = mConfig.noti_msg_NGO_is_under_verification;
        }

        if (
          verifyNgoDto.ngo_status === 'approve' ||
          verifyNgoDto.ngo_status === 'reject'
        ) {
          await this.ngoCertificateModel
            .updateMany(
              { ngo_id: ngo._id.toString(), status: 'pending' },
              { status: verifyNgoDto.ngo_status },
            )
            .lean();
        }

        if (!_.isEmpty(findUpdatedData)) {
          //only apply when status approve
          const updatedDate = moment(
            findUpdatedData?.form_data?.expiry_date,
          ).format('YYYY-MM-DD');
          const oldDate = moment(ngo?.expiry_date).format('YYYY-MM-DD');
          if (ngo.is_expired && !moment(updatedDate).isSame(oldDate)) {
            unsetData = { is_expired: 1 };
          }
        }

        if (ngo.ngo_status == 'blocked') {
          unsetData = {
            report_ngo: 1,
            block_reason: 1,
            block_type: 1,
          };

          const ubnlockMsg = await this.commonService.changeString(
            mConfig.noti_msg_unblocked_ngo,
            {
              '{{ngo_name}}': ngo.ngo_name,
            },
          );
          input.title = mConfig.noti_title_unblock_ngo;
          input.message = ubnlockMsg;
        }

        const query = {
          $set: {
            'ngo_data.ngo_status': verifyNgoDto.ngo_status,
          },
        };

        await this.userModel
          .updateMany({ 'ngo_data._id': ngo._id }, query)
          .lean();

        const result: any = await this.ngo
          .findByIdAndUpdate(
            { _id: ObjectID(ngoId) },
            { $set: updateData, $unset: unsetData },
            {
              new: true,
            },
          )
          .lean();

        if (
          (ngo.ngo_status === 'pending' ||
            ngo.ngo_status === 'waiting_for_verify') &&
          verifyNgoDto.ngo_status === 'approve'
        ) {
          result.trustees_name.map(async (item: any) => {
            const ngoData = {
              _id: result._id,
              ngo_name:
                findUpdatedData?.form_data &&
                findUpdatedData?.form_data?.ngo_name
                  ? findUpdatedData?.form_data?.ngo_name
                  : result?.form_data?.ngo_name,
              ngo_causes: findUpdatedData.ngo_causes
                ? findUpdatedData.ngo_causes
                : result.ngo_causes,
              ngo_status: verifyNgoDto.ngo_status,
              ngo_location: findUpdatedData.ngo_address
                ? findUpdatedData.ngo_address
                : result.ngo_address,
            };
            const query = {
              is_ngo: true,
              ngo_id: ObjectID(result._id),
              ngo_data: ngoData,
            };
            await this.userModel
              .findByIdAndUpdate({ _id: item._id }, query)
              .lean();
          });

          if (
            !_.isUndefined(findUpdatedData?.new_removed_trustee) &&
            findUpdatedData?.new_removed_trustee
          ) {
            const input1 = {
              message: mConfig.noti_msg_NGO_owner_has_removed_you,
              title: mConfig.noti_title_ngo_remove_trustee,
              type: 'ngo',
              ngoId: findUpdatedData.ngo_id,
              userId: findUpdatedData.new_removed_trustee._id,
            };
            this.commonService.notification(input1);

            await this.userModel
              .findByIdAndUpdate(
                { _id: findUpdatedData.new_removed_trustee._id },
                { $unset: { is_ngo: 1, ngo_data: 1, ngo_id: 1 } },
              )
              .lean();
          }
          //set owner in user model
          // const updatedData: any = await this.ngoUpdatedModel.findOne({
          //   ngo_id: ngo._id,
          // });

          //find transfer account true
          if (
            (findUpdatedData &&
              findUpdatedData.transfer_account &&
              findUpdatedData.trustees_name.length === 2) ||
            (ngo.transfer_account && ngo.trustees_name.length === 2)
          ) {
            let trusty1 = false;
            let trusty2 = true;
            if (
              (findUpdatedData?.transfer_account &&
                findUpdatedData?.trustees_name[0]?.is_owner == false) ||
              (ngo?.transfer_account &&
                ngo?.trustees_name[0]?.is_owner == false)
            ) {
              trusty1 = true;
              trusty2 = false;
            }
            const ngoNewData: any = await this.ngo
              .findByIdAndUpdate(
                { _id: ngo._id },
                {
                  $set: {
                    'trustees_name.0.is_owner': trusty1,
                    'trustees_name.1.is_owner': trusty2,
                  },
                  $unset: {
                    transfer_account: 1,
                    transfer_documents: 1,
                    transfer_reason: 1,
                  },
                },
                { new: true },
              )
              .lean();

            const findOwner = ngoNewData.trustees_name.filter(function (obj) {
              return obj.is_owner === true;
            })[0];

            const change = {
              is_volunteer: true,
              is_donor: true,
              is_user: true,
            };
            await this.userModel.updateOne(
              { _id: ObjectID(findOwner._id) },
              change,
            );

            input.title = mConfig.noti_title_transfer_ngo_ownership;
            let trusty_msg = 'Your NGO approved by admin.';
            let owner_msg = 'Your NGO approved by admin.';
            let owner_id = '';
            let trusty_id = '';
            if (ngoNewData?.trustees_name[0]?.is_owner == false) {
              //0 index trusty

              trusty_msg = await this.commonService.changeString(
                mConfig.noti_msg_transfer_ownership_trusty_msg,
                {
                  '{{owner_name}}': ngoNewData?.trustees_name[1]?.first_name,
                },
              );

              owner_msg = await this.commonService.changeString(
                mConfig.noti_msg_transfer_ownership_owner_msg,
                {
                  '{{trusty_name}}': ngoNewData?.trustees_name[0]?.first_name,
                },
              );

              owner_id = ngoNewData?.trustees_name[1]?._id;
              trusty_id = ngoNewData?.trustees_name[0]?._id;
            } else if (ngoNewData?.trustees_name[0]?.is_owner == true) {
              //1 index trusty

              trusty_msg = await this.commonService.changeString(
                mConfig.noti_msg_transfer_ownership_trusty_msg,
                {
                  '{{owner_name}}': ngoNewData?.trustees_name[0]?.first_name,
                },
              );

              owner_msg = await this.commonService.changeString(
                mConfig.noti_msg_transfer_ownership_owner_msg,
                {
                  '{{trusty_name}}': ngoNewData?.trustees_name[1]?.first_name,
                },
              );

              owner_id = ngoNewData?.trustees_name[0]?._id; //owner_msg
              trusty_id = ngoNewData?.trustees_name[1]?._id; //trusty_msg
            }
            //send notification to trusty
            input.userId = trusty_id;
            input.message = trusty_msg;
            await this.commonService.notification(input, false);

            //send notification to owner
            input.userId = owner_id;
            input.message = owner_msg;
            await this.commonService.notification(input, false);
          }
          // await this.ngoUpdatedModel.deleteOne({ ngo_id: ngo._id }).lean();
        }

        if (!findUpdatedData.transfer_account && !ngo.transfer_account) {
          //send notification to user
          const ids = result.trustees_name.map((item) => {
            return item._id;
          });
          this.commonService.sendAllNotification(ids, input);
        }

        const status =
          verifyNgoDto.ngo_status === 'approve'
            ? 'approved'
            : verifyNgoDto.ngo_status === 'reject'
            ? 'rejected'
            : verifyNgoDto.ngo_status;
        //Add Activity Log
        const logData = {
          action: 'verify',
          ngo_id: ngo._id,
          entity_name: `Verify NGO`,
          description: `NGO has been ${status} - ${result.ngo_name}`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          data: result,
        });
      } else {
        return res.json({
          success: false,
          message: mConfig.Ngo_not_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo/ngo.service.ts-verifyNgo',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api get ngo list for app
  public async homeNgoList(body: any, res: any): Promise<Ngo[]> {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'post', body);
      const userData = this.request.user;
      let geoNear = [];

      if (body.home_screen && body.home_screen == 1) {
        const setting = await this.queueService.getSetting(
          'home-screen-per-page',
        );
        body.per_page = !_.isEmpty(setting) ? Number(setting) : 20;
      }

      const query: any = {
        ngo_status: 'approve',
        is_expired: { $ne: true },
        is_deleted: { $ne: true },
      };

      if (
        !_.isUndefined(body.user_lat) &&
        body.user_lat != '' &&
        !_.isUndefined(body.user_long) &&
        body.user_long != ''
      ) {
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
              key: 'ngo_address',
              spherical: true,
            },
          },
        ];
      }

      const total = await this.ngo
        .aggregate([...geoNear, { $match: query }, { $count: 'count' }])
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
        null,
        null,
        null,
      );

      const result = await this.ngo.aggregate([
        ...geoNear,
        {
          $match: query,
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
          $unwind: {
            path: '$bookmarkData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
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
            distance: 1,
            ngo_registration_number:
              '$form_data.registration_certificate_number',
            phone_country_short_name: 1,
            first_name: '$form_data.first_name',
            last_name: '$form_data.last_name',
            ngo_phone: '$form_data.ngo_mobile_number.phoneNumber',
            ngo_phone_code: '$form_data.ngo_mobile_number.countryCodeD',
            createdAt: 1,
            ngo_location: '$ngo_address',
            country_data: 1,
            is_bookmark: {
              $cond: {
                if: { $gt: ['$bookmarkData', null] },
                then: true,
                else: false,
              },
            },
          },
        },
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
        'src/controller/ngo/ngo.service.ts-homeNgoList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
