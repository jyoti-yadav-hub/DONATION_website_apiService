/* eslint-disable prettier/prettier */
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { _ } from 'lodash';
import moment from 'moment';
import momentTimezone from 'moment-timezone';
import { Model } from 'mongoose';
import nodemailer from 'nodemailer';
import { REQUEST } from '@nestjs/core';
import {
  TransactionModel,
  TransactionDocument,
} from './entities/transaction.entity';
import {
  PaymentProcessModel,
  PaymentProcessDocument,
} from './entities/payment-process.entity';
import {
  AdminTransactionModel,
  AdminTransactionDocument,
} from './entities/admin-transaction.entity';
import {
  Category,
  CategoryDocument,
} from '../category/entities/category.entity';
import { InjectModel } from '@nestjs/mongoose';
import { ReceiptDto } from './dto/receipt-data.dto';
import {
  FeatureTransactionModel,
  FeatureTransactionDocument,
} from './entities/feature-transaction.entity';
import {
  CauseRequestModel,
  CauseRequestDocument,
} from '../request/entities/cause-request.entity';
import { hmacValidator } from '@adyen/api-library';
import { Inject, Injectable } from '@nestjs/common';
import { authConfig } from '../../config/auth.config';
import {
  Notification,
  NotificationDocument,
} from '../notification/entities/notification.entity';
import mConfig from '../../config/message.config.json';
import { StripeService } from 'src/stripe/stripe.service';
import { QueueService } from '../../common/queue.service';
import { CommonService } from '../../common/common.service';
import {
  AdminNotification,
  AdminNotificationDocument,
} from '../notification/entities/admin-notification.entity';
import { Fund, FundDocument } from '../fund/entities/fund.entity';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
import { PaymentProcessDto } from './dto/payment-process.dto';
import { GuestPaymentProcessDto } from './dto/guest-payment-process.dto';
import { PaymentSessionDto } from './dto/payment-session.dto';

import currencyConfig from '../../config/currency.config.json';
import { ErrorlogService } from '../error-log/error-log.service';
import { Client, Config, CheckoutAPI } from '@adyen/api-library';
import { User, UserDocument } from '../users/entities/user.entity';
import { TransferFinalAmountDto } from './dto/transfer-final-amount.dto';
import { PlanModel, PlanDocument } from '../plan/entities/plan.entity';
import { FeaturePaymentProcessDto } from './dto/feature-payment-process.dto';
import { CreateTransactionDetail } from './dto/create-transaction-detail.dto';
import { ResetTransactionProcessDto } from './dto/reset-transaction-process.dto';
import {
  LastDonorNotificationModel,
  LastDonorNotificationDocument,
} from './entities/notify-last-donor.entity';
import {
  CommonSetting,
  CommonSettingDocument,
} from '../setting/entities/common-setting.entity';
import { Bank, BankDocument } from '../bank/entities/bank.entity';
import { LogService } from 'src/common/log.service';
import axios from 'axios';
import ip from 'ip';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteer = require('puppeteer');
const timezone = require('country-timezone');
const { flag } = require('country-emoji');
const ObjectID = require('mongodb').ObjectID;
const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
// Adyen Node.js API library boilerplate (configuration, etc.)
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client: any = new Client({ config });
client.setEnvironment(process.env.ADYEN_ENVIRONMENT); // change to LIVE for production
const checkout = new CheckoutAPI(client);

