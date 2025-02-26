import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateDeleteAccountDto } from './dto/create-delete-account.dto';
import { UpdateDeleteAccountDto } from './dto/update-delete-account.dto';
import {
  DeleteAccount,
  DeleteAccountDocument,
} from './entities/delete-account.entity';
import {
  RequestModel,
  RequestDocument,
} from '../request/entities/request.entity';
import { LogService } from 'src/common/log.service';
import { Fund, FundDocument } from '../fund/entities/fund.entity';
import { Drive, DriveDocument } from '../drive/entities/drive.entity';

@Injectable()
export class DeleteAccountService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly logService: LogService,
    private readonly commonService: CommonService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(RequestModel.name)
    private requestModel: Model<RequestDocument>,
    @InjectModel(Fund.name)
    private fundModel: Model<FundDocument>,
    @InjectModel(Drive.name)
    private driveModel: Model<DriveDocument>,
    @InjectModel(DeleteAccount.name)
    private deleteAccountModel: Model<DeleteAccountDocument>,
  ) {}

//Api for create delete account form in admin panel
  public async create(
    createDeleteAccountDto: CreateDeleteAccountDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createDeleteAccountDto,
      );
      const adminData = this.request.user;
      createDeleteAccountDto.createdBy = adminData.name;
      createDeleteAccountDto.updatedBy = adminData.name;
      const createData = new this.deleteAccountModel(createDeleteAccountDto);
      const data = await createData.save();

      //Add Activity Log
      const logData = {
        action: 'create',
        entity_id: data._id,
        entity_name: 'Delete Account',
        description: 'Delete Account Form has been created successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        success: true,
        message: mConfig.Delete_created,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/delete-account/create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for list delete account forms for Admin
  public async findAll(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const total_record = await this.deleteAccountModel.count().lean();
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
      const result = await this.deleteAccountModel
        .find()
        .sort(sort)
        .skip(start_from)
        .limit(per_page);

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
        'src/controller/delete-account/findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for update delete account form data
  public async update(
    id: string,
    updateDeleteAccountDto: UpdateDeleteAccountDto,
    res: any,
  ) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateDeleteAccountDto,
      );
      const adminData = this.request.user;
      updateDeleteAccountDto.updatedBy = adminData.name;
      const data: any = await this.deleteAccountModel
        .findByIdAndUpdate(id, updateDeleteAccountDto, { new: true })
        .select({ _id: 1 })
        .lean();
      if (!data) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'update',
        entity_id: data._id,
        entity_name: 'Delete Account',
        description: 'Delete Account Form has been updated successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        success: true,
        message: mConfig.Delete_updated,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/delete-account/update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for delete form
  public async remove(id: string, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        id,
      );
      const data: any = await this.deleteAccountModel
        .findByIdAndDelete(id)
        .select({ _id: 1 })
        .lean();
      if (!data) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      }

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: data._id,
        entity_name: 'Delete Account',
        description: 'Delete Account Form has been deleted successfully.',
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Delete_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/delete-account/remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get form data to display in app
  public async getDeleteAccountForm(res: any): Promise<DeleteAccount> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const userData = this.request.user;
      const match: any = {
        $or: [
          { user_id: userData._id },
          { donor_id: userData._id },
          { volunteer_id: userData._id },
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
        is_deleted: { $exists: false },
      };

      const requestCount = await this.requestModel.count(match).lean();
      const fundCount = await this.fundModel
        .count({
          $or: [
            { user_id: userData._id },
            {
              admins: {
                $elemMatch: {
                  user_id: userData._id,
                  is_deleted: { $ne: true },
                },
              },
            },
          ],
          status: 'approve',
          is_deleted: { $ne: true },
        })
        .lean();
      const driveCount = await this.driveModel
        .count({
          $or: [
            {
              user_id: userData._id,
              $or: [{ status: 'approve' }, { status: 'ongoing' }],
            },
            {
              volunteers: {
                $elemMatch: {
                  user_id: userData._id,
                  status: { $ne: 'block' },
                },
              },
              $or: [{ status: 'approve' }, { status: 'ongoing' }],
            },
          ],
          is_deleted: { $ne: true },
        })
        .lean();
      const formData = await this.deleteAccountModel
        .findOne()
        .select({ _id: 1, form_data: 1 })
        .lean();
      if (!_.isEmpty(formData)) {
        return res.json({
          success: true,
          data: {
            form_data: formData.form_data,
            request_count: requestCount,
            fund_count: fundCount,
            drive_count: driveCount,
          },
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
        'src/controller/delete-account/delete-account.service.ts-getDeleteAccountForm',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
