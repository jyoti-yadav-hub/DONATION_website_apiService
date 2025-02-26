import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import {
  CurrencyModel,
  CurrencyDocument,
} from '../currency/entities/currency.entity';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from '../../config/auth.config';
import { LinkBankDto } from './dto/link-bank.dto';
import { Inject, Injectable } from '@nestjs/common';
import { VerifyBankDto } from './dto/verify-bank.dto';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import mConfig from '../../config/message.config.json';
import { Bank, BankDocument } from './entities/bank.entity';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateManageBankDto } from './dto/create-manageBank.dto';
import { UpdateManageBankDto } from './dto/update-manageBank.dto';
import { ManageBank, ManageBankDocument } from './entities/manage-bank.entity';
import {
  RequestModel,
  RequestDocument,
} from '../request/entities/request.entity';
import { Ngo, NgoDocument } from '../ngo/entities/ngo.entity';
import {
  Notification,
  NotificationDocument,
} from '../notification/entities/notification.entity';
import { LogService } from 'src/common/log.service';
import fs from 'fs';

const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class BankService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(CurrencyModel.name)
    private currencyModel: Model<CurrencyDocument>,
    @InjectModel(ManageBank.name)
    private ManageBankModel: Model<ManageBankDocument>,
    @InjectModel(Bank.name) private BankModel: Model<BankDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(Ngo.name)
    private ngoModel: Model<NgoDocument>,
  ) {}

  //Api for add/create bank from app
  public async saveBankDetail(
    createBankDto: CreateBankDto,
    res: any,
  ): Promise<BankDocument> {
    try {
      //Parse the json data
      let data = JSON.parse(createBankDto.form_data);

      const userData = this.request.user;
      const userName = userData.display_name
        ? userData.display_name
        : userData.first_name + ' ' + userData.last_name;

      const formData: any = {
        country: createBankDto.country,
        country_code: createBankDto.country_code,
        status: 'pending',
        user_id: userData._id,
        form_data: {
          files: {},
          images: {},
        },
      };

      let haveError = false;
      //Validating form inputs
      data.map(async (item: any, mainIndex: number) => {
        const inputs = item.inputs;
        inputs.map(async (input, inputIndex) => {
          let inputError = false;
          let havetoCheck = true;

          / check either input is depend on another input or not /;
          if (input?.is_dependant && input?.dependant_type) {
            let dependantData: any;
            data.map((it: any) => {
              if (it?.inputs) {
                it.inputs.map((subIt: any) => {
                  if (
                    subIt?.input_slug &&
                    subIt?.input_slug == input?.dependant_type
                  ) {
                    dependantData = subIt;
                  }
                });
              } else {
                if (it?.input_slug && it?.input_slug == input?.dependant_type) {
                  dependantData = it;
                }
              }
            });
            if (
              !_.isEmpty(dependantData) &&
              (((input?.dependant_value == 'false' ||
                input?.dependant_value == '') &&
                (!dependantData?.value ||
                  dependantData?.value == 'false' ||
                  dependantData?.value == '')) ||
                (input?.dependant_value == 'true' &&
                  dependantData?.value &&
                  (dependantData?.value == 'true' ||
                    dependantData?.value != '')))
            ) {
              // Do nothing
            } else {
              havetoCheck = false;
            }
          }
          if (havetoCheck) {
            // Check if the input is not empty for specific input types
            if (
              _.includes(
                [
                  'string',
                  'number',
                  'textarea',
                  'checkbox',
                  'radio',
                  'select',
                  'date',
                ],
                input.input_type,
              )
            ) {
              if (
                input.is_required &&
                (_.isEmpty(input.value) ||
                  _.isUndefined(input.value) ||
                  !input.value)
              ) {
                let displayError = true;
                // Special handling for checkboxes if multiselect is disabled
                if (
                  input.input_type === 'checkbox' &&
                  input.multiselect === false &&
                  input.value
                ) {
                  displayError = false;
                }
                if (displayError) {
                  // Set an error message based on input type
                  data[mainIndex].inputs[inputIndex].error = _.includes(
                    ['checkbox', 'radio', 'select'],
                    input.input_type,
                  )
                    ? `Select any option for ${input.title}.`
                    : `${input.title} can not be empty.`;
                  haveError = true;
                  inputError = true;
                  data[mainIndex].inputs[inputIndex].haveError = true;
                }
              }
            }
            // Check min max validation
            if (
              !inputError &&
              _.includes(['string', 'number', 'textarea'], input.input_type) &&
              input.value
            ) {
              let len = input.value ? _.size(input.value) : 0;
              if (
                input.input_type === 'number' &&
                input.input_slug !== 'bank_account_number' &&
                !input.is_mobile
              ) {
                len = input.value;
              }
              if (parseInt(input.min) > 0) {
                if (parseInt(input.min) > len) {
                  data[mainIndex].inputs[
                    inputIndex
                  ].error = `${input.title} must be greater than ${input.min}.`;
                  haveError = true;
                  inputError = true;
                  data[mainIndex].inputs[inputIndex].haveError = true;
                }
              }
              if (!inputError && parseInt(input.max) > 0) {
                if (parseInt(input.max) < len) {
                  data[mainIndex].inputs[
                    inputIndex
                  ].error = `${input.title} must be less than ${input.max}.`;
                  haveError = true;
                  inputError = true;
                  data[mainIndex].inputs[inputIndex].haveError = true;
                }
              }
            }
            //Validate location input
            if (input.input_type === 'location') {
              if (input.is_required && _.isEmpty(input.value)) {
                data[mainIndex].inputs[inputIndex].error =
                  'Please select location.';
                data[mainIndex].inputs[inputIndex].haveError = true;
                haveError = true;
                inputError = true;
              } else if (
                input.value &&
                (_.isUndefined(input.value.longitude) ||
                  input.value.longitude === 0 ||
                  !input.value.longitude ||
                  _.isUndefined(input.value.latitude) ||
                  input.value.latitude === 0 ||
                  !input.value.latitude ||
                  _.isUndefined(input.value.city) ||
                  !input.value.city)
              ) {
                data[mainIndex].inputs[inputIndex].error =
                  'Please select proper location.';
                data[mainIndex].inputs[inputIndex].haveError = true;
                haveError = true;
                inputError = true;
              }
            }
            //Validate file input
            if (input.input_type === 'file') {
              if (input.is_required && _.isEmpty(input.value)) {
                data[mainIndex].inputs[
                  inputIndex
                ].error = `${input.title} can not be empty.`;
                data[mainIndex].inputs[inputIndex].haveError = true;
                haveError = true;
                inputError = true;
              } else if (parseInt(input.min) > 0 && input.value) {
                const len = input.value ? _.size(input.value) : 0;
                if (parseInt(input.min) > len) {
                  data[mainIndex].inputs[
                    inputIndex
                  ].error = `Please upload atleast ${input.min} file${
                    input.min > 1 ? 's' : ''
                  } in ${input.title}.`;
                  data[mainIndex].inputs[inputIndex].haveError = true;
                  haveError = true;
                  inputError = true;
                }
              } else if (parseInt(input.max) > 0 && input.value) {
                const len = input.value ? _.size(input.value) : 0;
                if (parseInt(input.max) < len) {
                  data[mainIndex].inputs[
                    inputIndex
                  ].error = `${input.title} must be less than ${input.max}.`;
                  data[mainIndex].inputs[inputIndex].haveError = true;
                  haveError = true;
                  inputError = true;
                }
              }
            }
          }
          //If there is not any error then append value in formData object
          if (!inputError && input.value) {
            if (input.input_type === 'location') {
              formData[input.input_slug] = {
                type: 'Point',
                coordinates: [input.value.longitude, input.value.latitude],
                city: input.value.city,
              };
            } else if (input.input_type === 'file') {
              if (input.value) {
                const filesArray = input.value;
                const existFiles = [];
                //Check file exist in temp folder or not
                filesArray.map((fileName) => {
                  const filePath = './uploads/temp/' + fileName;
                  if (fs.existsSync(filePath)) {
                    existFiles.push(fileName);
                  }
                });
                formData.form_data.files[input.input_slug] = existFiles;
              }
              if (!haveError && input.images) {
                input.images.map((imagesList: any, imagesIndex: number) => {
                  if (imagesList.OriginalName) {
                    input.images[imagesIndex].path = imagesList.OriginalName;
                    input.images[imagesIndex].server = true;
                    input.images[imagesIndex].image_url =
                      authConfig.imageUrl + 'bank-doc/';
                  }
                });
                data[mainIndex].inputs[inputIndex].images = input.images;
                formData.form_data.images[input.input_slug] = input.images;
              }
            } else {
              formData.form_data[input.input_slug] = input.value;
            }
          }
        });
      });
      data = JSON.stringify(data);
      formData.form_settings = data;
      if (haveError) {
        //If any error then throw
        return res.json({
          success: false,
          data,
        });
      }
      if (formData.form_data && formData.form_data.files) {
        const files = formData.form_data.files;

        // All images are in "formData.files" move upload images rom tmp to request folder
        for (const key in files) {
          files[key].map(async (item) => {
            await this.commonService.uploadFileOnS3(item, 'bank-doc');
          });
        }
      }

      //Create bank
      const createBank = new this.BankModel(formData);
      const response = await createBank.save();
      if (_.isEmpty(response)) {
        return res.json({
          success: true,
          message: mConfig.Please_try_again,
        });
      } else {
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_bank_details,
          { '{{uname}}': userName, '{{type}}': 'added' },
        );

        //send notification to admin
        const input: any = {
          title: mConfig.noti_title_add_bank,
          type: 'bank',
          message: msg,
        };
        this.commonService.sendAdminNotification(input);

        return res.json({
          success: true,
          message: mConfig.Bank_details_added,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-saveBankDetail',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update bank from app
  public async updateBank(
    id: string,
    updateBankDto: UpdateBankDto,
    res: any,
  ): Promise<BankDocument> {
    try {
      //Parse the data
      let data = JSON.parse(updateBankDto.form_data);
      const formData: any = {
        form_data: {
          files: {},
          images: {},
        },
      };

      const userData = this.request.user;
      const userName = userData.display_name
        ? userData.display_name
        : userData.first_name + ' ' + userData.last_name;

      let haveError = false;
      data.map(async (item: any, mainIndex: number) => {
        const inputs = item.inputs;
        inputs.map(async (input, inputIndex) => {
          let inputError = false;
          if (
            _.includes(
              [
                'string',
                'number',
                'textarea',
                'checkbox',
                'radio',
                'select',
                'date',
              ],
              input.input_type,
            )
          ) {
            if (
              input.is_required &&
              (_.isEmpty(input.value) ||
                _.isUndefined(input.value) ||
                !input.value)
            ) {
              let displayError = true;
              if (
                input.input_type === 'checkbox' &&
                input.multiselect === false &&
                input.value
              ) {
                displayError = false;
              }
              if (displayError) {
                data[mainIndex].inputs[inputIndex].error = _.includes(
                  ['checkbox', 'radio', 'select'],
                  input.input_type,
                )
                  ? `Select any option for ${input.title}.`
                  : `${input.title} can not be empty.`;
                haveError = true;
                inputError = true;
                data[mainIndex].inputs[inputIndex].haveError = true;
              }
            }
          }
          if (
            !inputError &&
            _.includes(['string', 'number', 'textarea'], input.input_type) &&
            input.value
          ) {
            let len = input.value ? _.size(input.value) : 0;
            if (
              input.input_type === 'number' &&
              input.input_slug !== 'bank_account_number' &&
              !input.is_mobile
            ) {
              len = input.value;
            }
            if (parseInt(input.min) > 0) {
              if (parseInt(input.min) > len) {
                data[mainIndex].inputs[
                  inputIndex
                ].error = `${input.title} must be greater than ${input.min}.`;
                haveError = true;
                inputError = true;
                data[mainIndex].inputs[inputIndex].haveError = true;
              }
            }
            if (!inputError && parseInt(input.max) > 0) {
              if (parseInt(input.max) < len) {
                data[mainIndex].inputs[
                  inputIndex
                ].error = `${input.title} must be less than ${input.max}.`;
                haveError = true;
                inputError = true;
                data[mainIndex].inputs[inputIndex].haveError = true;
              }
            }
          }
          if (input.input_type === 'location') {
            if (input.is_required && _.isEmpty(input.value)) {
              data[mainIndex].inputs[inputIndex].error =
                'Please select location.';
              data[mainIndex].inputs[inputIndex].haveError = true;
              haveError = true;
              inputError = true;
            } else if (
              input.value &&
              (_.isUndefined(input.value.longitude) ||
                input.value.longitude === 0 ||
                !input.value.longitude ||
                _.isUndefined(input.value.latitude) ||
                input.value.latitude === 0 ||
                !input.value.latitude ||
                _.isUndefined(input.value.city) ||
                !input.value.city)
            ) {
              data[mainIndex].inputs[inputIndex].error =
                'Please select proper location.';
              data[mainIndex].inputs[inputIndex].haveError = true;
              haveError = true;
              inputError = true;
            }
          }
          if (input.input_type === 'file') {
            if (input.is_required && _.isEmpty(input.value)) {
              data[mainIndex].inputs[
                inputIndex
              ].error = `${input.title} can not be empty.`;
              data[mainIndex].inputs[inputIndex].haveError = true;
              haveError = true;
              inputError = true;
            } else if (parseInt(input.min) > 0 && input.value) {
              const len = input.value ? _.size(input.value) : 0;
              if (parseInt(input.min) > len) {
                data[mainIndex].inputs[
                  inputIndex
                ].error = `Please upload atleast ${input.min} file${
                  input.min > 1 ? 's' : ''
                } in ${input.title}.`;
                data[mainIndex].inputs[inputIndex].haveError = true;
                haveError = true;
                inputError = true;
              }
            } else if (parseInt(input.max) > 0 && input.value) {
              const len = input.value ? _.size(input.value) : 0;
              if (parseInt(input.max) < len) {
                data[mainIndex].inputs[
                  inputIndex
                ].error = `${input.title} must be less than ${input.max}.`;
                data[mainIndex].inputs[inputIndex].haveError = true;
                haveError = true;
                inputError = true;
              }
            }
          }
          if (!inputError) {
            if (input.input_type === 'location') {
              formData[input.input_slug] = {
                type: 'Point',
                coordinates: [input.value.longitude, input.value.latitude],
                city: input.value.city,
              };
            } else if (input.input_type === 'file') {
              if (input.value) {
                formData.form_data.files[input.input_slug] = input.value;
              }
              if (!haveError && input.images) {
                input.images.map((imagesList: any, imagesIndex: number) => {
                  if (imagesList.OriginalName) {
                    input.images[imagesIndex].path = imagesList.OriginalName;
                    input.images[imagesIndex].server = true;
                    input.images[imagesIndex].image_url =
                      authConfig.imageUrl + 'bank-doc/';
                  }
                });
                data[mainIndex].inputs[inputIndex].images = input.images;
                formData.form_data.images[input.input_slug] = input.images;
              }
            } else {
              formData.form_data[input.input_slug] = input.value;
            }
          }
        });
      });
      data = JSON.stringify(data);
      formData.form_settings = data;
      if (haveError) {
        return res.json({
          success: false,
          data,
        });
      }

      if (formData.form_data && formData.form_data.files) {
        const files = formData.form_data.files;

        //upload files in request folder
        for (const key in files) {
          files[key].map(async (item) => {
            await this.commonService.uploadFileOnS3(item, 'bank-doc');
          });
        }
      }

      // Remove files from request folder
      if (
        !_.isEmpty(updateBankDto.removed_files) &&
        updateBankDto.removed_files
      ) {
        const removedFiles = updateBankDto.removed_files;
        await Promise.all(
          removedFiles.map(async (item: any) => {
            await this.commonService.s3ImageRemove('bank-doc', item);
          }),
        );
      }
      const updateData: any = {
        status: 'pending',
        form_settings: formData.form_settings,
        form_data: formData.form_data,
      };

      const result = await this.BankModel.findByIdAndUpdate(
        id,
        {
          $set: updateData,
        },
        {
          new: true,
        },
      )
        .select({ _id: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const msg = await this.commonService.changeString(
          mConfig.noti_msg_bank_details,
          { '{{uname}}': userName, '{{type}}': 'updated' },
        );

        const input: any = {
          title: mConfig.noti_title_update_bank_details,
          type: 'bank',
          message: msg,
        };
        this.commonService.sendAdminNotification(input);

        return res.json({
          message: mConfig.Bank_details_updated,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-updateBank',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete bank in app
  public async deleteBank(
    id: string,
    type: string,
    res: any,
  ): Promise<BankDocument> {
    try {
      const userData = this.request.user;
      const userName = userData.display_name
        ? userData.display_name
        : userData.first_name + ' ' + userData.last_name;
      const result: any = await this.BankModel.findById(id)
        .select({ form_data: 1, _id: 1 })
        .lean();

      if (_.isEmpty(result)) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const requestData: any = await this.requestModel
          .find({ user_id: userData._id, bank_id: id })
          .select({ _id: 1, status: 1 })
          .lean();
        if (type === 'delete' && requestData.length > 0) {
          if (requestData.status == 'close') {
            return res.json({
              success: false,
              message: mConfig.bank_already_linked_in_close_request,
            });
          } else {
            return res.json({
              success: false,
              message: mConfig.bank_already_linked_in_request,
              alreadyLinkBank: true,
            });
          }
        } else {
          if (requestData.length > 0) {
            requestData.map(async (req) => {
              await this.requestModel.findByIdAndUpdate(
                { _id: req._id },
                { bank_id: null },
              );
            });
          }

          if (
            !_.isEmpty(result.form_data) &&
            !_.isEmpty(result.form_data.files)
          ) {
            const files = result.form_data.files;

            //upload files in request folder
            for (const key in files) {
              files[key].map(async (item) => {
                await this.commonService.s3ImageRemove('bank-doc', item);
              });
            }
          }
          await this.BankModel.findByIdAndDelete(id).exec();

          const msg = await this.commonService.changeString(
            mConfig.noti_msg_bank_details,
            { '{{uname}}': userName, '{{type}}': 'removed' },
          );

          const input: any = {
            title: mConfig.noti_title_Remove_bank,
            type: 'bank',
            message: msg,
          };
          this.commonService.sendAdminNotification(input);
          return res.json({
            message: mConfig.Bank_details_removed,
            success: true,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-deleteBank',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list users bank in app
  public async bankList(param, res: any): Promise<BankDocument[]> {
    try {
      const userData = this.request.user;
      const query: any = {
        user_id: userData._id,
      };

      if (param && param.approve == 1) {
        query.status = 'approve';
      }

      if (
        param.filter &&
        !_.isUndefined(param.filter) &&
        param.filter != 'all'
      ) {
        query['form_data.bank_account_as.option_slug'] = param.filter;
      }

      //Find all banks
      const data: any = await this.BankModel.find(query)
        .select({ form_settings: 0 })
        .lean();

      //Find bank with user_id filter
      const data2: any = await this.BankModel.find({ user_id: userData._id })
        .select({ bank_account_as: '$form_data.bank_account_as' })
        .lean();

      let OptionSlugs = [];
      if (!_.isEmpty(data2)) {
        OptionSlugs = data2.map((d) => d?.bank_account_as?.option_slug);
      }

      //Return array for display display filter in app
      const filters = [
        {
          id: 1,
          name: 'All',
          display: true,
          option_slug: 'all',
        },
        {
          id: 2,
          name: 'Me',
          display: OptionSlugs.includes('my_self') ? true : false,
          option_slug: 'my_self',
        },
        {
          id: 3,
          name: 'Someone',
          display: OptionSlugs.includes('someone_else') ? true : false,
          option_slug: 'someone_else',
        },
        {
          id: 4,
          name: 'NGO',
          display: OptionSlugs.includes('ngo_bank_details') ? true : false,
          option_slug: 'ngo_bank_details',
        },
        {
          id: 5,
          name: 'FCRA',
          display: OptionSlugs.includes('fcra_bank_details') ? true : false,
          option_slug: 'fcra_bank_details',
        },
      ];
      return res.json({
        success: true,
        data,
        filters,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-bankList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list user bank in request
  public async requestBanklists(filter, res: any): Promise<BankDocument[]> {
    try {
      const userData = this.request.user;
      const query: any = {
        user_id: userData._id,
        'form_data.bank_account_as.option_slug': filter,
        status: 'approve',
      };

      if (
        filter == 'ngo_bank_details' &&
        userData?.ngo_data?.upload_FCRA_certificate == true
      ) {
        query['form_data.bank_account_as.option_slug'] = {
          $in: ['ngo_bank_details', 'fcra_bank_details'],
        };
      }

      const data: any = await this.BankModel.find(query)
        .select({ form_settings: 0 })
        .lean();

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-requestBanklists',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for bank list in admin
  public async adminBankList(param, res: any): Promise<BankDocument[]> {
    try {
      const match = { is_deleted: { $exists: false } };
      const lookup = {
        $lookup: {
          from: 'user', // collection name in db
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData',
        },
      };
      const filter = !_.isEmpty(param) ? param : [];
      const operator = param.operator ? param.operator.trim() : '=';
      //Filter
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        if (!_.isUndefined(filter._id) && filter._id) {
          const query = await this.commonService.filter(
            'contains',
            filter._id,
            '_id',
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

        if (!_.isUndefined(filter.country) && filter.country) {
          const query = await this.commonService.filter(
            'contains',
            filter.country,
            'country',
          );
          where.push(query);
        }

        if (
          !_.isUndefined(filter.bank_account_name) &&
          filter.bank_account_name
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.bank_account_name,
            'form_data.bank_account_name',
          );
          where.push(query);
        }

        if (
          !_.isUndefined(filter.bank_account_number) &&
          filter.bank_account_number
        ) {
          const query = await this.commonService.filter(
            'contains',
            filter.bank_account_number,
            'form_data.bank_account_number',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.bank_name) && filter.bank_name) {
          const query = await this.commonService.filter(
            'contains',
            filter.bank_name,
            'form_data.bank_name',
          );
          where.push(query);
        }

        if (!_.isUndefined(filter.ifsc_code) && filter.ifsc_code) {
          const query = await this.commonService.filter(
            'contains',
            filter.ifsc_code,
            'form_data.ifsc_code',
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
        if (!_.isUndefined(filter.bank_account_as) && filter.bank_account_as) {
          const query = await this.commonService.filter(
            'contains',
            filter.bank_account_as,
            'form_data.bank_account_as.value',
          );
          where.push(query);
        }

        //Global filter on data
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'user_name',
            'country',
            'form_data.bank_account_name',
            'form_data.bank_account_number',
            'form_data.bank_account_as.value',
            'form_data.bank_name',
            'form_data.ifsc_code',
            'createdAt',
            'status',
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
        user_name: 'user_name',
        country: 'country',
        bank_account_name: 'form_data.bank_account_name',
        bank_account_number: 'form_data.bank_account_number',
        bank_name: 'form_data.bank_name',
        ifsc_code: 'form_data.ifsc_code',
        createdAt: 'createdAt',
        status: 'status',
        bank_account_as: 'form_data.bank_account_as.value',
      };

      //Find total bank account
      const total = await this.BankModel.aggregate([
        lookup,
        { $match: match },
        { $count: 'count' },
      ]).exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      //This function will perform pagination
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

      //List all bank account
      const data = await this.BankModel.aggregate(
        [
          lookup,
          { $unwind: '$userData' },
          {
            $addFields: {
              user_name: {
                $concat: ['$userData.first_name', ' ', '$userData.last_name'],
              },
            },
          },
          { $match: match },
          { $sort: sort },
          {
            $project: {
              _id: 1,
              user_id: 1,
              user_name: 1,
              status: 1,
              country: 1,
              image_url: authConfig.imageUrl + 'bank-doc/',
              form_data: 1,
              createdAt: 1,
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
        'src/controller/bank/bank.service.ts-adminBankList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for find bank added in request
  public async ngoBankDetail(id: string, res: any): Promise<BankDocument> {
    try {
      const query = { _id: ObjectID(id) };

      const bankDetail: any = await this.requestModel
        .aggregate([
          {
            $addFields: {
              bankId: { $toObjectId: '$bank_id' },
            },
          },
          {
            $lookup: {
              from: 'bank', // collection name in db
              localField: 'bankId',
              foreignField: '_id',
              as: 'bankData',
            },
          },
          {
            $unwind: '$bankData',
          },
          { $match: query },
          {
            $project: {
              _id: '$bankData._id',
              form_data: '$bankData.form_data',
            },
          },
        ])
        .exec();

      if (!bankDetail) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        if (
          !_.isEmpty(bankDetail) &&
          !_.isUndefined(bankDetail[0].form_data.files) &&
          !_.isUndefined(bankDetail[0].form_data.files.photos)
        ) {
          const file = bankDetail[0].form_data.files.photos;
          //Attach image url
          if (file && file.length > 0) {
            for (let i = 0; i < file.length; i++) {
              const photo = file[i];
              bankDetail[0].form_data.files.photos[i] =
                authConfig.imageUrl + 'bank-doc/' + photo;
            }
          }
        }
        return res.json({
          success: true,
          data: bankDetail,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-ngoBankDetail',
        id,
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get bank form in app
  public async getBankForm(
    country_code: string,
    res: any,
  ): Promise<ManageBank> {
    try {
      //Find bank form by country
      const formData = await this.ManageBankModel.findOne(
        {
          country_code: country_code,
          is_template: { $ne: true },
          is_deleted: { $ne: true },
        },
        { form_data: 1 },
      ).lean();
      if (!_.isEmpty(formData)) {
        return res.json({
          success: true,
          data: formData.form_data,
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
        'src/controller/bank/bank.service.ts-getBankForm',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for create bank country wise form from admin
  public async bankFormCreate(
    createManageBankDto: CreateManageBankDto,
    res: any,
  ): Promise<ManageBankDocument[]> {
    try {
      const adminData = this.request.user;

      let query: object = {
        country_code: createManageBankDto.country_code,
        is_template: { $ne: true },
        is_deleted: { $ne: true },
      };
      if (createManageBankDto.is_template) {
        query = {
          country_code: createManageBankDto.country_code,
          is_deleted: { $ne: true },
          is_template: { $eq: true },
        };
      }
      const findBankform: any = await this.ManageBankModel.findOne(query, {
        _id: 1,
      }).lean();
      if (!_.isEmpty(findBankform)) {
        return res.json({
          message: mConfig.form_exist,
          success: false,
        });
      } else {
        createManageBankDto['createdBy'] = adminData.name;
        createManageBankDto['updatedBy'] = adminData.name;
        //store default form for restore form if lost
        createManageBankDto['restore_form_data'] =
          createManageBankDto.form_data;

        const createManageBank = new this.ManageBankModel(createManageBankDto);
        const result = await createManageBank.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Banks',
          description: createManageBank.is_template
            ? 'Bank Form template has been created successfully.'
            : 'Bank Form has been created successfully.',
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: createManageBank.is_template
            ? mConfig.Template_created
            : mConfig.form_added,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-bankFormCreate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for bank form list in admin
  public async bankFormList(param, res: any): Promise<ManageBankDocument[]> {
    try {
      const match = { is_deleted: { $ne: true } };
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        //Apply filter
        let where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : '=';
        if (!_.isUndefined(filter.type) && filter.type) {
          if (filter.type === 'template') {
            where.push({ is_template: true });
          } else {
            where.push({ is_template: { $ne: true } });
          }
        }
        if (!_.isUndefined(filter.country) && filter.country) {
          const query = await this.commonService.filter(
            operator,
            filter.country,
            'country',
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
        if (!_.isUndefined(filter.updatedAt) && filter.updatedAt) {
          const query = await this.commonService.filter(
            'date',
            filter.updatedAt,
            'updatedAt',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.createdBy) && filter.createdBy) {
          const query = await this.commonService.filter(
            'is',
            filter.createdBy,
            'createdBy',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.updatedBy) && filter.updatedBy) {
          const query = await this.commonService.filter(
            'is',
            filter.updatedBy,
            'updatedBy',
          );
          where.push(query);
        }

        //Global filter on data
        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'country',
            'createdAt',
            'updatedAt',
            'createdBy',
            'updatedBy',
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
        country: 'country',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };

      //Find total count
      const total = await this.ManageBankModel.aggregate([
        { $match: match },
        { $count: 'count' },
      ]).exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      //This function will perform pagination
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

      //List all bank form
      const result = await this.ManageBankModel.aggregate(
        [
          { $match: match },
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
        'src/controller/bank/bank.service.ts-bankFormLst',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update bank form
  public async updateBankForm(
    id: string,
    updateManageBankDto: UpdateManageBankDto,
    res: any,
  ): Promise<ManageBankDocument[]> {
    try {
      const adminData = this.request.user;

      updateManageBankDto['updatedBy'] = adminData.name;
      updateManageBankDto['is_deleted'] = false;

      //store default form for restore it if lost
      if (updateManageBankDto.store_form) {
        updateManageBankDto['restore_form_data'] =
          updateManageBankDto.form_data;
      }

      //Find form by id and update
      const result = await this.ManageBankModel.findByIdAndUpdate(
        id,
        updateManageBankDto,
        { new: true },
      )
        .select({ _id: 1, is_template: 1 })
        .lean();
      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //Add Activity Log
      const logData = {
        action: 'update',
        entity_id: result._id,
        entity_name: 'Banks',
        description: result.is_template
          ? 'Bank Form template has been updated successfully.'
          : 'Bank Form has been updated successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: result.is_template
          ? mConfig.Template_updated
          : mConfig.form_updated,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-updateBankForm',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete bank form from admin
  public async deleteBankForm(
    id: string,
    res: any,
  ): Promise<ManageBankDocument[]> {
    try {
      //Find bank form from id and delete
      const findForm = await this.ManageBankModel.findByIdAndUpdate(id, {
        is_deleted: true,
      })
        .select({ _id: 1, is_template: 1 })
        .lean();
      if (!findForm) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: findForm._id,
        entity_name: 'Banks',
        description: findForm.is_template
          ? 'Bank Form template has been deleted successfully.'
          : 'Bank Form has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: findForm.is_template
          ? mConfig.Template_deleted
          : mConfig.form_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-deleteBankForm',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for link bank account in request
  public async linkBankDetails(
    linkBankDto: LinkBankDto,
    res: any,
  ): Promise<BankDocument> {
    try {
      //Find request from request id
      const findFundraiser: any = await this.requestModel
        .findOne({ _id: linkBankDto.request_id })
        .select({ _id: 1, status: 1 })
        .lean();

      if (findFundraiser) {
        if (findFundraiser.status == 'expired') {
          return res.json({
            success: false,
            message: mConfig.Request_expired,
          });
        }

        //Find user bank from bank id
        const findBank = await this.BankModel.findOne({
          _id: ObjectID(linkBankDto.bank_id),
        })
          .select({ form_settings: 0 })
          .lean();
        if (!findBank) {
          return res.json({
            message: mConfig.No_data_found,
            success: true,
          });
        } else {
          const userData = this.request.user;
          const userName = userData.display_name
            ? userData.display_name
            : userData.first_name + ' ' + userData.last_name;

          //Add bank id in request
          const result: any = await this.requestModel
            .findOneAndUpdate(
              { _id: linkBankDto.request_id },
              { $set: { bank_id: linkBankDto.bank_id } },
              { new: true },
            )
            .select({ _id: 1, form_data: 1, category_slug: 1, bank_id: 1 })
            .lean();
          if (!result) {
            return res.json({
              message: mConfig.No_data_found,
              success: false,
            });
          } else {
            //Remove notification send for link bank
            await this.notificationModel
              .deleteMany({
                title: 'Link your Bank Details',
                request_id: result._id,
              })
              .lean();

            const msg = await this.commonService.changeString(
              mConfig.noti_msg_link_details,
              {
                '{{uname}}': userName,
                '{{fundraiser_title}}': result.form_data.title_of_fundraiser,
              },
            );

            const input: any = {
              title: mConfig.noti_title_add_bank,
              type: 'bank',
              requestId: result._id,
              categorySlug: result.category_slug,
              message: msg,
            };
            //Send notification to admin
            this.commonService.sendAdminNotification(input);

            //Add Fundraiser Activity log
            const logData = {
              request_id: result._id,
              user_id: userData._id,
              text: mConfig.Request_bank_link_activity_log,
            };
            this.logService.createFundraiserActivityLog(logData);
            return res.json({
              message: mConfig.Bank_linked,
              success: true,
            });
          }
        }
      } else {
        return res.json({
          message: mConfig.No_data_found,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-linkBankDetails',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for send notification to trustees if bank not link in request
  public async bankLinkNotification(
    requestId: string,
    res: any,
  ): Promise<Bank> {
    try {
      if (requestId && !_.isEmpty(requestId) && requestId.length == 24) {
        const requestData = await this.requestModel
          .findOne(
            {
              _id: ObjectID(requestId),
            },
            {
              _id: 1,
              category_slug: 1,
              user_id: 1,
              user_ngo_id: 1,
              reference_id: 1,
              category_name: 1,
            },
          )
          .lean();

        if (!_.isEmpty(requestData)) {
          const msg = await this.commonService.changeString(
            mConfig.noti_msg_link_bank,
            {
              // '{{cause}}': requestData.category_name.toLowerCase(),
              '{{refId}}': requestData.reference_id,
            },
          );
          const input: any = {
            message: msg,
            title: mConfig.noti_title_inform_add_bank,
            type: requestData.category_slug,
            categorySlug: requestData.category_slug,
            requestId: requestData._id,
            referenceId: requestData.reference_id,
            requestUserId: requestData.user_id,
          };
          if (requestData.user_ngo_id) {
            //Send notification to ngo trustee if request create by ngo
            const ngoUsers = await this.commonService.getNgoUserIds(
              requestData.user_ngo_id,
            );
            if (ngoUsers) {
              this.commonService.sendAllNotification(ngoUsers, input);
            }
          } else {
            //Send notification to request user
            input.userId = requestData.user_id;
            this.commonService.notification(input);
          }
          return res.json({
            success: true,
            message: mConfig.Notification_sent,
          });
        } else {
          return res.json({
            success: false,
            message: mConfig.No_data_found,
          });
        }
      } else {
        return res.json({
          success: false,
          message: mConfig.id_missing,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-bankLinkNotification',
      );
      return error;
    }
  }

  //Api for send notification to trustees if bank not link
  public async NgoBankLinkNotification(ngoId: string, res: any): Promise<Bank> {
    try {
      //Find ngo from id
      const findNGO = await this.ngoModel
        .findOne({ _id: ObjectID(ngoId) })
        .select({ _id: 1, trustees_name: 1 })
        .lean();

      if (!_.isEmpty(findNGO)) {
        const input: any = {
          message: mConfig.noti_msg_link_ngo_bank,
          title: mConfig.noti_title_inform_ngo_add_bank,
          type: 'link_bank_detail',
          ngoId: ngoId,
        };

        //Send notification to ngo trustee
        const ngoUsers = findNGO.trustees_name.map((item: any) => {
          return item._id;
        });

        if (ngoUsers) {
          this.commonService.sendAllNotification(ngoUsers, input);
        }

        return res.json({
          success: true,
          message: mConfig.Notification_sent,
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
        'src/controller/bank/bank.service.ts-NgoBankLinkNotification',
      );
      return error;
    }
  }

  //Function for find bank and attach image url
  public async getBankLists(query): Promise<BankDocument[]> {
    try {
      const result = await this.BankModel.find(query).sort({ _id: -1 }).lean();
      const data = [];
      if (!_.isEmpty(result)) {
        await Promise.all(
          result.map(async (bank: any) => {
            if (
              bank &&
              bank.form_data &&
              bank.form_data.files &&
              !_.isEmpty(bank.form_data.files)
            ) {
              const files = bank.form_data.files;
              const updatedFiles = {};

              for (const key in files) {
                updatedFiles[key] = [];
                files[key].map(async (item: any) => {
                  updatedFiles[key].push(
                    authConfig.imageUrl + 'bank-doc/' + item,
                  );
                });
              }
              bank.form_data.files = updatedFiles;
            }
            data.push(bank);
          }),
        );
      }
      return data;
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-getBankLists',
      );
    }
  }

  // Api for verify bank in admin
  public async verifyBank(
    bankId: string,
    verifyBankDto: VerifyBankDto,
    res: any,
  ): Promise<BankDocument[]> {
    try {
      let notiMsg;
      let status = verifyBankDto.status;

      //Find bank form id
      const bankData: any = await this.BankModel.findById(bankId, {
        form_settings: 0,
      }).lean();
      if (!_.isEmpty(bankData)) {
        const updateData: any = {
          $set: {
            status: verifyBankDto.status,
          },
        };

        if (verifyBankDto.status == 'approve') {
          //Set message for notification
          updateData['$set']['approve_time'] = new Date();
          status = 'approved';
          notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_bank_verify,
            {
              '{{bank_name}}': bankData?.form_data?.bank_name,
              '{{status}}': 'approved',
            },
          );
        } else if (verifyBankDto.status == 'reject') {
          updateData['$set']['reject_reason'] = verifyBankDto.reject_reason;
          updateData['$set']['reject_time'] = new Date();
          status = 'rejected';
          const removeId = {
            $unset: { bank_id: 1 },
          };
          //remove bank from request
          await this.requestModel
            .updateMany({ bank_id: ObjectID(bankId) }, removeId, {
              new: true,
            })
            .lean();
          //Set message for notification
          notiMsg = await this.commonService.changeString(
            mConfig.noti_msg_reason,
            { '{{reason}}': verifyBankDto.reject_reason },
          );
        }
        //Update bank status
        await this.BankModel.findByIdAndUpdate(
          { _id: ObjectID(bankId) },
          updateData,
          {
            new: true,
          },
        ).lean();

        const notiTitle = await this.commonService.changeString(
          mConfig.noti_title_bank_verify,
          {
            '{{status}}': status,
          },
        );

        const input: any = {
          message: notiMsg,
          title: notiTitle,
          type: 'verify-bank',
          bankId: bankId,
          userId: bankData?.user_id,
        };
        //Send notification to user
        this.commonService.notification(input);

        //Add Activity Log
        const logData = {
          action: 'verify',
          entity_id: bankData._id,
          entity_name: 'User Bank Verify',
          description: `User Bank has been ${status}.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message:
            verifyBankDto.status === 'approve'
              ? mConfig.Bank_approved
              : verifyBankDto.status === 'reject'
              ? mConfig.Bank_rejected
              : mConfig.Bank_verified,
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
        'src/controller/bank/bank.service.ts-verifyBank',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for restore form
  public async restoreForm(id, res): Promise<ManageBankDocument[]> {
    try {
      //Find bank form from id
      const result = await this.ManageBankModel.findById(id)
        .select({ restore_form_data: 1 })
        .lean();
      if (_.isEmpty(result)) {
        return res.json({ success: false, message: mConfig.No_data_found });
      } else {
        return res.json({
          success: true,
          data: result.restore_form_data,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-restoreForm',
      );
    }
  }

  // Api for get template
  public async getTemplate(
    id: string,
    res: any,
  ): Promise<ManageBankDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        { id },
      );
      const result = await this.ManageBankModel.findOne({
        _id: ObjectID(id),
        is_template: true,
        is_deleted: { $ne: true },
      })
        .select({ form_data: 1 })
        .lean();

      if (!result) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        return res.json({
          success: true,
          data: result && result.form_data ? result.form_data : {},
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-getTemplate',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for get template list
  public async getTemplateList(
    param: any,
    res: any,
  ): Promise<ManageBankDocument[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const result = await this.ManageBankModel.find({
        is_template: true,
        is_deleted: { $ne: true },
      })
        .collation(authConfig.collation)
        .select({ _id: 1, template_name: 1 })
        .sort({ template_name: 1 })
        .lean();
      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/bank/bank.service.ts-getTemplateList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