@Injectable()
export class DonationService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly queueService: QueueService,
    private readonly stripeService: StripeService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Bank.name) private bankModel: Model<BankDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(LastDonorNotificationModel.name)
    private lastDonorNotificationModel: Model<LastDonorNotificationDocument>,
    @InjectModel(Ngo.name)
    private ngoModel: Model<NgoDocument>,
    @InjectModel(Fund.name)
    private fundModel: Model<FundDocument>,
    @InjectModel(PlanModel.name)
    private planModel: Model<PlanDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(CommonSetting.name)
    private commonSettingModel: Model<CommonSettingDocument>,
    @InjectModel(TransactionModel.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(CauseRequestModel.name)
    private causeRequestModel: Model<CauseRequestDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(AdminNotification.name)
    private adminNotificationModel: Model<AdminNotificationDocument>,
    @InjectModel(PaymentProcessModel.name)
    private paymentProcessModel: Model<PaymentProcessDocument>,
    @InjectModel(AdminTransactionModel.name)
    private adminTransactionModel: Model<AdminTransactionDocument>,
    @InjectModel(FeatureTransactionModel.name)
    private featureTransactionModel: Model<FeatureTransactionDocument>,
  ) {}

  //Api for send receipt in email
  public async sendReceipt(receiptDto: ReceiptDto, res: any): Promise<[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        receiptDto,
      );
      const user = await this.userModel
        .findOne({ _id: ObjectID(receiptDto.user_id), is_deleted: false })
        .select({ _id: 1, email: 1, time_zone: 1 })
        .lean();

      if (user) {
        let modelName: any =
          receiptDto.transaction_type &&
          receiptDto.transaction_type === 'featured-transaction'
            ? this.featureTransactionModel
            : this.transactionModel;
        const transactionDetail: any = await modelName
          .findOne({
            _id: receiptDto.transaction_id,
          })
          .select({ resp: 0, updatedAt: 0 })
          .lean();
        if (!_.isEmpty(transactionDetail)) {
          const [
            userData,
            saayamContact,
            saayamEmail,
            amountInWords,
            totalAmountInWords,
          ] = await Promise.all([
            //Get user detail
            this.commonService.getTransactionUser(
              transactionDetail,
              transactionDetail.user_id,
              transactionDetail.is_user_ngo,
            ),
            //Get specific slug setting doc
            this.queueService.getSetting('saayam-contact-no'),
            //Get specific slug setting doc
            this.queueService.getSetting('saayam-email'),
            //Get formated currency
            this.commonService.withDecimalNew(
              transactionDetail?.amount,
              transactionDetail?.country_data?.currency_code,
            ),
            //Get formated currency
            this.commonService.withDecimalNew(
              transactionDetail?.total_amount,
              transactionDetail?.country_data?.currency_code,
            ),
          ]);
          const htmlData = {
            '{{donor_name}}':
              transactionDetail?.donor_name ||
              transactionDetail?.user_name ||
              'Donor',
            '{{ngo_name}}': userData?.user_name || 'NGO',
            '{{ngo_address}}': userData?.location?.city || '',
            '{{ngo_phone}}':
              flag(userData?.phone_country_short_name) +
                ' ' +
                userData?.phone_code +
                ' ' +
                userData?.phone || '',
            '{{reciept_id}}': transactionDetail?.receipt_number || '-',
            '{{tax_id}}': transactionDetail?.tax_number || '-',
            '{{request_id}}':
              transactionDetail?.request_id ||
              transactionDetail?.to_fund_id ||
              '-',
            '{{receipt_date}}': momentTimezone(new Date())
              .tz(user.time_zone)
              .format('DD/MMM/YYYY'),
            '{{created_at}}':
              momentTimezone(transactionDetail?.createdAt)
                .tz(user.time_zone)
                .format('DD/MMM/YYYY') || '-',
            '{{transaction_date}}':
              momentTimezone(transactionDetail?.createdAt)
                .tz(user.time_zone)
                .format('DD/MMM/YYYY') || '',
            '{{transaction_id}}': transactionDetail?._id || '-',
            '{{payment_method}}':
              transactionDetail?.paymentMethod?.charAt(0).toUpperCase() +
                transactionDetail?.paymentMethod?.slice(1) || 'Visa',
            '{{amount_paid}}':
              transactionDetail?.currency +
                transactionDetail?.amount?.toFixed(2) || '-',
            '{{amount_in_words}}': amountInWords || '-',
            '{{service_fee}}':
              transactionDetail?.currency +
                transactionDetail?.tip_amount?.toFixed(2) || '-',
            '{{total_amount}}':
              transactionDetail?.currency +
                transactionDetail?.total_amount?.toFixed(2) || '-',
            '{{total_amount_in_words}}': totalAmountInWords || '-',
            '{{cause}}': transactionDetail?.category_name || '-',
            '{{goal_amount}}': transactionDetail?.goal_amount
              ? transactionDetail?.currency +
                transactionDetail?.goal_amount?.toFixed(2)
              : '-',
            '{{fundraiser_name}}': transactionDetail?.campaign_name || '-',
            '{{saayam_number}}':
              flag('US') + ' ' + saayamContact ||
              flag('US') + ' ' + authConfig.getSaayamContact,
            '{{saayam_mail}}': saayamEmail || authConfig.getSaayamEmail,
            '{{donor_location}}': userData?.location?.city || '-',
            '{{donor_phone}}':
              userData?.phone_code + ' ' + userData?.phone || '-',
            '{{plan_name}}': transactionDetail?.plan?.title || '-',
            '{{plan_id}}': transactionDetail?.plan?._id || '-',
            '{{plan_duration}}':
              transactionDetail?.plan?.duration +
                ' ' +
                transactionDetail?.plan?.duration_type || '-',
            '{{plan_amount}}': transactionDetail?.plan?.amount || '-',
            '{{plan_final_amount}}': transactionDetail?.amount || '-',
            '{{grand_total}}': transactionDetail?.amount || '-',
            '{{payment_type}}':
              transactionDetail?.paymentMethod
                ?.charAt(0)
                .toUpperCase()
                .slice(1) || 'VISA',
            '{{transaction_fee}}':
              transactionDetail?.currency +
                transactionDetail.transaction_amount?.toFixed(2) || '-',
            '{{manage_fees}}':
              transactionDetail?.manage_fees?.charAt(0).toUpperCase() +
                transactionDetail?.manage_fees?.slice(1) || '-',
            '{{note}}': transactionDetail.note || '-',
          };

          const htmlContent = await this.commonService.getPDFHtml(
            transactionDetail.transaction_type,
            htmlData,
          );

          if (htmlContent && htmlContent?.success == false) {
            return res.json({
              message: mConfig.Email_Template_disabled,
              success: false,
            });
          }

          const fileName = parseInt(moment().format('X')) + '-.pdf';

          const locateFile = './uploads/temp/' + fileName;

          const options = {
            format: 'A3',
            orientation: 'portrait',
            phantomArgs: ['--ignore-ssl-errors=yes'],
          };
          //send receipt in email
          const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
          });
          // Generate the PDF and save it to the specified path
          const page = await browser.newPage();
          await page.setContent(htmlContent);
          await page.pdf({
            path: locateFile,
            printBackground: true,
            options,
          });
          await browser.close();
          // Check if the request is for downloading the PDF
          if (
            !_.isUndefined(receiptDto.is_download) &&
            receiptDto.is_download
          ) {
            const url = authConfig.downloadPdfUrl + fileName;
            return res.json({
              success: true,
              url,
            });
          } else {
            // Prepare and send an email with the generated PDF attached
            if (user.email && !_.isEmpty(user.email)) {
              const transporter = nodemailer.createTransport({
                // service: 'gmail',
                host: 'us2.smtp.mailhostbox.com',
                port: 587,
                // secure: true,
                requireTLS: true,
                auth: {
                  user: 'info@saayam.com',
                  pass: 'hB$)jXv6',
                },
              });

              const msg =
                'Dear Donor, Thank you for your great generosity!  We greatly appreciate your donation and your sacrifice. Your support is invaluable to us, thank you again!';

              const mailOptions = {
                from: {
                  name: 'Saayam Team',
                  address: 'info@saayam.com',
                },
                to: user.email,
                subject: 'Payment Reciept',
                text: msg,
                // html: EmailMsg
                attachments: [
                  {
                    filename: fileName,
                    path: locateFile,
                    contentType: 'application/pdf',
                  },
                ],
              };
              const newThis = this;
              transporter.sendMail(mailOptions, async function (error, info) {
                if (error) {
                  await newThis.commonService.addSmtpLog(
                    mailOptions,
                    error,
                    newThis.request.originalUrl,
                    false,
                  );
                  return res.json({
                    success: false,
                    message: mConfig.Something_went_wrong,
                  });
                } else {
                  await newThis.commonService.addSmtpLog(
                    mailOptions,
                    info,
                    newThis.request.originalUrl,
                    true,
                  );
                  return res.json({
                    success: true,
                    message: mConfig.Email_send_successfully,
                  });
                }
              });
              // });
            } else {
              return res.json({
                success: false,
                message: mConfig.Add_email,
              });
            }
          }
        } else {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.User_not_found,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-sendReceipt',
        receiptDto,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for add entry in payment process table before donation
  public async paymentProcess(paymentProcessDto: PaymentProcessDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        paymentProcessDto,
      );
      const userData = this.request.user;
      let modelName: any;
      let insertData;
      let select;
      if (paymentProcessDto.transaction_type === 'donation') {
        modelName = this.causeRequestModel;
        select = {
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          'form_data.remaining_amount': 1,
        };
      } else if (paymentProcessDto.transaction_type === 'ngo-donation') {
        modelName = this.ngoModel;
        select = { _id: 1, ngo_name: '$form_data.ngo_name' };
      }
      const data = await modelName
        .findById({ _id: paymentProcessDto.id })
        .select(select)
        .lean();
      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        if (
          paymentProcessDto.transaction_type === 'donation' &&
          data.status == 'expired'
        ) {
          return res.json({
            success: false,
            message: mConfig.Request_expired,
          });
        }
        const country = userData.country_data.country;
        const findSetting = await this.commonService.getCommonSetting(country);
        let serviceFee;
        let transactionFee;
        let manageFees;
        let paymentGateway = process.env.DEFAULT_PAYMENT_GATEWAY || 'aauti';
        // Check if settings are found and set fee-related variables
        if (!_.isEmpty(findSetting)) {
          serviceFee = Number(findSetting.form_data.service_fee);
          transactionFee = Number(findSetting.form_data.transaction_fee);
          manageFees = findSetting.form_data.manage_fees;
          paymentGateway = findSetting.form_data.payment_gateway;
        }
        // Determine if the tip amount is included in the total
        const fixedAmount = Number(paymentProcessDto.amount.toFixed(10));
        let tipAmount = 0;
        let tipCharge = 0;
        let transactionAmount = 0;
        let transactionCharge = 0;
        let totalAmount = fixedAmount;
        let tipIncluded = false;
        let actualAmount = 0;
        // Handle different scenarios based on the presence of fees
        if (
          serviceFee >= 0 &&
          !_.isUndefined(serviceFee) &&
          transactionFee >= 0 &&
          !_.isUndefined(transactionFee)
        ) {
          if (paymentProcessDto.service_charge !== serviceFee) {
            const updateData1 = {
              '{{type}}': 'service',
              '{{service_charge}}': paymentProcessDto.service_charge,
              '{{value}}': serviceFee,
            };
            const msg1 = await this.commonService.changeString(
              mConfig.Sayaam_changed_charges,
              updateData1,
            );
            return res.json({
              message: msg1,
              serviceChargeError: true,
              success: false,
            });
          } else if (paymentProcessDto.transaction_charge !== transactionFee) {
            const updateData1 = {
              '{{type}}': 'transaction',
              '{{service_charge}}': paymentProcessDto.transaction_charge,
              '{{value}}': transactionFee,
            };
            const msg1 = await this.commonService.changeString(
              mConfig.Sayaam_changed_charges,
              updateData1,
            );
            return res.json({
              message: msg1,
              serviceChargeError: true,
              success: false,
            });
          } else {
            tipCharge = serviceFee;
            transactionCharge = transactionFee;
            tipAmount = Number(((tipCharge / 100) * fixedAmount).toFixed(10));
            transactionAmount = Number(
              ((transactionCharge / 100) * fixedAmount).toFixed(10),
            );
            if (manageFees === 'exclude') {
              totalAmount += Number(tipAmount) + Number(transactionAmount);
              actualAmount = fixedAmount;
            } else if (manageFees === 'include') {
              actualAmount =
                fixedAmount - Number(tipAmount) - Number(transactionAmount);
            }
            tipIncluded = true;
          }
        } else {
          return res.json({
            message: mConfig.Sayaam_removed_service_charges,
            serviceChargeError: true,
            success: false,
          });
        }
        const stripeId = await this.stripeService.stripeUserId(userData);
        const countryData = {
          country: userData.country_data.country,
          country_code: userData.country_data.country_code,
          currency: paymentProcessDto.currency,
          currency_code: paymentProcessDto.currency_code,
        };
        let exchange_rate = paymentProcessDto.exchange_rate
          ? paymentProcessDto.exchange_rate
          : 1;
        if (paymentProcessDto.transaction_type === 'donation') {
          if (Number(data.form_data.remaining_amount) > 0) {
            insertData = {
              user_id: userData._id,
              request_id: paymentProcessDto.id,
              amount: actualAmount.toFixed(10),
              is_contribute_anonymously:
                paymentProcessDto.is_contribute_anonymously,
              is_tax_benefit: paymentProcessDto.is_tax_benefit,
              tax_number: paymentProcessDto.tax_number,
              active_type: paymentProcessDto.active_type,
              transaction_type: paymentProcessDto.transaction_type,
              country_data: countryData,
              tip_included: tipIncluded,
              tip_charge: tipCharge,
              tip_amount: tipAmount,
              transaction_charge: transactionCharge,
              transaction_amount: transactionAmount,
              total_amount: totalAmount.toFixed(10),
              payment_gateway: paymentGateway,
              title_of_fundraiser: data.form_data.title_of_fundraiser,
              stripe_customer_id: stripeId,
              note: paymentProcessDto.note,
              manage_fees: manageFees,
              currency_code: countryData.currency_code,
              amount_usd: paymentProcessDto.amount_usd
                ? paymentProcessDto.amount_usd
                : null,
              exchange_rate: paymentProcessDto.exchange_rate
                ? paymentProcessDto.exchange_rate
                : 1,
            };
            insertData.converted_total_amt = totalAmount * exchange_rate;
            insertData.converted_amt = actualAmount * exchange_rate;
          } else {
            return res.json({
              limitExceeded: true,
              success: false,
            });
          }
        } else if (paymentProcessDto.transaction_type === 'ngo-donation') {
          insertData = {
            user_id: userData._id,
            ngo_id: paymentProcessDto.id,
            amount: actualAmount.toFixed(10),
            is_contribute_anonymously:
              paymentProcessDto.is_contribute_anonymously,
            is_tax_benefit: paymentProcessDto.is_tax_benefit,
            tax_number: paymentProcessDto.tax_number,
            active_type: paymentProcessDto.active_type,
            transaction_type: paymentProcessDto.transaction_type,
            country_data: countryData,
            tip_included: tipIncluded,
            tip_charge: tipCharge,
            tip_amount: tipAmount,
            transaction_charge: transactionCharge,
            transaction_amount: transactionAmount,
            total_amount: totalAmount.toFixed(10),
            payment_gateway: paymentGateway,
            title_of_fundraiser: data?.form_data?.ngo_name,
            stripe_customer_id: stripeId,
            note: paymentProcessDto.note,
            manage_fees: manageFees,
            currency_code: countryData.currency_code,
            amount_usd: paymentProcessDto.amount_usd
              ? paymentProcessDto.amount_usd
              : null,
            exchange_rate: exchange_rate,
          };
          insertData.converted_total_amt = totalAmount * exchange_rate;
          insertData.converted_amt = actualAmount * exchange_rate;
        }
        if (countryData.currency_code == 'USD') {
          insertData.amount_usd = actualAmount.toFixed(10);
        }
        if (
          paymentProcessDto.active_type == 'corporate' &&
          (userData.is_corporate || userData.is_corporate_user)
        ) {
          insertData.corporate_id = userData.corporate_data._id;
        }
        const createData = await new this.paymentProcessModel(insertData);
        const newRequest: any = await createData.save();
        if (_.isEmpty(newRequest)) {
          return res.json({
            message: mConfig.Please_try_again,
            success: false,
          });
        } else {
          let aautiPaymentStatus = false;
          if (paymentGateway === 'aauti') {
            aautiPaymentStatus =
              await this.commonService.checkAautiPaymentStatus();
          }
          return res.json({
            success: true,
            data: newRequest,
            aautiPayment: aautiPaymentStatus,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-paymentProcess',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for add entry in payment process table before donation for guest user
  public async guestPaymentProcess(
    guestPaymentProcessDto: GuestPaymentProcessDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        guestPaymentProcessDto,
      );
      let userData = await this.userModel
        .findOne({
          phone_code: guestPaymentProcessDto.phone_code,
          phone: guestPaymentProcessDto.phone,
          is_deleted: false,
        })
        .select({
          _id: 1,
          country_data: 1,
          stripe_customer_id: 1,
          first_name: 1,
          last_name: 1,
          email: 1,
          phone: 1,
        })
        .lean();
      if (_.isEmpty(userData)) {
        if (!guestPaymentProcessDto?.city) {
          const ipAddress = ip.address();
          const locationObj: any = await this.commonService.getIpLocation(
            ipAddress,
          );
          if (locationObj?.city && !_.isEmpty(locationObj?.city)) {
            guestPaymentProcessDto.city = locationObj?.city;
            guestPaymentProcessDto.latitude = locationObj?.latitude;
            guestPaymentProcessDto.longitude = locationObj?.longitude;
            guestPaymentProcessDto.country_name = locationObj?.country_name;
          } else {
            guestPaymentProcessDto.city = 'N/A';
          }
        } else {
          guestPaymentProcessDto.city = 'N/A';
        }
        const latitude = Number(guestPaymentProcessDto.latitude);
        const longitude = Number(guestPaymentProcessDto.longitude);
        // Add code for no country found.
        const country = guestPaymentProcessDto.country_name;
        const countryData = await this.commonService.getCountry(country);
        const timezonesName = await this.commonService.getTimezoneFromLatLon(
          latitude,
          longitude,
        );
        const query: any = {
          $or: [{ countries: country }, { countries: { $eq: { $size: 0 } } }],
          is_category_active: 'active',
        };
        const categories = await this.categoryModel
          .distinct('category_slug', query)
          .lean();
        const dtl: any = {
          first_name: guestPaymentProcessDto.name,
          display_name: guestPaymentProcessDto.name,
          phone_code: guestPaymentProcessDto.phone_code,
          phone: guestPaymentProcessDto.phone,
          phone_country_full_name:
            guestPaymentProcessDto.phone_country_full_name,
          phone_country_short_name:
            guestPaymentProcessDto.phone_country_short_name,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
            city: guestPaymentProcessDto.city,
          },
          country_data: countryData ? countryData : null,
          default_country: country,
          time_zone: timezonesName,
          is_donor: true,
          my_causes: categories,
        };
        const createUser = new this.userModel(dtl);
        userData = await createUser.save();
        if (_.isEmpty(userData)) {
          return res.json({
            success: false,
            message: mConfig.Invalid,
          });
        }
      }
      let modelName: any;
      let select;
      let query: any = { _id: ObjectID(guestPaymentProcessDto.id) };
      if (guestPaymentProcessDto.transaction_type === 'donation') {
        modelName = this.causeRequestModel;
        select = {
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          'form_data.remaining_amount': 1,
          country_data: 1,
        };
      } else if (guestPaymentProcessDto.transaction_type === 'ngo-donation') {
        modelName = this.ngoModel;
        select = { _id: 1, ngo_name: '$form_data.ngo_name', country_data: 1 };
      } else if (guestPaymentProcessDto.transaction_type === 'fund-received') {
        modelName = this.fundModel;
        select = {
          _id: 1,
          'form_data.title_of_fundraiser': 1,
          country_data: 1,
        };
        query = {
          _id: ObjectID(guestPaymentProcessDto.id),
          status: 'approve',
          is_deleted: { $ne: true },
        };
      }
      const data = await modelName.findOne(query).select(select).lean();
      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const country = data.country_data.country;
        const findSetting = await this.commonService.getCommonSetting(country);
        let serviceFee;
        let transactionFee;
        let manageFees;
        let paymentGateway = process.env.DEFAULT_PAYMENT_GATEWAY || 'aauti';
        if (!_.isEmpty(findSetting)) {
          serviceFee = Number(findSetting.form_data.service_fee);
          transactionFee = Number(findSetting.form_data.transaction_fee);
          manageFees = findSetting.form_data.manage_fees;
          paymentGateway = findSetting.form_data.payment_gateway;
        }
        const fixedAmount = Number(guestPaymentProcessDto.amount.toFixed(10));
        let tipAmount = 0;
        let tipCharge = 0;
        let transactionAmount = 0;
        let transactionCharge = 0;
        let totalAmount = fixedAmount;
        let tipIncluded = false;
        let actualAmount = 0;
        if (
          serviceFee >= 0 &&
          !_.isUndefined(serviceFee) &&
          transactionFee >= 0 &&
          !_.isUndefined(transactionFee)
        ) {
          if (guestPaymentProcessDto.service_charge !== serviceFee) {
            const updateData1 = {
              '{{type}}': 'service',
              '{{service_charge}}': guestPaymentProcessDto.service_charge,
              '{{value}}': serviceFee,
            };
            const msg1 = await this.commonService.changeString(
              mConfig.Sayaam_changed_charges,
              updateData1,
            );
            return res.json({
              message: msg1,
              serviceChargeError: true,
              success: false,
            });
          } else if (
            guestPaymentProcessDto.transaction_charge !== transactionFee
          ) {
            const updateData1 = {
              '{{type}}': 'transaction',
              '{{service_charge}}': guestPaymentProcessDto.transaction_charge,
              '{{value}}': transactionFee,
            };
            const msg1 = await this.commonService.changeString(
              mConfig.Sayaam_changed_charges,
              updateData1,
            );
            return res.json({
              message: msg1,
              serviceChargeError: true,
              success: false,
            });
          } else {
            tipCharge = serviceFee;
            transactionCharge = transactionFee;
            tipAmount = Number(((tipCharge / 100) * fixedAmount).toFixed(10));
            transactionAmount = Number(
              ((transactionCharge / 100) * fixedAmount).toFixed(10),
            );
            if (manageFees === 'exclude') {
              totalAmount += Number(tipAmount) + Number(transactionAmount);
              actualAmount = fixedAmount;
            } else if (manageFees === 'include') {
              actualAmount =
                fixedAmount - Number(tipAmount) - Number(transactionAmount);
            }
            tipIncluded = true;
          }
        } else {
          return res.json({
            message: mConfig.Sayaam_removed_service_charges,
            serviceChargeError: true,
            success: false,
          });
        }
        const stripeId = await this.stripeService.stripeUserId(userData);
        const countryData = {
          country: data.country_data.country,
          country_code: data.country_data.country_code,
          currency: guestPaymentProcessDto.currency,
          currency_code: guestPaymentProcessDto.currency_code,
        };
        const exchange_rate = guestPaymentProcessDto.exchange_rate
          ? guestPaymentProcessDto.exchange_rate
          : 1;
        const insertData: any = {
          user_id: userData._id,
          amount: actualAmount.toFixed(10),
          is_contribute_anonymously:
            guestPaymentProcessDto.is_contribute_anonymously,
          is_tax_benefit: guestPaymentProcessDto.is_tax_benefit,
          tax_number: guestPaymentProcessDto.tax_number,
          active_type: 'guest',
          transaction_type: guestPaymentProcessDto.transaction_type,
          country_data: countryData,
          tip_included: tipIncluded,
          tip_charge: tipCharge,
          tip_amount: tipAmount,
          transaction_charge: transactionCharge,
          transaction_amount: transactionAmount,
          total_amount: totalAmount.toFixed(10),
          payment_gateway: paymentGateway,
          stripe_customer_id: stripeId,
          note: guestPaymentProcessDto.note,
          manage_fees: manageFees,
          currency_code: countryData.currency_code,
          amount_usd: guestPaymentProcessDto.amount_usd
            ? guestPaymentProcessDto.amount_usd
            : null,
          exchange_rate: exchange_rate,
          converted_total_amt: totalAmount * exchange_rate,
          converted_amt: actualAmount * exchange_rate,
          guest_name: guestPaymentProcessDto.name,
        };
        if (guestPaymentProcessDto.transaction_type === 'donation') {
          if (Number(data.form_data.remaining_amount) > 0) {
            insertData.request_id = guestPaymentProcessDto.id;
            insertData.title_of_fundraiser = data.form_data.title_of_fundraiser;
          } else {
            return res.json({
              limitExceeded: true,
              success: false,
            });
          }
        } else if (guestPaymentProcessDto.transaction_type === 'ngo-donation') {
          insertData.ngo_id = guestPaymentProcessDto.id;
          insertData.title_of_fundraiser = data?.form_data?.ngo_name;
        } else if (
          guestPaymentProcessDto.transaction_type === 'fund-received'
        ) {
          insertData.fund_id = guestPaymentProcessDto.id;
          insertData.title_of_fundraiser = data.form_data.title_of_fundraiser;
        }
        if (countryData.currency_code == 'USD') {
          insertData.amount_usd = actualAmount.toFixed(10);
        }
        const createData = await new this.paymentProcessModel(insertData);
        const newRequest: any = await createData.save();
        if (_.isEmpty(newRequest)) {
          return res.json({
            message: mConfig.Please_try_again,
            success: false,
          });
        } else {
          let aautiPaymentStatus = false;
          if (paymentGateway === 'aauti') {
            aautiPaymentStatus =
              await this.commonService.checkAautiPaymentStatus();
          }
          return res.json({
            success: true,
            data: newRequest,
            user_id: userData._id,
            aautiPayment: aautiPaymentStatus,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-guestPaymentProcess',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for payment for feature request
  public async featurePaymentProcess(
    featurePaymentProcessDto: FeaturePaymentProcessDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        featurePaymentProcessDto,
      );
      const causeRequest: any = await this.causeRequestModel
        .findById({ _id: featurePaymentProcessDto.request_id })
        .select({ _id: 1, country_data: 1 })
        .lean();
      if (!causeRequest) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const findPlan = await this.planModel
          .findOne({ _id: featurePaymentProcessDto.plan_id })
          .select({
            _id: 1,
            title: 1,
            amount: 1,
            duration: 1,
            duration_type: 1,
          })
          .lean();
        if (!findPlan) {
          return res.json({
            message: mConfig.Plan_not_found,
            success: false,
          });
        } else {
          const plan_detail = {
            _id: findPlan._id,
            title: findPlan.title,
            amount: findPlan.amount,
            duration: findPlan.duration,
            duration_type: findPlan.duration_type,
          };
          const insertData = {
            user_id: this.request.user._id,
            request_id: featurePaymentProcessDto.request_id,
            plan: plan_detail,
            transaction_type: 'featured-transaction',
            country_data: causeRequest.country_data,
          };
          const createData = await new this.paymentProcessModel(insertData);
          const newRequest: any = await createData.save();
          if (_.isEmpty(newRequest)) {
            return res.json({
              message: mConfig.Please_try_again,
              success: false,
            });
          } else {
            return res.json({ success: true, data: newRequest });
          }
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-featurePaymentProcess',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for create transaction detail
  public async createSession(paymentSessionDto: PaymentSessionDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        paymentSessionDto,
      );
      const paymentProcess: any = await this.paymentProcessModel
        .findById({ _id: paymentSessionDto.payment_id })
        .select({
          _id: 1,
          transaction_type: 1,
          'plan.amount': 1,
          total_amount: 1,
          country_data: 1,
        })
        .lean();
      if (!paymentProcess) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let value =
          paymentProcess.transaction_type === 'featured-transaction'
            ? paymentProcess.plan.amount
            : paymentProcess.total_amount;
        const currency_code = paymentProcess.country_data.currency_code;
        const minorUnits = currencyConfig[currency_code]
          ? currencyConfig[currency_code]
          : 100;
        const response = await checkout.sessions({
          additionalData: {
            'riskdata.skipRisk': 'true',
          },
          amount: {
            currency: paymentProcess.country_data.currency_code,
            value: value * minorUnits, //if plan then take plan amount
          },
          countryCode: paymentProcess.country_data.country_code,
          merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT, // required
          reference: paymentProcess._id,
          returnUrl: `${this.request.get(
            'origin',
          )}/api/handleShopperRedirect?orderRef=${paymentProcess._id}`, // set redirect URL required for some payment methods
        });
        await this.paymentProcessModel
          .updateOne({ _id: paymentProcess._id }, { $set: { response } })
          .lean();
        return res.json(response);
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-createSession',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // API for handle adyen webhook notification
  public async makeDonation(
    transactionData: any,
    notificationRequest,
    paymentGateway,
  ) {
    try {
      const causeRequest: any = await this.causeRequestModel
        .findById({ _id: transactionData.request_id })
        .select({
          _id: 1,
          user_ngo_id: 1,
          user_id: 1,
          uname: 1,
          'form_data.goal_amount': 1,
          'form_data.title_of_fundraiser': 1,
          category_slug: 1,
          total_donation: 1,
          total_donors: 1,
          status: 1,
          country_data: 1,
          reference_id: 1,
        })
        .lean();

      if (!causeRequest) {
        return {
          message: mConfig.No_data_found,
          success: false,
        };
      } else {
        if (
          (notificationRequest.eventCode === 'AUTHORISATION' &&
            notificationRequest.success === true) ||
          notificationRequest.type === 'checkout.session.completed'
        ) {
          //add donation data in donation table

          let userId;
          let uName;
          if (causeRequest.user_ngo_id) {
            const ngoData = await this.ngoModel
              .findOne({ _id: ObjectID(causeRequest.user_ngo_id) })
              .select({ ngo_name: '$form_data.ngo_name' })
              .lean();

            userId = causeRequest.user_ngo_id;
            uName = ngoData?.ngo_name;
          } else {
            userId = causeRequest.user_id;
            uName = causeRequest.uname;
          }

          const userDetail = await this.userModel
            .findById({ _id: transactionData.user_id })
            .select({
              _id: 1,
              ngo_data: 1,
              display_name: 1,
              first_name: 1,
              last_name: 1,
            })
            .lean();

          const addDonation: any = {
            user_id: userId,
            user_name: uName,
            active_type: transactionData.active_type,
            country_data: transactionData.country_data,
            donor_id:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data._id
                : userDetail._id,
            donor_user_id: userDetail._id,
            donor_name:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data.ngo_name
                : userDetail.display_name
                ? userDetail.display_name
                : userDetail.first_name + ' ' + userDetail.last_name,
            request_id: causeRequest._id,
            amount: transactionData.amount,
            currency: transactionData.country_data.currency,
            is_contribute_anonymously: transactionData.is_contribute_anonymously
              ? transactionData.is_contribute_anonymously
              : false,
            is_tax_benefit: transactionData.is_tax_benefit
              ? transactionData.is_tax_benefit
              : false,
            tax_number: transactionData.tax_number,
            note: transactionData.note,
            receipt_number: await this.commonService.nextReceiptNum(
              userDetail._id,
            ),
            transaction_type: 'donation',
            goal_amount: causeRequest.form_data.goal_amount,
            resp: notificationRequest,
            is_user_ngo: causeRequest.user_ngo_id ? true : false,
            is_donor_ngo: transactionData.active_type === 'ngo' ? true : false,
            tip_included: transactionData.tip_included,
            tip_charge: transactionData.tip_charge,
            tip_amount: transactionData.tip_amount,
            transaction_charge: transactionData.transaction_charge,
            transaction_amount: transactionData.transaction_amount,
            total_amount: transactionData.total_amount,
            campaign_name: causeRequest.form_data.title_of_fundraiser,
            payment_status: 'completed',
            manage_fees: transactionData.manage_fees,
            amount_usd: transactionData.amount_usd,
            converted_amt: transactionData.converted_amt,
            converted_total_amt: transactionData.converted_total_amt,
            exchange_rate: transactionData.exchange_rate,
            currency_code: transactionData.currency_code,
            corporate_id: transactionData.corporate_id,
          };

          if (paymentGateway === 'adyen') {
            addDonation.eventCode = notificationRequest.eventCode;
            addDonation.success = notificationRequest.success;
            addDonation.pspReference = notificationRequest.pspReference;
            addDonation.paymentMethod = notificationRequest.paymentMethod;
            addDonation.reference_id = notificationRequest.merchantReference;
          } else if (paymentGateway === 'stripe') {
            const session = notificationRequest.data.object;
            addDonation.status = session.status;
            addDonation.paymentMethod = session.payment_method_types[0];
            addDonation.reference_id = session.client_reference_id;
          }

          const categoryDetail: any = await this.categoryModel
            .findOne({ category_slug: causeRequest.category_slug })
            .select({ _id: 1, name: 1, category_slug: 1 });
          if (categoryDetail) {
            addDonation.category_id = categoryDetail._id;
            addDonation.category_name = categoryDetail.name;
            addDonation.category_slug = categoryDetail.category_slug;
          }

          //save new request
          const createData = new this.transactionModel(addDonation);
          const newTransaction: any = await createData.save();

          if (_.isEmpty(newTransaction)) {
            return {
              message: mConfig.Please_try_again,
              success: false,
            };
          } else {
            //update total_donation,total_donors,avg_donation and return with funded_in_days
            let newTransactionAmount = newTransaction.amount;
            if (
              transactionData.country_data.currency_code !=
              causeRequest.country_data.currency_code
            ) {
              let result = await this.commonService.getExchangeRate(
                transactionData.country_data.currency_code,
                causeRequest.country_data.currency_code,
                newTransaction.amount,
              );
              if (result['status'] == true) {
                newTransactionAmount = result['amount'];
              }
            }
            const totalDonation =
              Number(causeRequest.total_donation) +
              Number(newTransactionAmount);
            const goalAmount = Number(causeRequest.form_data.goal_amount);
            const avgDonation: any =
              totalDonation >= goalAmount
                ? 100
                : (totalDonation / goalAmount) * 100;
            const remainingAmount =
              totalDonation >= goalAmount ? 0 : goalAmount - totalDonation;
            const updateData: any = {
              $set: {
                total_donation: totalDonation,
                total_donors: Number(causeRequest.total_donors) + 1,
                avg_donation: parseInt(avgDonation),
                'form_data.remaining_amount': Number(remainingAmount),
                status:
                  totalDonation >= goalAmount
                    ? 'complete'
                    : causeRequest.status,
              },
            };

            const findSetting = await this.commonService.getCommonSetting(
              causeRequest.country_data.country,
            );

            if (
              findSetting &&
              findSetting.form_data.minimum_donation &&
              findSetting.form_data.minimum_donation > remainingAmount
            ) {
              const createData = {
                user_id: transactionData.user_id,
                request_id: transactionData.request_id,
                next_date: new Date(moment().add(1, 'hour').format()),
              };

              const createLastDonor = new this.lastDonorNotificationModel(
                createData,
              );
              await createLastDonor.save();
            }

            const data: any = await this.causeRequestModel
              .findByIdAndUpdate({ _id: causeRequest._id }, updateData, {
                new: true,
              })
              .select({ form_settings: 0 })
              .lean();

            const input: any = {
              title: mConfig.noti_title_Payment_was_successful,
              type: causeRequest.category_slug,
              requestId: causeRequest._id,
              categorySlug: causeRequest.category_slug,
              requestUserId: causeRequest.user_id,
            };

            const updateData1 = {
              '{{donor_name}}': newTransaction.donor_name,
              '{{amount}}':
                newTransaction.country_data &&
                newTransaction.country_data.country == 'India'
                  ? newTransaction.total_amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : newTransaction.total_amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
              '{{user_name}}': causeRequest?.form_data?.title_of_fundraiser,
              '{{currency_symbol}}': newTransaction.currency,
              '{{refId}}': causeRequest.reference_id,
              '{{category}}': newTransaction.category_name,
            };

            const msg1 = await this.commonService.changeString(
              mConfig.noti_msg_donate_amount,
              updateData1,
            );
            //send notification to donor
            const removeNotiIds = [userDetail._id];
            input.message = msg1;
            input.userId = userDetail._id;
            await this.commonService.notification(input);

            //send notification to trustee of donor ngo
            if (newTransaction.is_donor_ngo) {
              const notiUser = await this.commonService.getNgoUserIds(
                newTransaction.donor_id,
                userDetail._id,
              );
              if (notiUser) {
                const msg2 = await this.commonService.changeString(
                  mConfig.noti_msg_ngo_transfer_amount,
                  updateData1,
                );
                input.message = msg2;
                input.userId = notiUser;
                await this.commonService.notification(input);
              }
            }

            //send notification to user
            if (
              !removeNotiIds
                .map((s) => s.toString())
                .includes(causeRequest.user_id.toString())
            ) {
              const donate_my_request = await this.commonService.changeString(
                mConfig.noti_msg_donate_my_request,
                updateData1,
              );
              input.message = donate_my_request;
              input.userId = causeRequest.user_id;
              await this.commonService.notification(input);
            }
            // send notification to Benificiary
            const notiIds = [causeRequest.user_id];
            if (newTransaction.is_user_ngo) {
              const notiUser = await this.commonService.getNgoUserIds(
                causeRequest.user_ngo_id,
                causeRequest.user_id,
              );
              if (
                notiUser &&
                !removeNotiIds
                  .map((s) => s.toString())
                  .includes(notiUser.toString())
              ) {
                const msg3 = await this.commonService.changeString(
                  mConfig.noti_msg_donor_donate_you,
                  updateData1,
                );
                notiIds.push(notiUser);
                input.userId = notiUser;
                input.message = msg3;
                removeNotiIds.push(notiUser);
                this.commonService.notification(input);
              }
            }

            //send notification all auti users
            const msg4 = await this.commonService.changeString(
              mConfig.noti_msg_donor_amount_transfer_to_user,
              updateData1,
            );
            input.message = msg4;
            this.commonService.sendAllUsersNotification(
              removeNotiIds,
              input,
              causeRequest.country_data.country,
              true,
            );

            if (data.status != 'complete') {
              //send notification to admin
              await this.commonService.sendAdminNotification(input);
            }

            if (data.status === 'complete') {
              await this.notificationModel
                .deleteMany({ request_id: causeRequest._id })
                .lean();

              await this.adminNotificationModel
                .deleteMany({ request_id: causeRequest._id })
                .lean();

              const updateData2 = {
                '{{refId}}': data.reference_id,
                '{{total_donation}}': data.total_donation,
                '{{category}}': data.category_name,
              };

              const msg5 = await this.commonService.changeString(
                mConfig.noti_msg_admin_request_fullfill,
                updateData2,
              );

              //send notification to admin
              input.message = msg5;
              await this.commonService.sendAdminNotification(input);

              // send notification to Benificiary
              const msg6 = await this.commonService.changeString(
                mConfig.noti_msg_user_request_fullfill,
                {
                  '{{category}}': data.category_name,
                  '{{refId}}': data.reference_id,
                },
              );
              input.message = msg6;
              await this.commonService.sendAllNotification(notiIds, input);

              //send notification to volunteer
              // type='fundraiser-complete'
            }

            data.transactionData = newTransaction;
            return {
              message: mConfig.transaction_success,
              data,
              success: true,
            };
          }
        } else {
          const input: any = {
            title: mConfig.noti_title_payment_failed,
            type: 'payment_failed_makeDonation',
            requestId: causeRequest._id,
            categorySlug: causeRequest.category_slug,
            requestUserId: causeRequest.user_id,
            message: mConfig.noti_msg_payment_refused,
            userId: transactionData.user_id,
            additionalData: {
              request_type: 'donation',
              payment_id: transactionData._id,
            },
          };
          //send notification to donor
          this.commonService.notification(input);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donation/donation.service.ts-makeDonation',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //function got get  user donate transactions
  public async ngoDonation(
    transactionData: any,
    notificationRequest,
    paymentGateway,
  ) {
    try {
      const ngo: any = await this.ngoModel
        .findById({ _id: transactionData.ngo_id })
        .select({ _id: 1, ngo_name: '$form_data.ngo_name' })
        .lean();

      if (!ngo) {
        return {
          message: mConfig.No_data_found,
          success: false,
        };
      } else {
        if (
          (notificationRequest.eventCode === 'AUTHORISATION' &&
            notificationRequest.success === true) ||
          notificationRequest.type === 'checkout.session.completed'
        ) {
          //add donation data in donation table
          const userDetail = await this.userModel
            .findById({ _id: transactionData.user_id })
            .select({
              _id: 1,
              ngo_data: 1,
              display_name: 1,
              first_name: 1,
              last_name: 1,
            });

          const addDonation: any = {
            user_id: transactionData.ngo_id,
            user_name: ngo.ngo_name,
            active_type: transactionData.active_type,
            country_data: transactionData.country_data,
            donor_id:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data._id
                : userDetail._id,
            donor_user_id: userDetail._id,
            donor_name:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data.ngo_name
                : userDetail.display_name
                ? userDetail.display_name
                : userDetail.first_name + ' ' + userDetail.last_name,
            amount: transactionData.amount,
            currency: transactionData.country_data.currency,
            is_contribute_anonymously: transactionData.is_contribute_anonymously
              ? transactionData.is_contribute_anonymously
              : false,
            is_tax_benefit: transactionData.is_tax_benefit
              ? transactionData.is_tax_benefit
              : false,
            tax_number: transactionData.tax_number,
            note: transactionData.note,
            manage_fees: transactionData.manage_fees,
            receipt_number: await this.commonService.nextReceiptNum(
              userDetail._id,
            ),
            transaction_type: 'ngo-donation',
            resp: notificationRequest,
            is_user_ngo: true,
            is_donor_ngo: transactionData.active_type === 'ngo' ? true : false,
            tip_included: transactionData.tip_included,
            tip_charge: transactionData.tip_charge,
            tip_amount: transactionData.tip_amount,
            transaction_charge: transactionData.transaction_charge,
            transaction_amount: transactionData.transaction_amount,
            total_amount: transactionData.total_amount,
            payment_status: 'completed',
            campaign_name: ngo.ngo_name,
            amount_usd: transactionData.amount_usd,
            converted_amt: transactionData.converted_amt,
            converted_total_amt: transactionData.converted_total_amt,
            exchange_rate: transactionData.exchange_rate,
            currency_code: transactionData.currency_code,
            corporate_id: transactionData.corporate_id,
          };

          if (paymentGateway === 'adyen') {
            addDonation.eventCode = notificationRequest.eventCode;
            addDonation.success = notificationRequest.success;
            addDonation.pspReference = notificationRequest.pspReference;
            addDonation.paymentMethod = notificationRequest.paymentMethod;
            addDonation.reference_id = notificationRequest.merchantReference;
          } else if (paymentGateway === 'stripe') {
            const session = notificationRequest.data.object;
            addDonation.status = session.status;
            addDonation.paymentMethod = session.payment_method_types[0];
            addDonation.reference_id = session.client_reference_id;
          }

          //save new request
          const createData = new this.transactionModel(addDonation);
          const newTransaction: any = await createData.save();

          if (_.isEmpty(newTransaction)) {
            return {
              message: mConfig.Please_try_again,
              success: false,
            };
          } else {
            const input: any = {
              title: mConfig.noti_title_Payment_was_successful,
              type: 'ngo',
              ngoId: transactionData.ngo_id,
            };
            const updateData1 = {
              '{{donor_name}}': newTransaction.donor_name,
              '{{amount}}':
                newTransaction.country_data &&
                newTransaction.country_data.country == 'India'
                  ? newTransaction.total_amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : newTransaction.total_amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
              '{{user_name}}': newTransaction.user_name,
              '{{currency_symbol}}': newTransaction.currency,
              '{{ngo_name}}': newTransaction.campaign_name,
            };
            const msg1 = await this.commonService.changeString(
              mConfig.noti_msg_ngo_donation,
              updateData1,
            );
            const input2: any = {
              title: mConfig.noti_title_ngo_donation,
              type: 'ngo',
              ngoId: transactionData.ngo_id,
              message: msg1,
            };

            const msg2 = await this.commonService.changeString(
              mConfig.noti_msg_donate_amount_to_ngo,
              updateData1,
            );

            //send notification to donor
            const removeNotiIds = [userDetail._id];
            input.message = msg2;
            input.userId = userDetail._id;
            await this.commonService.notification(input);

            //send notification to trustee of donor ngo
            if (newTransaction.is_donor_ngo === true) {
              const notiUser = await this.commonService.getNgoUserIds(
                newTransaction.donor_id,
                userDetail._id,
              );
              if (notiUser) {
                const msg3 = await this.commonService.changeString(
                  mConfig.noti_msg_ngo_transfer_amount,
                  updateData1,
                );
                removeNotiIds.push(notiUser);
                input.message = msg3;
                input.userId = notiUser;
                await this.commonService.notification(input);
              }
            }
            //send notification to user
            const notiUser = await this.commonService.getNgoUserIds(
              newTransaction.user_id,
            );
            if (notiUser) {
              updateData1['{{category}}'] = 'NGO';
              const msg = await this.commonService.changeString(
                mConfig.noti_msg_donate_my_ngo_request,
                updateData1,
              );
              input.message = msg;
              this.commonService.sendAllNotification(notiUser, input);
            }

            //send notification all auti users
            this.commonService.sendAllUsersNotification(
              removeNotiIds,
              input2,
              null,
              true,
            );

            //send notification to admin
            this.commonService.sendAdminNotification(input2);

            return {
              message: mConfig.transaction_success,
              success: true,
            };
          }
        } else {
          const input: any = {
            title: mConfig.noti_title_payment_failed,
            type: 'payment_failed_ngoDonation',
            ngoId: transactionData.ngo_id,
            message: mConfig.noti_msg_payment_refused,
            userId: transactionData.user_id,
            additionalData: {
              request_type: 'ngo-donation',
              payment_id: transactionData._id,
            },
          };
          //send notification to donor
          this.commonService.notification(input);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donation/donation.service.ts-ngoDonation',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //function for get fund
  public async fund(transactionData: any, notificationRequest, paymentGateway) {
    try {
      const fundData: any = await this.fundModel.aggregate([
        { $match: { _id: ObjectID(transactionData.fund_id) } },
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
            user_id: 1,
            title_of_fundraiser: '$form_data.title_of_fundraiser',
            user_name: {
              $concat: ['$userData.first_name', ' ', '$userData.last_name'],
            },
          },
        },
      ]);

      if (_.isEmpty(fundData) && _.isEmpty(fundData[0])) {
        return {
          message: mConfig.No_data_found,
          success: false,
        };
      } else {
        if (
          (notificationRequest.eventCode === 'AUTHORISATION' &&
            notificationRequest.success === true) ||
          notificationRequest.type === 'checkout.session.completed'
        ) {
          //add donation data in donation table

          const userDetail = await this.userModel
            .findById({ _id: transactionData.user_id })
            .select({
              _id: 1,
              ngo_data: 1,
              display_name: 1,
              first_name: 1,
              last_name: 1,
            })
            .lean();

          const addDonation: any = {
            user_id: fundData[0].user_id,
            user_name: fundData[0].user_name,
            active_type: transactionData.active_type,
            country_data: transactionData.country_data,
            donor_id:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data._id
                : userDetail._id,
            donor_user_id: userDetail._id,
            donor_name:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data.ngo_name
                : userDetail.display_name
                ? userDetail.display_name
                : userDetail.first_name + ' ' + userDetail.last_name,
            to_fund_id: fundData[0]._id,
            amount: transactionData.amount,
            currency: transactionData.country_data.currency,
            is_contribute_anonymously: transactionData.is_contribute_anonymously
              ? transactionData.is_contribute_anonymously
              : false,
            is_tax_benefit: transactionData.is_tax_benefit
              ? transactionData.is_tax_benefit
              : false,
            tax_number: transactionData.tax_number,
            note: transactionData.note,
            receipt_number: await this.commonService.nextReceiptNum(
              userDetail._id,
            ),
            transaction_type: 'fund-donated',
            resp: notificationRequest,
            is_user_ngo: false,
            is_donor_ngo: transactionData.active_type === 'ngo' ? true : false,
            tip_included: transactionData.tip_included,
            tip_charge: transactionData.tip_charge,
            tip_amount: transactionData.tip_amount,
            transaction_charge: transactionData.transaction_charge,
            transaction_amount: transactionData.transaction_amount,
            total_amount: transactionData.total_amount,
            campaign_name: fundData[0].title_of_fundraiser,
            payment_status: 'completed',
            manage_fees: transactionData.manage_fees,
            amount_usd: transactionData.amount_usd,
            converted_amt: transactionData.converted_amt,
            converted_total_amt: transactionData.converted_total_amt,
            exchange_rate: transactionData.exchange_rate,
            currency_code: transactionData.currency_code,
            corporate_id: transactionData.corporate_id,
          };

          if (paymentGateway === 'adyen') {
            addDonation.eventCode = notificationRequest.eventCode;
            addDonation.success = notificationRequest.success;
            addDonation.pspReference = notificationRequest.pspReference;
            addDonation.paymentMethod = notificationRequest.paymentMethod;
            addDonation.reference_id = notificationRequest.merchantReference;
          } else if (paymentGateway === 'stripe') {
            const session = notificationRequest.data.object;
            addDonation.status = session.status;
            addDonation.paymentMethod = session.payment_method_types[0];
            addDonation.reference_id = session.client_reference_id;
          }

          const categoryDetail: any = await this.categoryModel
            .findOne({ category_slug: 'start-fund' })
            .select({ _id: 1, name: 1, category_slug: 1 });
          if (categoryDetail) {
            addDonation.category_id = categoryDetail._id;
            addDonation.category_name = 'Fund';
            addDonation.category_slug = categoryDetail.category_slug;
          }

          const createDonateData = await new this.transactionModel(addDonation);
          await createDonateData.save();

          delete addDonation.to_fund_id;
          addDonation.transaction_type = 'fund-received';
          addDonation.fund_id = fundData[0]._id;
          //save new request
          const createReceiveData = new this.transactionModel(addDonation);
          const newTransaction: any = await createReceiveData.save();

          if (_.isEmpty(newTransaction)) {
            return {
              message: mConfig.Please_try_again,
              success: false,
            };
          } else {
            //send notification as per requirement

            return {
              message: mConfig.transaction_success,
              data: newTransaction,
              success: true,
            };
          }
        } else {
          const input: any = {
            title: mConfig.noti_title_payment_failed,
            type: 'payment_failed_fund',
            requestId: fundData[0]._id,
            categorySlug: 'fund',
            requestUserId: fundData[0].user_id,
            message: mConfig.noti_msg_payment_refused,
            userId: transactionData.user_id,
            additionalData: {
              request_type: 'fund-donated',
              payment_id: transactionData._id,
            },
          };
          //send notification to donor
          this.commonService.notification(input);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donation/donation.service.ts-fund',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //get user and category data
  public async makeFeatureDonation(
    transactionData: any,
    notificationRequest,
    paymentGateway,
  ) {
    try {
      const causeRequest: any = await this.causeRequestModel
        .findById({ _id: transactionData.request_id })
        .select({
          _id: 1,
          uname: 1,
          user_id: 1,
          category_slug: 1,
          user_ngo_id: 1,
          'form_data.title_of_fundraiser': 1,
        })
        .lean();
      if (!causeRequest) {
        return {
          message: mConfig.No_data_found,
          success: false,
        };
      } else {
        if (
          (notificationRequest.eventCode === 'AUTHORISATION' &&
            notificationRequest.success === true) ||
          notificationRequest.type === 'checkout.session.completed'
        ) {
          const addDonation: any = {
            user_id: causeRequest.user_id,
            user_name: causeRequest.uname,
            request_id: causeRequest._id,
            active_type: transactionData.active_type,
            country_data: transactionData.country_data,
            amount: transactionData.amount,
            currency: transactionData.country_data.currency,
            receipt_number: await this.commonService.nextReceiptNum(
              causeRequest.user_id,
            ),
            user_ngo_id: causeRequest?.user_ngo_id
              ? causeRequest.user_ngo_id
              : null,
            transaction_type: 'featured-transaction',
            category_slug: causeRequest.category_slug,
            resp: notificationRequest,
            plan: transactionData.plan,
            campaign_name: causeRequest.form_data.title_of_fundraiser,
            payment_status: 'completed',
          };

          if (paymentGateway === 'adyen') {
            addDonation.eventCode = notificationRequest.eventCode;
            addDonation.success = notificationRequest.success;
            addDonation.pspReference = notificationRequest.pspReference;
            addDonation.paymentMethod = notificationRequest.paymentMethod;
            addDonation.reference_id = notificationRequest.merchantReference;
          } else if (paymentGateway === 'stripe') {
            const session = notificationRequest.data.object;
            addDonation.status = session.status;
            addDonation.paymentMethod = session.payment_method_types[0];
            addDonation.reference_id = session.client_reference_id;
          }

          const categoryDetail: any = await this.categoryModel
            .findOne({ category_slug: causeRequest.category_slug })
            .select({ _id: 1, name: 1 })
            .lean();
          if (categoryDetail) {
            addDonation.category_id = categoryDetail._id;
            addDonation.category_name = categoryDetail.name;
          }
          //save new request
          const createData = new this.featureTransactionModel(addDonation);
          const newRequest: any = await createData.save();

          if (_.isEmpty(newRequest)) {
            return {
              message: mConfig.Please_try_again,
              success: false,
            };
          } else {
            const updateData1 = {
              '{{amount}}':
                newRequest.country_data &&
                newRequest.country_data.country == 'India'
                  ? newRequest.amount.toLocaleString('en-IN')
                  : newRequest.amount.toLocaleString('en-US'),
              '{{currency_symbol}}': newRequest.currency,
              '{{user_name}}': newRequest.user_name,
              '{{cause}}': newRequest.category_name,
              '{{refId}}': newRequest.reference_id,
            };

            const day: any = newRequest.plan.duration;
            let type = '';

            if (newRequest.plan.duration_type == 'days') {
              type = 'd';
            } else if (newRequest.plan.duration_type == 'monthly') {
              type = 'M';
            } else {
              type = 'y';
            }

            const expireDate = new Date(
              moment().add(day, type).startOf('minute').format(),
            );

            const plan_detail = {
              plan_id: newRequest.plan._id,
              plan_title: newRequest.plan.title,
              plan_amount: newRequest.plan.amount,
              plan_duration: newRequest.plan.duration,
              plan_duration_type: newRequest.plan.duration_type,
              plan_active_date: new Date(),
              is_active: true,
            };

            const updateData: any = {
              plan_expired_date: expireDate,
              is_featured: true,
              $push: { plan: plan_detail },
            };

            const data: any = await this.causeRequestModel
              .findByIdAndUpdate({ _id: causeRequest._id }, updateData, {
                new: true,
              })
              .select({ resp: 0 })
              .lean();

            data.transactionData = newRequest;

            const input: any = {
              title: mConfig.noti_title_transfer_amount,
              type: causeRequest.category_slug,
              requestId: causeRequest._id,
              categorySlug: causeRequest.category_slug,
              requestUserId: causeRequest.user_id,
            };

            // send notification to Benificiary
            const msg1 = await this.commonService.changeString(
              mConfig.noti_msg_user_transfer_amount,
              updateData1,
            );
            input.message = msg1;
            input.userId = causeRequest.user_id;
            await this.commonService.notification(input);

            // send notification to trustee of user ngoModel
            if (newRequest.is_user_ngo === true) {
              const msg2 = await this.commonService.changeString(
                mConfig.noti_msg_ngo_donate_amount,
                updateData1,
              );

              input.message = msg2;
              const notiUser = await this.commonService.getNgoUserIds(
                causeRequest.user_ngo_id,
                causeRequest.user_id,
              );
              if (notiUser) {
                input.userId = notiUser;
                await this.commonService.notification(input);
              }
            }
            //send notification to admin
            const msg3 = await this.commonService.changeString(
              mConfig.noti_msg_transfer_amount,
              updateData1,
            );
            input.message = msg3;
            this.commonService.sendAdminNotification(input);
            //TODO send notification to all users of auti

            return {
              message: mConfig.Request_featured,
              success: true,
              data: data,
            };
          }
        } else {
          const input: any = {
            title: mConfig.noti_title_payment_failed,
            type: 'payment_failed_makeFeatureDonation',
            requestId: causeRequest._id,
            categorySlug: causeRequest.category_slug,
            requestUserId: causeRequest.user_id,
            message: mConfig.noti_msg_user_transfer_refused,
            userId: causeRequest.user_id,
            additionalData: { request_type: 'featured-transaction' },
          };
          //send notification to donor
          this.commonService.notification(input);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donation/donation.service.ts-makeFeatureDonation',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //get transaction data
  public async createTransactionDetail(
    createTransactionDetail: CreateTransactionDetail,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        createTransactionDetail,
      );
      const paymentProcessData: any = await this.paymentProcessModel
        .findOne({ _id: createTransactionDetail.reference_id })
        .lean();
      if (!_.isEmpty(paymentProcessData)) {
        let data: any = {};
        let addDonation;
        let modelName;
        const userDetail = await this.userModel
          .findById({ _id: paymentProcessData.user_id })
          .select({
            ngo_data: 1,
            _id: 1,
            display_name: 1,
            first_name: 1,
            last_name: 1,
          })
          .lean();
        if (paymentProcessData.transaction_type === 'ngo-donation') {
          modelName = this.transactionModel;
          data = await this.ngoModel
            .findById({ _id: paymentProcessData.ngo_id })
            .select({ _id: 1, ngo_name: '$form_data.ngo_name' })
            .lean();
          if (!data) {
            return {
              message: mConfig.No_data_found,
              success: false,
            };
          } else {
            addDonation = {
              user_id: data._id,
              user_name: data?.ngo_name,
              active_type: paymentProcessData.active_type,
              country_data: paymentProcessData.country_data,
              donor_id:
                paymentProcessData.active_type === 'ngo'
                  ? userDetail.ngo_data._id
                  : userDetail._id,
              donor_name:
                paymentProcessData.active_type === 'ngo'
                  ? userDetail.ngo_data.ngo_name
                  : userDetail.display_name
                  ? userDetail.display_name
                  : userDetail.first_name + ' ' + userDetail.last_name,
              amount: paymentProcessData.amount,
              currency: paymentProcessData.country_data.currency,
              is_contribute_anonymously:
                paymentProcessData.is_contribute_anonymously
                  ? paymentProcessData.is_contribute_anonymously
                  : false,
              is_tax_benefit: paymentProcessData.is_tax_benefit
                ? paymentProcessData.is_tax_benefit
                : false,
              tax_number: paymentProcessData.tax_number,
              note: paymentProcessData.note,
              manage_fees: paymentProcessData.manage_fees,
              receipt_number: await this.commonService.nextReceiptNum(
                userDetail._id,
              ),
              transaction_type: 'ngo-donation',
              reference_id: createTransactionDetail.reference_id,
              is_user_ngo: true,
              is_donor_ngo:
                paymentProcessData.active_type === 'ngo' ? true : false,
              tip_included: paymentProcessData.tip_included,
              tip_charge: paymentProcessData.tip_charge,
              tip_amount: paymentProcessData.tip_amount,
              transaction_charge: paymentProcessData.transaction_charge,
              transaction_amount: paymentProcessData.transaction_amount,
              total_amount: paymentProcessData.total_amount,
              resp: createTransactionDetail.response,
              campaign_name: data?.ngo_name,
            };
          }
        } else {
          data = await this.causeRequestModel
            .findById({ _id: paymentProcessData.request_id })
            .select({
              _id: 1,
              user_ngo_id: 1,
              user_id: 1,
              uname: 1,
              category_slug: 1,
              'form_data.goal_amount': 1,
              'form_data.title_of_fundraiser': 1,
              total_donation: 1,
              total_donors: 1,
              status: 1,
            })
            .lean();
          if (!data) {
            return {
              message: mConfig.No_data_found,
              success: false,
            };
          } else {
            let userId;
            let uName;
            if (
              data.user_ngo_id &&
              paymentProcessData.transaction_type === 'donation'
            ) {
              const ngoData = await this.ngoModel
                .findOne({ _id: ObjectID(data.user_ngo_id) })
                .select({ ngo_name: '$form_data.ngo_name' })
                .lean();
              userId = data.user_ngo_id;
              uName = ngoData?.ngo_name;
            } else {
              userId = data.user_id;
              uName = data.uname;
            }
            if (
              paymentProcessData.transaction_type === 'featured-transaction'
            ) {
              modelName = this.featureTransactionModel;
              addDonation = {
                user_id: userId,
                user_name: uName,
                request_id: data._id,
                active_type: paymentProcessData.active_type,
                country_data: paymentProcessData.country_data,
                amount: paymentProcessData.amount,
                currency: paymentProcessData.country_data.currency,
                receipt_number: await this.commonService.nextReceiptNum(
                  data.user_id,
                ),
                user_ngo_id: data?.user_ngo_id ? data.user_ngo_id : null,
                transaction_type: paymentProcessData.transaction_type,
                category_slug: data.category_slug,
                campaign_name: data.form_data.title_of_fundraiser,
                reference_id: createTransactionDetail.reference_id,
                plan: paymentProcessData.plan,
                resp: createTransactionDetail.response,
              };
            } else {
              modelName = this.transactionModel;
              addDonation = {
                user_id: userId,
                user_name: uName,
                active_type: paymentProcessData.active_type,
                country_data: paymentProcessData.country_data,
                donor_id:
                  paymentProcessData.active_type === 'ngo'
                    ? userDetail.ngo_data._id
                    : userDetail._id,
                donor_name:
                  paymentProcessData.active_type === 'ngo'
                    ? userDetail.ngo_data.ngo_name
                    : userDetail.display_name
                    ? userDetail.display_name
                    : userDetail.first_name + ' ' + userDetail.last_name,
                request_id: data._id,
                amount: paymentProcessData.amount,
                currency: paymentProcessData.country_data.currency,
                is_contribute_anonymously:
                  paymentProcessData.is_contribute_anonymously
                    ? paymentProcessData.is_contribute_anonymously
                    : false,
                is_tax_benefit: paymentProcessData.is_tax_benefit
                  ? paymentProcessData.is_tax_benefit
                  : false,
                tax_number: paymentProcessData.tax_number,
                note: paymentProcessData.note,
                manage_fees: paymentProcessData.manage_fees,
                receipt_number: await this.commonService.nextReceiptNum(
                  userDetail._id,
                ),
                transaction_type: paymentProcessData.transaction_type,
                goal_amount: data.form_data.goal_amount,
                reference_id: createTransactionDetail.reference_id,
                category_slug: data.category_slug,
                is_user_ngo: data.user_ngo_id ? true : false,
                is_donor_ngo:
                  paymentProcessData.active_type === 'ngo' ? true : false,
                tip_included: paymentProcessData.tip_included,
                tip_charge: paymentProcessData.tip_charge,
                tip_amount: paymentProcessData.tip_amount,
                transaction_charge: paymentProcessData.transaction_charge,
                transaction_amount: paymentProcessData.transaction_amount,
                total_amount: paymentProcessData.total_amount,
                campaign_name: data.form_data.title_of_fundraiser,
                resp: createTransactionDetail.response,
              };
            }
            const categoryDetail: any = await this.categoryModel
              .findOne({ category_slug: data.category_slug })
              .select({ _id: 1, name: 1 })
              .lean();
            if (categoryDetail) {
              addDonation.category_id = categoryDetail._id;
              addDonation.category_name = categoryDetail.name;
            }
          }
        }
        if (createTransactionDetail.redirectResult) {
          addDonation.redirectResult = createTransactionDetail.redirectResult;
        } else if (createTransactionDetail.payload) {
          addDonation.payload = createTransactionDetail.payload;
        }
        const createTransaction: any = createTransactionDetail;
        addDonation.resultCode =
          createTransaction?.response?.resultCode || null;
        addDonation.pspReference =
          createTransaction?.response?.pspReference || null;
        addDonation.paymentMethod =
          createTransaction?.response?.paymentMethod?.type || null;
        addDonation.eventCode = createTransaction?.response?.resultCode || null;
        addDonation.payment_status = 'pending';
        const transaction = await modelName
          .findOne({ reference_id: createTransactionDetail.reference_id })
          .count()
          .lean();
        //save new request
        if (transaction === 0) {
          const createData = new modelName(addDonation);
          const newTransaction: any = await createData.save();
          if (newTransaction) {
            if (newTransaction.transaction_type === 'donation') {
              //update total_donation,total_donors,avg_donation and return with funded_in_days
              const totalDonation =
                Number(data.total_donation) + Number(newTransaction.amount);
              const goalAmount = Number(data.form_data.goal_amount);
              const avgDonation =
                totalDonation >= goalAmount
                  ? 100
                  : (totalDonation / goalAmount) * 100;
              const remainingAmount =
                totalDonation >= goalAmount ? 0 : goalAmount - totalDonation;
              const updateData: any = {
                $set: {
                  total_donation: totalDonation,
                  total_donors: Number(data.total_donors) + 1,
                  avg_donation: avgDonation.toFixed(2),
                  'form_data.remaining_amount': Number(remainingAmount),
                  status:
                    totalDonation >= goalAmount ? 'complete' : data.status,
                },
              };
              await this.causeRequestModel
                .findByIdAndUpdate({ _id: data._id }, updateData, {
                  new: true,
                })
                .select({ _id: 1 })
                .lean();
            }
            await this.paymentProcessModel
              .findOneAndDelete({ _id: paymentProcessData._id })
              .select({ _id: 1 })
              .lean();
            return res.json({
              success: true,
              data: newTransaction,
            });
          } else {
            return res.json({
              success: false,
              data: mConfig.Please_try_again,
            });
          }
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.Webhook_rejected,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-createTransactionDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api call for handle adyen webhook notification
  public async handleAdyenWebhook(res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        this.request.body,
      );
      // YOUR_HMAC_KEY from the Customer Area
      const hmacKey = process.env.ADYEN_HMAC_KEY;
      const validator = new hmacValidator();
      // Notification Request JSON
      const notificationRequest = this.request.body;
      const notificationRequestItems = notificationRequest.notificationItems;
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const newThis = this;
      // Handling multiple notificationRequests
      notificationRequestItems.forEach(async function (
        notificationRequestItem,
      ) {
        const notification = notificationRequestItem.NotificationRequestItem;
        // Handle the notification
        if (validator.validateHMAC(notification, hmacKey)) {
          // Process the notification based on the eventCode
          const merchantReference = notification.merchantReference;
          //check in transaction tbl and process tbl
          const paymentProcessData: any = await newThis.paymentProcessModel
            .findById({ _id: merchantReference })
            .lean();
          if (!_.isEmpty(paymentProcessData)) {
            if (
              paymentProcessData.transaction_type === 'featured-transaction'
            ) {
              const transactionData: any = await newThis.featureTransactionModel
                .findOne({ reference_id: merchantReference })
                .count()
                .lean();
              if (transactionData === 0) {
                // call add feature function to continue process
                await newThis.makeFeatureDonation(
                  paymentProcessData,
                  notification,
                  'adyen',
                );
              }
            } else {
              const transactionData: any = await newThis.transactionModel
                .findOne({ reference_id: merchantReference })
                .count()
                .lean();
              if (
                transactionData === 0 &&
                paymentProcessData.transaction_type === 'donation'
              ) {
                // call donation function to continue process
                await newThis.makeDonation(
                  paymentProcessData,
                  notification,
                  'adyen',
                );
              } else {
                await newThis.ngoDonation(
                  paymentProcessData,
                  notification,
                  'adyen',
                );
              }
            }
            //delete that entry from table
            await newThis.paymentProcessModel
              .deleteOne({ _id: notification.merchantReference })
              .lean();
          }
          res.send(mConfig.Webhook_accepted);
        } else {
          // invalid hmac: do not send [accepted] response
          res.send(mConfig.Invalid_HMAC + `${notification}`);
        }
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-handleAdyenWebhook',
        this.request.body,
      );
      return res.json({
        success: false,
        message: mConfig.Webhook_rejected,
      });
    }
  }

  //Api call for handle stripe webhook notification
  public async handleStripeWebhook(res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        this.request.body,
      );
      if (
        !_.isEmpty(this.request.body) &&
        !_.isEmpty(this.request.body.data) &&
        !_.isEmpty(this.request.body.data.object)
      ) {
        const event = this.request.body;
        const session = event.data.object;
        if (
          event.type === 'checkout.session.completed' ||
          event.type === 'checkout.session.expired'
        ) {
          const merchantReference: any = session.client_reference_id;
          const paymentProcessData: any = await this.paymentProcessModel
            .findById({ _id: merchantReference })
            .lean();
          if (!_.isEmpty(paymentProcessData)) {
            if (
              paymentProcessData.transaction_type === 'featured-transaction'
            ) {
              const transactionData: any = await this.featureTransactionModel
                .findOne({ reference_id: merchantReference })
                .select({ reference_id: 1 })
                .lean();
              if (_.isEmpty(transactionData)) {
                // call add feature function to continue process
                await this.makeFeatureDonation(
                  paymentProcessData,
                  event,
                  'stripe',
                );
              }
            } else {
              const transactionData: any = await this.transactionModel
                .findOne({ reference_id: merchantReference })
                .select({ reference_id: 1 })
                .lean();
              if (
                _.isEmpty(transactionData) &&
                paymentProcessData.transaction_type === 'donation'
              ) {
                // call donation function to continue process
                await this.makeDonation(paymentProcessData, event, 'stripe');
              } else if (
                paymentProcessData.transaction_type === 'ngo-donation'
              ) {
                await this.ngoDonation(paymentProcessData, event, 'stripe');
              } else if (
                paymentProcessData.transaction_type === 'fund-received'
              ) {
                await this.fund(paymentProcessData, event, 'stripe');
              }
            }
            //delete that entry from table
            await this.paymentProcessModel
              .deleteOne({ _id: merchantReference })
              .lean();
          }
        } else if (event.type === 'transfer.created') {
          const referenceId: any = session.id;
          const adminTransactionData: any = await this.adminTransactionModel
            .findOne({ reference_id: referenceId })
            .select({ _id: 1, request_id: 1, goal_amount: 1, amount: 1 })
            .lean();
          if (!_.isEmpty(adminTransactionData)) {
            await this.adminTransactionModel
              .findByIdAndUpdate(
                { _id: adminTransactionData._id },
                { status: 'completed' },
              )
              .select({ _id: 1 })
              .lean();
            const requestData: any = await this.causeRequestModel
              .findById({
                _id: adminTransactionData.request_id,
              })
              .select({
                _id: 1,
                form_data: 1,
                reference_id: 1,
                country_data: 1,
                category_name: 1,
                category_slug: 1,
                user_ngo_id: 1,
                user_id: 1,
              })
              .lean();
            const total_donation = await this.adminTransactionModel
              .aggregate([
                {
                  $match: {
                    request_id: adminTransactionData.request_id,
                  },
                },
                {
                  $group: {
                    _id: '$request_id',
                    total_transfer: {
                      $sum: '$amount',
                    },
                  },
                },
              ])
              .exec();
            const total_transfer = total_donation[0].total_transfer;
            const remaining_transfer =
              Number(requestData.form_data.goal_amount) -
              total_donation[0].total_transfer;
            const updateData: any = {
              transaction_time: new Date(),
              last_transaction: adminTransactionData.amount,
              total_transfer: total_transfer,
              remaining_transfer:
                remaining_transfer <= 0 ? 0 : remaining_transfer,
            };
            if (total_transfer >= Number(requestData.form_data.goal_amount)) {
              updateData.status = 'close';
            }
            const query = {
              _id: adminTransactionData.request_id,
            };
            await this.causeRequestModel.updateOne(query, updateData).lean();
            const updateData1 = {
              '{{refId}}': requestData.reference_id,
              '{{currency_symbol}}': requestData.country_data.currency,
              '{{amount}}':
                requestData.country_data &&
                requestData.country_data.country == 'India'
                  ? adminTransactionData.amount.toLocaleString('en-IN', {
                      maximumSignificantDigits: 3,
                    })
                  : adminTransactionData.amount.toLocaleString('en-US', {
                      maximumSignificantDigits: 3,
                    }),
              '{{cause}}': requestData.category_name.toLowerCase(),
            };
            const msg = await this.commonService.changeString(
              mConfig.noti_msg_received_amount,
              updateData1,
            );
            const msg1 = await this.commonService.changeString(
              mConfig.noti_title_received_amount,
              { '{{cause}}': requestData.category_name },
            );
            const input: any = {
              title: msg1,
              message: msg,
              type: requestData.category_slug,
              requestId: requestData._id,
              categorySlug: requestData.category_slug,
              requestUserId: requestData.user_id,
            };
            if (requestData.user_ngo_id) {
              const ngoUsers = await this.commonService.getNgoUserIds(
                requestData.user_ngo_id,
              );
              if (ngoUsers) {
                this.commonService.sendAllNotification(ngoUsers, input);
              }
            } else {
              input.userId = requestData.user_id;
              this.commonService.notification(input);
            }
          }
        } else {
          return res.json({
            success: false,
          });
        }
      }
      return res.json({
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-handleStripeWebhook',
        this.request.body,
      );
      return res.json({
        success: false,
        message: mConfig.Webhook_rejected,
      });
    }
  }

  // Api for get cause request details
  public async transactionDetail(reference_id, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        reference_id,
      );
      if (!reference_id) {
        return res.json({
          message: mConfig.reference_id_is_missing,
          success: false,
        });
      }
      const transactiondetail: any = await this.transactionModel
        .findOne({ reference_id: ObjectID(reference_id) })
        .lean();
      const featureTransactiondetail = await this.featureTransactionModel
        .findOne({ reference_id: ObjectID(reference_id) })
        .lean();
      if (!_.isEmpty(transactiondetail)) {
        const userData = await this.commonService.getTransactionUser(
          transactiondetail,
          transactiondetail.user_id,
          transactiondetail.is_user_ngo,
        );
        transactiondetail.userData = userData;
        const getSaayamContact = await this.queueService.getSetting(
          'saayam-contact-no',
        );
        const getSaayamEmail = await this.queueService.getSetting(
          'saayam-email',
        );
        if (getSaayamContact && !_.isEmpty(getSaayamContact)) {
          transactiondetail.saayam_contact = getSaayamContact;
        } else {
          transactiondetail.saayam_contact = '+001 12345 254';
        }
        if (getSaayamEmail && !_.isEmpty(getSaayamEmail)) {
          transactiondetail.saayam_email = getSaayamEmail;
        } else {
          transactiondetail.saayam_email = 'help@saayam.com';
        }
        const receipt = await this.commonService.getDownloadTemplate(
          transactiondetail.transaction_type,
        );
        if (!_.isEmpty(receipt)) {
          transactiondetail.download = true;
        } else {
          transactiondetail.download = false;
        }
        return res.json({
          success: true,
          data: transactiondetail,
        });
      } else if (!_.isEmpty(featureTransactiondetail)) {
        return res.json({
          success: true,
          data: featureTransactiondetail,
        });
      } else {
        const paymentProcess: any = await this.paymentProcessModel
          .findById({ _id: reference_id })
          .lean();
        if (_.isEmpty(paymentProcess)) {
          return res.json({
            message: mConfig.No_data_found,
            type: 'cancel',
            success: false,
          });
        } else {
          return res.json({
            message: mConfig.No_data_found,
            success: false,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-transactionDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //API for reset transaction process
  public async resetTransactionProcess(
    resetTransactionProcessDto: ResetTransactionProcessDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        resetTransactionProcessDto,
      );
      const paymentProcess: any = await this.paymentProcessModel
        .findById({ _id: ObjectID(resetTransactionProcessDto.reference_id) })
        .lean();
      let insertData;
      if (_.isEmpty(paymentProcess)) {
        const transactiondetail: any = await this.transactionModel
          .findOne({
            reference_id: ObjectID(resetTransactionProcessDto.reference_id),
          })
          .select({ resp: 0 })
          .lean();
        const featureTransactiondetail = await this.featureTransactionModel
          .findOne({
            reference_id: ObjectID(resetTransactionProcessDto.reference_id),
          })
          .select({ user_id: 1, request_id: 1, plan: 1, country_data: 1 })
          .lean();
        if (!_.isEmpty(transactiondetail)) {
          insertData = {
            user_id: transactiondetail.user_id,
            request_id: transactiondetail.request_id,
            amount: transactiondetail.amount,
            is_contribute_anonymously:
              transactiondetail.is_contribute_anonymously,
            is_tax_benefit: transactiondetail.is_tax_benefit,
            tax_number: transactiondetail.tax_number,
            note: transactiondetail.note,
            manage_fees: transactiondetail.manage_fees,
            active_type: transactiondetail.active_type,
            transaction_type: 'donation',
            country_data: transactiondetail.country_data,
            tip_included: transactiondetail.tip_included,
            tip_charge: transactiondetail.tip_charge,
            transaction_charge: transactiondetail.transaction_charge,
            transaction_amount: transactiondetail.transaction_amount,
            tip_amount: transactiondetail.tip_amount,
            total_amount: transactiondetail.total_amount,
          };
        } else if (!_.isEmpty(featureTransactiondetail)) {
          insertData = {
            user_id: featureTransactiondetail.user_id,
            request_id: featureTransactiondetail.request_id,
            plan: featureTransactiondetail.plan,
            transaction_type: 'featured-transaction',
            country_data: featureTransactiondetail.country_data,
          };
        }
      } else {
        insertData = {
          user_id: paymentProcess.user_id,
          request_id: paymentProcess.request_id,
          transaction_type: paymentProcess.transaction_type,
          country_data: paymentProcess.country_data,
        };
        if (paymentProcess.transaction_type === 'donation') {
          insertData.amount = paymentProcess.amount;
          insertData.is_contribute_anonymously =
            paymentProcess.is_contribute_anonymously;
          insertData.is_tax_benefit = paymentProcess.is_tax_benefit;
          insertData.tax_number = paymentProcess.tax_number;
          insertData.note = paymentProcess.note;
          insertData.manage_fees = paymentProcess.manage_fees;
          insertData.active_type = paymentProcess.active_type;
          insertData.tip_included = paymentProcess.tip_included;
          insertData.tip_charge = paymentProcess.tip_charge;
          insertData.tip_amount = paymentProcess.tip_amount;
          insertData.transaction_charge = paymentProcess.transaction_charge;
          insertData.transaction_amount = paymentProcess.transaction_amount;
          insertData.total_amount = paymentProcess.total_amount;
        } else {
          insertData.plan = paymentProcess.plan;
        }
      }
      const createData = await new this.paymentProcessModel(insertData);
      const newRequest: any = await createData.save();
      if (_.isEmpty(newRequest)) {
        return res.json({
          message: mConfig.Please_try_again,
          success: false,
        });
      } else {
        return res.json({ success: true, data: newRequest });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-resetTransactionProcess',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for generate receipt
  public async generateDonationReceipt(request_id, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        request_id,
      );
      if (!request_id || !request_id.request_id) {
        return res.json({
          message: mConfig.reference_id_is_missing,
          success: false,
        });
      }
      const transactiondetail: any = await this.transactionModel
        .findOne({ request_id: ObjectID(request_id.request_id) })
        .select({ resp: 0 })
        .sort({ createdAt: -1 })
        .lean();
      const featureTransactiondetail = await this.featureTransactionModel
        .findOne({ request_id: ObjectID(request_id.request_id) })
        .select({ resp: 0 })
        .sort({ createdAt: -1 })
        .lean();
      if (!_.isEmpty(transactiondetail)) {
        const userData = await this.commonService.getTransactionUser(
          transactiondetail,
          transactiondetail.user_id,
          transactiondetail.is_user_ngo,
        );
        transactiondetail.userData = userData;
        const getSaayamContact = await this.queueService.getSetting(
          'saayam-contact-no',
        );
        const getSaayamEmail = await this.queueService.getSetting(
          'saayam-email',
        );
        transactiondetail.saayam_contact =
          getSaayamContact && !_.isEmpty(getSaayamContact)
            ? getSaayamContact
            : '+001 12345 254';
        transactiondetail.saayam_email =
          getSaayamEmail && !_.isEmpty(getSaayamEmail)
            ? getSaayamEmail
            : "'help@saayam.com'";
        return res.json({
          success: true,
          data: transactiondetail,
        });
      } else if (!_.isEmpty(featureTransactiondetail)) {
        return res.json({
          success: true,
          data: featureTransactiondetail,
        });
      } else {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-generateDonationReceipt',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for generate receipt
  public async generateSingleReceipt(receiptDto: ReceiptDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        receiptDto,
      );
      const userData = this.request.user;
      let modelName: any = this.transactionModel;
      let query: any = {
        $or: [
          { _id: ObjectID(receiptDto.transaction_id) },
          { request_id: ObjectID(receiptDto.transaction_id) },
        ],
        saayam_community: { $exists: false },
      };
      if (
        receiptDto.transaction_type &&
        !_.isUndefined(receiptDto.transaction_type)
      ) {
        query['transaction_type'] = receiptDto.transaction_type;
        if (receiptDto.transaction_type === 'featured-transaction') {
          modelName = this.featureTransactionModel;
        } else if (receiptDto.transaction_type === 'ngo-donation') {
          query = {
            $or: [
              { user_id: ObjectID(receiptDto.transaction_id) },
              { _id: ObjectID(receiptDto.transaction_id) },
            ],
            donor_id: { $in: [userData._id, userData?.ngo_data?._id] },
            transaction_type: receiptDto.transaction_type,
            saayam_community: { $exists: false },
          };
        }
      }
      const transactiondetail: any = await modelName
        .findOne(query, { resp: 0 })
        .lean();
      if (!_.isEmpty(transactiondetail)) {
        if (transactiondetail.transaction_type === 'featured-transaction') {
          const userId = transactiondetail.user_ngo_id
            ? transactiondetail.user_ngo_id
            : transactiondetail.user_id;
          const isUserNgo = transactiondetail.user_ngo_id ? true : false;
          const userData = await this.commonService.getTransactionUser(
            transactiondetail,
            userId,
            isUserNgo,
          );
          transactiondetail.userData = userData;
        } else {
          const userData = await this.commonService.getTransactionUser(
            transactiondetail,
            transactiondetail.user_id,
            transactiondetail.is_user_ngo,
          );
          transactiondetail.userData = userData;
        }
        const getSaayamContact = await this.queueService.getSetting(
          'saayam-contact-no',
        );
        const getSaayamEmail = await this.queueService.getSetting(
          'saayam-email',
        );
        transactiondetail.saayam_contact =
          getSaayamContact && !_.isEmpty(getSaayamContact)
            ? getSaayamContact
            : '+001 12345 254';
        transactiondetail.saayam_email =
          getSaayamEmail && !_.isEmpty(getSaayamEmail)
            ? getSaayamEmail
            : 'help@saayam.com';
        return res.json({
          success: true,
          data: transactiondetail,
        });
      } else {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-generateSingleReceipt',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for transfer final amount to request user
  public async transferFinalAmount(
    transferFinalAmountDto: TransferFinalAmountDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        transferFinalAmountDto,
      );
      const _this = this;
      const causeData: any = await this.causeRequestModel
        .findById({ _id: transferFinalAmountDto.request_id })
        .select({
          _id: 1,
          user_id: 1,
          bank_id: 1,
          'country_data.currency': 1,
          'form_data.goal_amount': 1,
          total_donation: 1,
          'form_data.remaining_amount': 1,
          reference_id: 1,
          category_name: 1,
        })
        .lean();
      if (_.isEmpty(causeData)) {
        return res.json({
          success: false,
          message: mConfig.Request_data_not_found,
        });
      } else {
        const userData = await this.userModel
          .findById({ _id: causeData.user_id })
          .select({
            stripe_account_id: 1,
            email: 1,
            _id: 1,
            phone: 1,
            first_name: 1,
            last_name: 1,
            country_data: 1,
          })
          .lean();
        if (
          userData &&
          userData.country_data &&
          userData.country_data.country_code === 'US'
        ) {
          const bankData = await this.bankModel
            .findById({ _id: causeData.bank_id })
            .select({ form_data: 1 })
            .lean();
          let stripeAccountId;
          const createStripeAcc = await this.stripeService.createStripeAccount(
            userData,
            bankData,
          );
          if (createStripeAcc && createStripeAcc.error) {
            return res.json({
              message: createStripeAcc.error,
              success: false,
            });
          } else {
            stripeAccountId = createStripeAcc;
          }
          const newThis = this;
          setTimeout(async function () {
            const transferAmount =
              await newThis.stripeService.transferAmountToAccount(
                transferFinalAmountDto.amount,
                stripeAccountId,
              );
            if (transferAmount && transferAmount.error) {
              return res.json({
                message: transferAmount.error,
                success: false,
              });
            } else {
              const addDonation: any = {
                user_id: causeData.user_id,
                amount: transferFinalAmountDto.amount,
                currency: causeData.country_data.currency,
                currency_code: causeData.country_data.currency_code,
                request_id: transferFinalAmountDto.request_id,
                goal_amount: causeData.form_data.goal_amount,
                total_donation: causeData.total_donation,
                remaining_amount: causeData.form_data.remaining_amount
                  ? causeData.form_data.remaining_amount
                  : causeData.form_data.goal_amount,
                transfer_amount: causeData.form_data.goal_amount,
                receipt_number: await newThis.commonService.nextReceiptNum(
                  causeData.user_id,
                ),
                response: transferAmount,
                reference_id: transferAmount.id,
                status: 'pending',
              };
              //save new request
              const createData = new newThis.adminTransactionModel(addDonation);
              const newRequest: any = await createData.save();
              if (_.isEmpty(newRequest)) {
                return res.json({
                  message: mConfig.No_data_found,
                  success: false,
                });
              } else {
                //Add Activity Log
                const logData = {
                  action: 'transfer',
                  request_id: causeData._id,
                  entity_name: 'Transfer Amount To Completed Request',
                  description: `Transfer ${transferFinalAmountDto.amount}${causeData.country_data.currency} to ${causeData.category_name} - ${causeData.reference_id}`,
                };
                _this.logService.createAdminLog(logData);
                return res.json({
                  message: mConfig.Payment_success,
                  data: newRequest,
                  transaction_id: newRequest._id,
                  success: true,
                });
              }
            }
          }, 10000);
        } else {
          const msg = await this.commonService.changeString(
            mConfig.country_not_supported,
            { '{{country}}': userData.country_data.country },
          );
          return res.json({
            success: false,
            message: msg,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-transferFinalAmount',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list admin transactions
  public async adminTransactionList(param, res) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', param);
      const match: any = {};
      let modelName: any = this.adminTransactionModel;
      if (param.transaction_type === 'featured-transaction') {
        modelName = this.featureTransactionModel;
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
        let where = [];
        let query = {};
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.request_id) && filter.request_id) {
          where.push({ request_id: ObjectID(filter.request_id) });
        }
        if (
          !_.isUndefined(filter.transaction_date) &&
          filter.transaction_date
        ) {
          const query = await this.commonService.filter(
            'date',
            filter.transaction_date,
            'createdAt',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter._id) && filter._id) {
          const query = await this.commonService.filter(
            'objectId',
            filter._id,
            '_id',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.receipt_number) && filter.receipt_number) {
          const query = await this.commonService.filter(
            operator,
            filter.receipt_number,
            'receipt_number',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.title_of_fundraiser) &&
          filter.title_of_fundraiser
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.title_of_fundraiser,
            'causeData.form_data.title_of_fundraiser',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.category_name) && filter.category_name) {
          const query = await this.commonService.filter(
            operator,
            filter.category_name,
            'category_name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.uname) && filter.uname) {
          const query = await this.commonService.filter(
            operator,
            filter.uname,
            'causeData.uname',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.name_of_benificiary) &&
          filter.name_of_benificiary
        ) {
          const query = await this.commonService.filter(
            operator,
            filter.name_of_benificiary,
            'causeData.form_data.name_of_beneficiary',
          );
          const query1 = await this.commonService.filter(
            operator,
            filter.name_of_benificiary,
            'causeData.form_data.first_name',
          );
          const query2 = await this.commonService.filter(
            operator,
            filter.name_of_benificiary,
            'causeData.form_data.last_name',
          );
          where.push({ $or: [query, query1, query2] });
        }
        if (!_.isUndefined(filter.goal_amount) && filter.goal_amount) {
          const query = await this.commonService.filter(
            '=',
            filter.goal_amount,
            'goal_amount',
          );
          where.push(query);
        }
        if (
          !_.isUndefined(filter.remaining_amount) &&
          filter.remaining_amount
        ) {
          const query = await this.commonService.filter(
            '=',
            filter.remaining_amount,
            'remaining_amount',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.total_donation) && filter.total_donation) {
          const query = await this.commonService.filter(
            '=',
            filter.total_donation,
            'total_donation',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.transfer_amount) && filter.transfer_amount) {
          const query = await this.commonService.filter(
            '=',
            filter.transfer_amount,
            'transfer_amount',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.expiry_date) && filter.expiry_date) {
          const query = await this.commonService.filter(
            'date',
            filter.expiry_date,
            'causeData.form_data.expiry_date',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            '_id',
            'receipt_number',
            'causeData.form_data.title_of_fundraiser',
            'category_name',
            'causeData.uname',
            'causeData.form_data.name_of_beneficiary',
            'causeData.form_data.first_name',
            'causeData.form_data.last_name',
            'causeData.form_data.expiry_date',
            'createdAt',
          ];
          const field = [
            'goal_amount',
            'remaining_amount',
            'total_donation',
            'transfer_amount',
          ];
          const stringFilter = await this.commonService.getGlobalFilter(
            fields,
            filter.search,
          );
          const numFilter = await this.commonService.getNumberFilter(
            field,
            filter.search,
          );
          query = stringFilter.concat(numFilter);
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
        transaction_date: 'createdAt',
        receipt_number: 'receipt_number',
        title_of_fundraiser: 'causeData.form_data.title_of_fundraiser',
        category_name: 'category_name',
        uname: 'causeData.uname',
        name_of_beneficiary: 'name_of_benificiary',
        goal_amount: 'goal_amount',
        remaining_amount: 'remaining_amount',
        total_donation: 'total_donation',
        transfer_amount: 'transfer_amount',
        expiry_date: 'causeData.form_data.expiry_date',
      };
      const total_record = await modelName.countDocuments(match).exec();
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
      const result = await modelName.aggregate(
        [
          lookup,
          { $unwind: '$causeData' },
          { $match: match },
          {
            $project: {
              _id: 1,
              user_id: 1,
              amount: 1,
              transaction_date: '$createdAt',
              request_id: 1,
              goal_amount: 1,
              total_donation: 1,
              transfer_amount: 1,
              remaining_amount: 1,
              receipt_image: {
                $ifNull: [
                  {
                    $concat: [
                      authConfig.imageUrl,
                      'manual-transfer/',
                      '$receipt_image',
                    ],
                  },
                  null,
                ],
              },
              uname: '$causeData.uname',
              fundraiser_type: '$causeData.form_data.fundraiser_type',
              title_of_fundraiser: '$causeData.form_data.title_of_fundraiser',
              name_of_benificiary: {
                $cond: {
                  if: { $eq: ['$causeData.category_name', 'Fundraiser'] },
                  then: '$causeData.form_data.name_of_beneficiary',
                  else: {
                    $concat: [
                      '$causeData.form_data.first_name',
                      ' ',
                      '$causeData.form_data.last_name',
                    ],
                  },
                },
              },
              expiry_date: '$causeData.form_data.expiry_date',
              receipt_number: 1,
              paymentMethod: 1,
              plan: 1,
              transaction_type: 1,
              user_ngo_id: 1,
              currency: 1,
              category_name: 1,
              category_id: 1,
              user_name: 1,
              country_data: 1,
              reference_id: 1,
              createdAt: 1,
              updatedAt: 1,
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
        'src/controller/donate/donate.service.ts-adminTransactionList',
        param,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get data from payment process table from id
  public async getTransactionDetail(id, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'get', id);
      const transactiondetail: any = await this.paymentProcessModel
        .findOne({ _id: ObjectID(id) }, { response: 0 })
        .sort({ createdAt: -1 })
        .lean();
      if (!_.isEmpty(transactiondetail)) {
        return res.json({
          success: true,
          data: transactiondetail,
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
        'src/controller/donate/donate.service.ts-getTransactionDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get data from payment process table from id
  public async deleteTransactionDetail(id, res: any) {
    try {
      this.errorlogService.createApiLog(this.request.originalUrl, 'delete', id);
      const transactiondetail: any = await this.paymentProcessModel
        .findByIdAndDelete({ _id: ObjectID(id) })
        .select({ _id: 1 })
        .lean();
      if (!transactiondetail) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      return res.json({
        message: mConfig.Data_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-deleteTransactionDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for admin transactions by id
  public async adminTransactionById(id, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        id,
      );
      let match: any = { _id: ObjectID(id) };
      const result = await this.adminTransactionModel.aggregate([
        {
          $lookup: {
            from: 'requests', // collection name in db
            localField: 'request_id',
            foreignField: '_id',
            as: 'causeData',
          },
        },
        { $unwind: '$causeData' },
        { $match: match },
        { $unset: ['causeData.form_settings'] },
        {
          $project: {
            document: '$$ROOT',
            name_of_benificiary: {
              $cond: {
                if: { $eq: ['$causeData.category_name', 'Fundraiser'] },
                then: '$causeData.form_data.name_of_beneficiary',
                else: {
                  $concat: [
                    '$causeData.form_data.first_name',
                    ' ',
                    '$causeData.form_data.last_name',
                  ],
                },
              },
            },
          },
        },
      ]);
      if (_.isEmpty(result)) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      return res.json({
        data: result[0],
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-adminTransactionById',
        id,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for admin transactions by id
  public async adminRecepit(id, res) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        id,
      );
      const transactionData = await this.adminTransactionModel.findOne({
        _id: ObjectID(id),
      });
      if (!transactionData) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        let transactionDetail: any = '';
        let ngo_name: any = '';
        let ngo_address: any = '';
        let ngo_phone: any = '';
        let request_id: any = '';
        let phone: any = '';
        let email: any = '';
        if (!_.isUndefined(transactionData.request_id)) {
          transactionDetail = await this.causeRequestModel
            .findOne({
              _id: ObjectID(transactionData.request_id),
            })
            .select({
              _id: 1,
              user_id: 1,
              'form_data.title_of_fundraiser': 1,
              'form_data.location': 1,
            })
            .lean();
          const user = await this.userModel
            .findOne({ _id: transactionDetail.user_id })
            .select({ phone: 1, email: 1 })
            .lean();
          phone = user.phone;
          email = user.email;
          ngo_name = transactionDetail?.form_data?.title_of_fundraiser
            ? transactionDetail.form_data.title_of_fundraiser
            : 'Request';
          ngo_address = transactionDetail?.form_data?.location?.city
            ? transactionDetail?.form_data?.location?.city
            : '';
          request_id = transactionData?.request_id;
        } else if (!_.isUndefined(transactionData.ngo_id)) {
          transactionDetail = await this.ngoModel
            .findOne({
              _id: ObjectID(transactionData.ngo_id),
            })
            .select({
              _id: 1,
              ngo_name: '$form_data.ngo_name',
              ngo_location: '$ngo_address',
              phone_country_short_name:
                '$form_data.ngo_mobile_number.short_name',
              ngo_phone_code: '$form_data.ngo_mobile_number.countryCodeD',
              ngo_phone: '$form_data.ngo_mobile_number.phoneNumber',
            })
            .lean();
          ngo_name = transactionDetail?.ngo_name
            ? transactionDetail?.ngo_name
            : 'NGO';
          ngo_address = transactionDetail?.ngo_location?.city
            ? transactionDetail?.ngo_location?.city
            : '';
          ngo_phone =
            flag(transactionDetail?.phone_country_short_name) +
            transactionDetail?.ngo_phone_code +
            transactionDetail?.ngo_phone;
          request_id = transactionData?.ngo_id;
        }
        const adminReceptToName = await this.queueService.getSetting(
          'admin-receipt-to-name',
        );
        const saayamEmail = await this.queueService.getSetting('saayam-email');
        const amountInWords = await this.commonService.withDecimalNew(
          transactionData?.amount,
          transactionData?.currency_code,
        );
        const htmlData = {
          '{{donor_name}}': adminReceptToName || 'Donor',
          '{{ngo_name}}': ngo_name,
          '{{ngo_address}}': ngo_address,
          '{{ngo_phone}}': ngo_phone,
          '{{reciept_id}}': transactionData?.receipt_number || '-',
          '{{tax_id}}': '-',
          '{{request_id}}': request_id || '-',
          '{{receipt_date}}': momentTimezone(new Date())
            .tz('Asia/kolkata')
            .format('DD/MMM/YYYY'),
          '{{phone}}': phone,
          '{{email}}': email,
          '{{created_at}}':
            momentTimezone(transactionData?.transfer_date)
              .tz('Asia/kolkata')
              .format('DD/MMM/YYYY') || '-',
          '{{amount_paid}}':
            transactionData?.currency + transactionData?.amount?.toFixed(2) ||
            '-',
          '{{saayam_mail}}': saayamEmail || authConfig.getSaayamEmail,
          '{{amount_in_words}}': amountInWords || '-',
        };
        const htmlContent = await this.commonService.getPDFHtml(
          'admin-transaction',
          htmlData,
        );
        if (htmlContent && htmlContent?.success == false) {
          return res.json({
            message: mConfig.Email_Template_disabled,
            success: false,
          });
        }
        const fileName = parseInt(moment().format('X')) + '-.pdf';
        const locateFile = './uploads/temp/' + fileName;
        const options = {
          format: 'A3',
          orientation: 'portrait',
          phantomArgs: ['--ignore-ssl-errors=yes'],
        };
        //send receipt in email
        const browser = await puppeteer.launch({
          executablePath: '/usr/bin/chromium-browser',
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        await page.pdf({
          path: locateFile,
          printBackground: true,
          options,
        });
        await browser.close();
        const url = authConfig.downloadPdfUrl + fileName;
        return res.json({
          success: true,
          url,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-adminRecepit',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api call for handle aauti webhook notification
  public async handleAautiWebhook(res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        this.request.body,
      );
      const body = this.request.body;
      if (_.isEmpty(body?.transaction_code) || _.isEmpty(body?.order_code)) {
        return res.json({ success: false });
      }
      const axios = require('axios');
      const responce = await axios.get(
        process.env.AAUTI_PAYMENT_URL +
          'pay-response/' +
          body?.order_code +
          '/' +
          body?.transaction_code,
      );
      // const event = this.request.body;
      if (!_.isEmpty(responce)) {
        const event = responce?.data;
        // const session = event.data.object;
        const merchantReference: any = event?.data?.transaction_code;
        const paymentProcessData: any = await this.paymentProcessModel
          .findById({ _id: merchantReference })
          .lean();
        if (!_.isEmpty(paymentProcessData)) {
          const transactionData: any = await this.transactionModel
            .findOne({ reference_id: merchantReference })
            .select({ reference_id: 1 })
            .lean();
          const paymentGateway = responce?.data?.type;
          if (_.isEmpty(transactionData)) {
            if (paymentProcessData.transaction_type === 'donation') {
              // call donation function to continue process
              await this.makeDonationNew(
                paymentProcessData,
                event?.data,
                paymentGateway,
              );
            } else if (paymentProcessData.transaction_type === 'ngo-donation') {
              await this.ngoDonationNew(
                paymentProcessData,
                event?.data,
                paymentGateway,
              );
            } else if (
              paymentProcessData.transaction_type === 'fund-received'
            ) {
              await this.fundNew(
                paymentProcessData,
                event?.data,
                paymentGateway,
              );
            }
          }
          //delete that entry from table
          await this.paymentProcessModel
            .deleteOne({ _id: merchantReference })
            .lean();
        }
      } else {
        return res.json({
          success: false,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donate/donate.service.ts-handleAautiWebhook',
        this.request.body,
      );
      return res.json({
        success: false,
        message: mConfig.Webhook_rejected,
      });
    }
  }

  //update donation as new
  public async makeDonationNew(
    transactionData: any,
    notificationRequest,
    paymentGateway,
  ) {
    try {
      const causeRequest: any = await this.causeRequestModel
        .findById({ _id: transactionData.request_id })
        .select({
          _id: 1,
          user_ngo_id: 1,
          user_id: 1,
          uname: 1,
          'form_data.goal_amount': 1,
          'form_data.title_of_fundraiser': 1,
          category_slug: 1,
          total_donation: 1,
          total_donors: 1,
          status: 1,
          country_data: 1,
          reference_id: 1,
        })
        .lean();
      if (!causeRequest) {
        return {
          message: mConfig.No_data_found,
          success: false,
        };
      } else {
        if (notificationRequest.status === 'success') {
          //add donation data in donation table
          let userId;
          let uName;
          if (causeRequest.user_ngo_id) {
            const ngoData = await this.ngoModel
              .findOne({ _id: ObjectID(causeRequest.user_ngo_id) })
              .select({ ngo_name: '$form_data.ngo_name' })
              .lean();
            userId = causeRequest?.user_ngo_id;
            uName = ngoData?.ngo_name;
          } else {
            userId = causeRequest?.user_id;
            uName = causeRequest?.uname;
          }
          const userDetail = await this.userModel
            .findById({ _id: transactionData.user_id })
            .select({
              _id: 1,
              ngo_data: 1,
              display_name: 1,
              first_name: 1,
              last_name: 1,
            })
            .lean();
          const addDonation: any = {
            user_id: userId,
            user_name: uName,
            active_type: transactionData.active_type,
            country_data: transactionData.country_data,
            donor_id:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data._id
                : userDetail._id,
            donor_user_id: userDetail._id,
            donor_name:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data.ngo_name
                : userDetail.display_name
                ? userDetail.display_name
                : userDetail.first_name + ' ' + userDetail.last_name,
            request_id: causeRequest._id,
            amount: transactionData.amount,
            currency: transactionData.country_data.currency,
            is_contribute_anonymously: transactionData.is_contribute_anonymously
              ? transactionData.is_contribute_anonymously
              : false,
            is_tax_benefit: transactionData.is_tax_benefit
              ? transactionData.is_tax_benefit
              : false,
            tax_number: transactionData.tax_number,
            note: transactionData.note,
            receipt_number: await this.commonService.nextReceiptNum(
              userDetail._id,
            ),
            transaction_type: 'donation',
            goal_amount: causeRequest.form_data.goal_amount,
            resp: notificationRequest,
            is_user_ngo: causeRequest.user_ngo_id ? true : false,
            is_donor_ngo: transactionData.active_type === 'ngo' ? true : false,
            tip_included: transactionData.tip_included,
            tip_charge: transactionData.tip_charge,
            tip_amount: transactionData.tip_amount,
            transaction_charge: transactionData.transaction_charge,
            transaction_amount: transactionData.transaction_amount,
            total_amount: transactionData.total_amount,
            campaign_name: causeRequest.form_data.title_of_fundraiser,
            payment_status: 'completed',
            manage_fees: transactionData.manage_fees,
            amount_usd: transactionData.amount_usd,
            converted_amt: transactionData.converted_amt,
            converted_total_amt: transactionData.converted_total_amt,
            exchange_rate: transactionData.exchange_rate,
            currency_code: transactionData.currency_code,
            order_code: notificationRequest.order_code,
            reference_id: transactionData._id,
            paymentGateway: notificationRequest.type,
            status: 'completed',
            corporate_id: transactionData.corporate_id,
          };

          // if (paymentGateway === 'adyen') {
          //   addDonation.eventCode = notificationRequest.eventCode;
          //   addDonation.success = notificationRequest.success;
          //   addDonation.pspReference = notificationRequest.pspReference;
          //   addDonation.paymentMethod = notificationRequest.paymentMethod;
          //   // addDonation.reference_id = notificationRequest.merchantReference;
          // } else if (paymentGateway === 'stripe') {
          //   const session = notificationRequest.payment_response;
          //   addDonation.status = session.status;
          //   addDonation.paymentMethod = session.payment_method_types[0];
          //   // addDonation.reference_id = session.client_reference_id;
          // }

          const categoryDetail: any = await this.categoryModel
            .findOne({ category_slug: causeRequest.category_slug })
            .select({ _id: 1, name: 1 });
          if (categoryDetail) {
            addDonation.category_id = categoryDetail?._id;
            addDonation.category_name = categoryDetail?.name;
          }

          //save new request
          const createData = new this.transactionModel(addDonation);
          const newTransaction: any = await createData.save();

          if (_.isEmpty(newTransaction)) {
            return {
              message: mConfig.Please_try_again,
              success: false,
            };
          } else {
            //update total_donation,total_donors,avg_donation and return with funded_in_days
            let newTransactionAmount = newTransaction.amount;
            if (
              transactionData.country_data.currency_code !=
              causeRequest.country_data.currency_code
            ) {
              let result = await this.commonService.getExchangeRate(
                transactionData.country_data.currency_code,
                causeRequest.country_data.currency_code,
                newTransaction.amount,
              );
              if (result['status'] == true) {
                newTransactionAmount = result['amount'];
              }
            }
            const totalDonation =
              Number(causeRequest.total_donation) +
              Number(newTransactionAmount);
            const goalAmount = Number(causeRequest.form_data.goal_amount);
            const avgDonation: any =
              totalDonation >= goalAmount
                ? 100
                : (totalDonation / goalAmount) * 100;
            const remainingAmount =
              totalDonation >= goalAmount ? 0 : goalAmount - totalDonation;
            const updateData: any = {
              $set: {
                total_donation: totalDonation,
                total_donors: Number(causeRequest.total_donors) + 1,
                avg_donation: parseInt(avgDonation),
                'form_data.remaining_amount': Number(remainingAmount),
                status:
                  totalDonation >= goalAmount
                    ? 'complete'
                    : causeRequest.status,
              },
            };

            const findSetting = await this.commonService.getCommonSetting(
              causeRequest.country_data.country,
            );

            if (
              findSetting &&
              findSetting.form_data.minimum_donation &&
              findSetting.form_data.minimum_donation > remainingAmount
            ) {
              const createData = {
                user_id: transactionData.user_id,
                request_id: transactionData.request_id,
                next_date: new Date(moment().add(1, 'hour').format()),
              };

              const createLastDonor = new this.lastDonorNotificationModel(
                createData,
              );
              await createLastDonor.save();
            }

            const data: any = await this.causeRequestModel
              .findByIdAndUpdate({ _id: causeRequest._id }, updateData, {
                new: true,
              })
              .select({ form_settings: 0 })
              .lean();

            const input: any = {
              title: mConfig.noti_title_Payment_was_successful,
              type: causeRequest.category_slug,
              requestId: causeRequest._id,
              categorySlug: causeRequest.category_slug,
              requestUserId: causeRequest.user_id,
            };

            const updateData1 = {
              '{{donor_name}}': newTransaction.donor_name,
              '{{amount}}':
                newTransaction.country_data &&
                newTransaction.country_data.country == 'India'
                  ? newTransaction.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : newTransaction.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
              '{{user_name}}': causeRequest?.form_data?.title_of_fundraiser,
              '{{currency_symbol}}': newTransaction.currency,
              '{{refId}}': causeRequest.reference_id,
              '{{category}}': newTransaction.category_name,
            };

            const msg1 = await this.commonService.changeString(
              mConfig.noti_msg_donate_amount,
              updateData1,
            );
            //send notification to donor
            const removeNotiIds = [userDetail._id];
            input.message = msg1;
            input.userId = userDetail._id;
            await this.commonService.notification(input);

            //send notification to trustee of donor ngo
            if (newTransaction.is_donor_ngo) {
              const notiUser = await this.commonService.getNgoUserIds(
                newTransaction.donor_id,
                userDetail._id,
              );
              if (notiUser) {
                const msg2 = await this.commonService.changeString(
                  mConfig.noti_msg_ngo_transfer_amount,
                  updateData1,
                );
                input.message = msg2;
                input.userId = notiUser;
                await this.commonService.notification(input);
              }
            }

            //send notification to user
            if (
              !removeNotiIds
                .map((s) => s.toString())
                .includes(causeRequest.user_id.toString())
            ) {
              const donate_my_request = await this.commonService.changeString(
                mConfig.noti_msg_donate_my_request,
                updateData1,
              );
              input.message = donate_my_request;
              input.userId = causeRequest.user_id;
              await this.commonService.notification(input);
            }
            // send notification to Benificiary
            const notiIds = [causeRequest.user_id];
            if (newTransaction.is_user_ngo) {
              const notiUser = await this.commonService.getNgoUserIds(
                causeRequest.user_ngo_id,
                causeRequest.user_id,
              );
              if (
                notiUser &&
                !removeNotiIds
                  .map((s) => s.toString())
                  .includes(notiUser.toString())
              ) {
                const msg3 = await this.commonService.changeString(
                  mConfig.noti_msg_donor_donate_you,
                  updateData1,
                );
                notiIds.push(notiUser);
                input.userId = notiUser;
                input.message = msg3;
                removeNotiIds.push(notiUser);
                this.commonService.notification(input);
              }
            }

            //send notification all auti users
            const msg4 = await this.commonService.changeString(
              mConfig.noti_msg_donor_amount_transfer_to_user,
              updateData1,
            );
            input.message = msg4;
            this.commonService.sendAllUsersNotification(
              removeNotiIds,
              input,
              causeRequest.country_data.country,
              true,
            );

            if (data.status != 'complete') {
              //send notification to admin
              await this.commonService.sendAdminNotification(input);
            }

            if (data.status === 'complete') {
              await this.notificationModel
                .deleteMany({ request_id: causeRequest._id })
                .lean();

              await this.adminNotificationModel
                .deleteMany({ request_id: causeRequest._id })
                .lean();

              const updateData2 = {
                '{{refId}}': data.reference_id,
                '{{total_donation}}': data.total_donation,
                '{{category}}': data.category_name,
              };

              const msg5 = await this.commonService.changeString(
                mConfig.noti_msg_admin_request_fullfill,
                updateData2,
              );

              //send notification to admin
              input.message = msg5;
              await this.commonService.sendAdminNotification(input);

              // send notification to Benificiary
              const msg6 = await this.commonService.changeString(
                mConfig.noti_msg_user_request_fullfill,
                {
                  '{{category}}': data.category_name,
                  '{{refId}}': data.reference_id,
                },
              );
              input.message = msg6;
              await this.commonService.sendAllNotification(notiIds, input);
            }

            data.transactionData = newTransaction;
            return {
              message: mConfig.transaction_success,
              data,
              success: true,
            };
          }
        } else {
          const input: any = {
            title: mConfig.noti_title_payment_failed,
            type: 'payment_failed_makeDonationNew',
            requestId: causeRequest._id,
            categorySlug: causeRequest.category_slug,
            requestUserId: causeRequest.user_id,
            message: mConfig.noti_msg_payment_refused,
            userId: transactionData.user_id,
            additionalData: {
              request_type: 'donation',
              payment_id: transactionData._id,
            },
          };
          //send notification to donor
          this.commonService.notification(input);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donation/donation.service.ts-makeDonationNew',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //et new ngo donations
  public async ngoDonationNew(
    transactionData: any,
    notificationRequest,
    paymentGateway,
  ) {
    try {
      const ngo: any = await this.ngoModel
        .findById({ _id: transactionData.ngo_id })
        .select({ _id: 1, ngo_name: '$form_data.ngo_name' })
        .lean();
      if (!ngo) {
        return {
          message: mConfig.No_data_found,
          success: false,
        };
      } else {
        if (notificationRequest.status === 'success') {
          //add donation data in donation table
          const userDetail = await this.userModel
            .findById({ _id: transactionData.user_id })
            .select({
              _id: 1,
              ngo_data: 1,
              display_name: 1,
              first_name: 1,
              last_name: 1,
            });
          const addDonation: any = {
            user_id: transactionData.ngo_id,
            user_name: ngo?.ngo_name,
            active_type: transactionData.active_type,
            country_data: transactionData.country_data,
            donor_id:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data._id
                : userDetail._id,
            donor_user_id: userDetail._id,
            donor_name:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data.ngo_name
                : userDetail.display_name
                ? userDetail.display_name
                : userDetail.first_name + ' ' + userDetail.last_name,
            amount: transactionData.amount,
            currency: transactionData.country_data.currency,
            is_contribute_anonymously: transactionData.is_contribute_anonymously
              ? transactionData.is_contribute_anonymously
              : false,
            is_tax_benefit: transactionData.is_tax_benefit
              ? transactionData.is_tax_benefit
              : false,
            tax_number: transactionData.tax_number,
            note: transactionData.note,
            manage_fees: transactionData.manage_fees,
            receipt_number: await this.commonService.nextReceiptNum(
              userDetail._id,
            ),
            transaction_type: 'ngo-donation',
            resp: notificationRequest,
            is_user_ngo: true,
            is_donor_ngo: transactionData.active_type === 'ngo' ? true : false,
            tip_included: transactionData.tip_included,
            tip_charge: transactionData.tip_charge,
            tip_amount: transactionData.tip_amount,
            transaction_charge: transactionData.transaction_charge,
            transaction_amount: transactionData.transaction_amount,
            total_amount: transactionData.total_amount,
            payment_status: 'completed',
            campaign_name: ngo?.ngo_name,
            amount_usd: transactionData.amount_usd,
            converted_amt: transactionData.converted_amt,
            converted_total_amt: transactionData.converted_total_amt,
            exchange_rate: transactionData.exchange_rate,
            currency_code: transactionData.currency_code,
            order_code: notificationRequest.order_code,
            reference_id: transactionData._id,
            paymentGateway: notificationRequest.type,
            status: 'completed',
            corporate_id: transactionData.corporate_id,
          };

          // if (paymentGateway === 'adyen') {
          //   addDonation.eventCode = notificationRequest.eventCode;
          //   addDonation.success = notificationRequest.success;
          //   addDonation.pspReference = notificationRequest.pspReference;
          //   addDonation.paymentMethod = notificationRequest.paymentMethod;
          //   // addDonation.reference_id = notificationRequest.merchantReference;
          // } else if (paymentGateway === 'stripe') {
          //   const session = notificationRequest.payment_response;
          //   addDonation.status = session.status;
          //   addDonation.paymentMethod = session.payment_method_types[0];
          //   // addDonation.reference_id = session.client_reference_id;
          // }

          //save new request
          const createData = new this.transactionModel(addDonation);
          const newTransaction: any = await createData.save();
          if (_.isEmpty(newTransaction)) {
            return {
              message: mConfig.Please_try_again,
              success: false,
            };
          } else {
            const input: any = {
              title: mConfig.noti_title_Payment_was_successful,
              type: 'ngo',
              ngoId: transactionData.ngo_id,
            };
            const updateData1 = {
              '{{donor_name}}': newTransaction.donor_name,
              '{{amount}}':
                newTransaction.country_data &&
                newTransaction.country_data.country == 'India'
                  ? newTransaction.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : newTransaction.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
              '{{user_name}}': newTransaction.user_name,
              '{{currency_symbol}}': newTransaction.currency,
              '{{ngo_name}}': newTransaction.campaign_name,
            };
            const msg1 = await this.commonService.changeString(
              mConfig.noti_msg_ngo_donation,
              updateData1,
            );
            const input2: any = {
              title: mConfig.noti_title_ngo_donation,
              type: 'ngo',
              ngoId: transactionData.ngo_id,
              message: msg1,
            };
            const msg2 = await this.commonService.changeString(
              mConfig.noti_msg_donate_amount_to_ngo,
              updateData1,
            );
            //send notification to donor
            const removeNotiIds = [userDetail._id];
            input.message = msg2;
            input.userId = userDetail._id;
            await this.commonService.notification(input);

            //send notification to trustee of donor ngo
            if (newTransaction.is_donor_ngo === true) {
              const notiUser = await this.commonService.getNgoUserIds(
                newTransaction.donor_id,
                userDetail._id,
              );
              if (notiUser) {
                const msg3 = await this.commonService.changeString(
                  mConfig.noti_msg_ngo_transfer_amount,
                  updateData1,
                );
                removeNotiIds.push(notiUser);
                input.message = msg3;
                input.userId = notiUser;
                await this.commonService.notification(input);
              }
            }
            //send notification to user
            const notiUser = await this.commonService.getNgoUserIds(
              newTransaction.user_id,
            );
            if (notiUser) {
              updateData1['{{category}}'] = 'NGO';
              const msg = await this.commonService.changeString(
                mConfig.noti_msg_donate_my_ngo_request,
                updateData1,
              );
              input.message = msg;
              this.commonService.sendAllNotification(notiUser, input);
            }
            //send notification all auti users
            this.commonService.sendAllUsersNotification(
              removeNotiIds,
              input2,
              null,
              true,
            );
            //send notification to admin
            this.commonService.sendAdminNotification(input2);
            return {
              message: mConfig.transaction_success,
              success: true,
            };
          }
        } else {
          const input: any = {
            title: mConfig.noti_title_payment_failed,
            type: 'payment_failed_ngoDonationNew',
            ngoId: transactionData.ngo_id,
            message: mConfig.noti_msg_payment_refused,
            userId: transactionData.user_id,
            additionalData: {
              request_type: 'ngo-donation',
              payment_id: transactionData._id,
            },
          };
          //send notification to donor
          this.commonService.notification(input);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donation/donation.service.ts-ngoDonationNew',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }

  //handle new funds
  public async fundNew(
    transactionData: any,
    notificationRequest,
    paymentGateway,
  ) {
    try {
      const fundData: any = await this.fundModel.aggregate([
        { $match: { _id: ObjectID(transactionData.fund_id) } },
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
            user_id: 1,
            title_of_fundraiser: '$form_data.title_of_fundraiser',
            user_name: {
              $concat: ['$userData.first_name', ' ', '$userData.last_name'],
            },
          },
        },
      ]);
      if (_.isEmpty(fundData) && _.isEmpty(fundData[0])) {
        return {
          message: mConfig.No_data_found,
          success: false,
        };
      } else {
        if (notificationRequest.status === 'success') {
          //add donation data in donation table
          const userDetail = await this.userModel
            .findById({ _id: ObjectID(transactionData.user_id) })
            .select({
              _id: 1,
              ngo_data: 1,
              display_name: 1,
              first_name: 1,
              last_name: 1,
            })
            .lean();
          const addDonation: any = {
            user_id: fundData[0].user_id,
            user_name: fundData[0].user_name,
            active_type: transactionData.active_type,
            country_data: transactionData.country_data,
            donor_id:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data._id
                : userDetail._id,
            donor_user_id: userDetail._id,
            donor_name:
              transactionData.active_type === 'ngo'
                ? userDetail.ngo_data.ngo_name
                : userDetail.display_name
                ? userDetail.display_name
                : userDetail.first_name + ' ' + userDetail.last_name,
            to_fund_id: fundData[0]._id,
            amount: transactionData.amount,
            currency: transactionData.country_data.currency,
            is_contribute_anonymously: transactionData.is_contribute_anonymously
              ? transactionData.is_contribute_anonymously
              : false,
            is_tax_benefit: transactionData.is_tax_benefit
              ? transactionData.is_tax_benefit
              : false,
            tax_number: transactionData.tax_number,
            note: transactionData.note,
            receipt_number: await this.commonService.nextReceiptNum(
              userDetail._id,
            ),
            transaction_type: 'fund-donated',
            resp: notificationRequest,
            is_user_ngo: false,
            is_donor_ngo: transactionData.active_type === 'ngo' ? true : false,
            tip_included: transactionData.tip_included,
            tip_charge: transactionData.tip_charge,
            tip_amount: transactionData.tip_amount,
            transaction_charge: transactionData.transaction_charge,
            transaction_amount: transactionData.transaction_amount,
            total_amount: transactionData.total_amount,
            campaign_name: fundData[0].title_of_fundraiser,
            payment_status: 'completed',
            manage_fees: transactionData.manage_fees,
            amount_usd: transactionData.amount_usd,
            converted_amt: transactionData.converted_amt,
            converted_total_amt: transactionData.converted_total_amt,
            exchange_rate: transactionData.exchange_rate,
            currency_code: transactionData.currency_code,
            order_code: notificationRequest.order_code,
            reference_id: transactionData._id,
            paymentGateway: notificationRequest.type,
            status: 'completed',
            corporate_id: transactionData.corporate_id,
          };
          // if (paymentGateway === 'adyen') {
          //   addDonation.eventCode = notificationRequest.eventCode;
          //   addDonation.success = notificationRequest.success;
          //   addDonation.pspReference = notificationRequest.pspReference;
          //   addDonation.paymentMethod = notificationRequest.paymentMethod;
          //   // addDonation.reference_id = notificationRequest.merchantReference;
          // } else if (paymentGateway === 'stripe') {
          //   const session = notificationRequest.payment_response;
          //   addDonation.status = session.status;
          //   addDonation.paymentMethod = session.payment_method_types[0];
          //   // addDonation.reference_id = session.client_reference_id;
          // }
          const createDonateData = await new this.transactionModel(addDonation);
          await createDonateData.save();
          delete addDonation.to_fund_id;
          addDonation.transaction_type = 'fund-received';
          addDonation.fund_id = fundData[0]._id;
          //save new request
          const createReceiveData = new this.transactionModel(addDonation);
          const newTransaction: any = await createReceiveData.save();
          if (_.isEmpty(newTransaction)) {
            return {
              message: mConfig.Please_try_again,
              success: false,
            };
          } else {
            //send notification as per requirement
            return {
              message: mConfig.transaction_success,
              data: newTransaction,
              success: true,
            };
          }
        } else {
          const input: any = {
            title: mConfig.noti_title_payment_failed,
            type: 'payment_failed_',
            requestId: fundData[0]._id,
            categorySlug: 'fund',
            requestUserId: fundData[0].user_id,
            message: mConfig.noti_msg_payment_refused,
            userId: transactionData.user_id,
            additionalData: {
              request_type: 'fund-donated',
              payment_id: transactionData._id,
            },
          };
          //send notification to donor
          this.commonService.notification(input);
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/donation/donation.service.ts-fundNew',
      );
      return {
        success: false,
        message: mConfig.Something_went_wrong,
      };
    }
  }
}
