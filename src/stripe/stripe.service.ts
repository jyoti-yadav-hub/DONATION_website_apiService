import fs = require('fs');
import { _ } from 'lodash';
import moment from 'moment';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import mConfig from '../config/message.config.json';
import { Inject, Injectable } from '@nestjs/common';
import { CommonService } from '../common/common.service';
import { ErrorlogService } from '../controller/error-log/error-log.service';
import { User, UserDocument } from '../controller/users/entities/user.entity';
import { authConfig } from 'src/config/auth.config';
const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
const stripe = require('stripe')(process.env.stripeToken);
@Injectable()
export class StripeService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  //Common function for get stripe token
  async getStripeToken() {
    // let settingDistance = await commonService.getSettingFromKey({
    //     slug: 'stripe_secret_key'
    // });

    // if (!_.isEmpty(settingDistance) && settingDistance.value) {
    // stripeToken = settingDistance.value;
    const stripeToken = process.env.stripeToken;
    // }
    return stripeToken;
  }

  // Common function for create stripe user/customer
  async createStripeUser(newObj) {
    try {
      const customer = await stripe.customers.create(newObj);
      return customer.id;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/stripe/stripe.service.ts-createCharge',
      );
    }
  }

  // Common function for create stripe charge
  async createCharge(data) {
    let charge: any = {};
    try {
      charge = await stripe.charges.create({
        amount: data.amount * 100,
        currency: 'eur',
        description: 'charges',
        source: data.token,
        // statement_descriptor: "Custom descriptor"
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/stripe/stripe.service.ts-createCharge',
      );
      charge.status = 'failed';
    }
    return charge;
  }

  //This function is used to return customer stripe id
  async stripeUserId(userData) {
    try {
      if (
        userData.stripe_customer_id &&
        !_.isUndefined(userData.stripe_customer_id)
      ) {
        return userData.stripe_customer_id;
      } else {
        const newObj = {
          phone: userData.phone,
          name: userData.first_name + ' ' + userData.last_name,
          email: userData.email,
        };

        // create and store stipe customer id
        const stripeCustomerId = await this.createStripeUser(newObj);

        const subData = {
          userId: userData._id,
          stripId: stripeCustomerId,
        };

        this.errorlogService.createApiLog(
          this.request.originalUrl,
          'post',
          subData,
        );

        await this.userModel
          .updateOne(
            { _id: userData._id },
            {
              $set: {
                stripe_customer_id: stripeCustomerId,
              },
            },
          )
          .lean();

        return stripeCustomerId;
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/stripe/stripe.service.ts-stripeUserId',
      );
      return {
        success: false,
        error: mConfig.Something_went_wrong,
      };
    }
  }

  //This function is used to return customer stripe account id
  async createStripeAccount(userData, bankData) {
    try {
      // If the user already has an account, return the existing Stripe account ID
      if (
        userData.stripe_account_id &&
        !_.isUndefined(userData.stripe_account_id)
      ) {
        return userData.stripe_account_id;
      } else {
        // If the user does not have a Stripe account, create a new one
        const timenow = moment().format('X');
        const createAccount = await stripe.accounts.create({
          type: 'custom',
          business_type: 'individual',
          email: userData.email,
          capabilities: {
            card_payments: {
              requested: true,
            },
            transfers: {
              requested: true,
            },
          },
          business_profile: {
            mcc: 8398,
            url: 'auti.com',
          },
          individual: {
            address: {
              city: 'New York',
              line1: '66 Perry Street, West Village',
              postal_code: '10014',
              state: 'New York',
            },
            id_number: userData._id,
            email: userData.email,
            ssn_last_4: '0000',
            dob: {
              day: 11,
              month: 11,
              year: 1990,
            },
            gender: 'male',
            phone: userData.phone,
            first_name: userData.first_name,
            last_name: userData.last_name,
          },
          tos_acceptance: {
            date: timenow,
            ip: '163.135.0.235',
          },
          external_account: {
            object: 'bank_account',
            country: 'US', //Required
            currency: 'USD', //Required
            account_holder_name: bankData.form_data.bank_account_name,
            account_number: bankData.form_data.bank_account_number, //Required
            routing_number: '110000000',
          },
        });
        if (!createAccount) {
          // Handle the case where the account creation failed
          return {
            success: false,
            error: mConfig.Please_try_again,
          };
        } else {
          const doc = bankData.form_data.files.photos[0];
          const filePath = authConfig.imageUrl + 'bank-doc/' + doc;
          // const uploadDocument = await stripe.files.create(
          //   {
          //     purpose: 'identity_document',
          //     file: {
          //       data: fs.readFileSync(filePath),
          //       name: doc,
          //       type: 'application/octet-stream',
          //     },
          //   },
          //   {
          //     stripeAccount: createAccount.id,
          //   },
          // );

          // Verify document with user
          // await stripe.accounts.updatePerson(
          //   createAccount.id,
          //   createAccount.individual.id,
          //   { verification: { document: { front: uploadDocument.id } } },
          // );

          await this.userModel
            .findByIdAndUpdate(
              { _id: userData._id },
              { $set: { stripe_account_id: createAccount.id } },
            )
            .select({ _id: 1 })
            .lean();
        }
        return createAccount.id;
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/stripe/stripe.service.ts-createStripeAccount',
      );
      return {
        success: false,
        error: mConfig.Something_went_wrong,
      };
    }
  }

  async transferAmountToAccount(transferAmount, id) {
    try {
      // Create a transfer to the specified destination (Stripe account)
      const response = await stripe.transfers.create({
        amount: transferAmount,
        currency: 'usd',
        destination: id,
      });
      if (!response) {
        return {
          success: false,
          error: mConfig.Please_try_again,
        };
      } else {
        return response;
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/stripe/stripe.service.ts-transferAmountToAccount',
      );
      return {
        success: false,
        error: mConfig.Something_went_wrong,
      };
    }
  }
}
