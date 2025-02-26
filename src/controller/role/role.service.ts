/* eslint-disable prettier/prettier */
import { _ } from 'lodash';
import { Model } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { authConfig } from '../../config/auth.config';
import mConfig from '../../config/message.config.json';
import { CommonService } from '../../common/common.service';
import { LogService } from '../../common/log.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ErrorlogService } from '../error-log/error-log.service';
import { Role, RoleDocument } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';

const ObjectID = require('mongodb').ObjectID;

@Injectable()
export class RoleService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly commonService: CommonService,
    private readonly logService: LogService,
    private readonly errorlogService: ErrorlogService,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  // Api for create role
  public async create(createRoleDto: CreateRoleDto, res: any): Promise<Role> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        createRoleDto,
      );
      const role = await this.roleModel
        .findOne({ slug: createRoleDto.slug })
        .select({ _id: 1, slug: 1 })
        .lean();
      if (role) {
        return res.json({
          message: mConfig.Role_exist,
          success: false,
        });
      } else {
        if (createRoleDto.icon && !_.isUndefined(createRoleDto.icon)) {
          await this.commonService.uploadFileOnS3(createRoleDto.icon, 'role');
          createRoleDto.icon = createRoleDto.icon ? createRoleDto.icon : null;
        }

        if (createRoleDto.web_icon && !_.isUndefined(createRoleDto.web_icon)) {
          await this.commonService.uploadFileOnS3(
            createRoleDto.web_icon,
            'role',
          );
          createRoleDto.web_icon = createRoleDto.web_icon
            ? createRoleDto.web_icon
            : null;
        }

        const adminData = this.request.user;
        createRoleDto.createdBy = adminData.name;
        createRoleDto.updatedBy = adminData.name;

        const createRole = new this.roleModel(createRoleDto);
        const result = await createRole.save();

        //Add Activity Log
        const logData = {
          action: 'create',
          entity_id: result._id,
          entity_name: 'Roles',
          description: `${result.name} role has been created.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          message: mConfig.Role_created,
          success: true,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/role/role.service.ts-create',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for list role for Admin
  public async findAll(param, res: any): Promise<Role[]> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        param,
      );
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        let where = [];
        let query = [];
        if (!_.isUndefined(filter.name) && filter.name) {
          const query = await this.commonService.filter(
            'contains',
            filter.name,
            'name',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.slug) && filter.slug) {
          const query = await this.commonService.filter(
            'contains',
            filter.slug,
            'slug',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.description) && filter.description) {
          const query = await this.commonService.filter(
            'contains',
            filter.description,
            'description',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.index) && filter.index) {
          const query = await this.commonService.filter(
            '=',
            filter.index,
            'index',
          );
          where.push(query);
        }
        if (!_.isUndefined(filter.status) && filter.status) {
          const query = await this.commonService.filter(
            'is',
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

        if (!_.isUndefined(filter.search) && filter.search) {
          const fields = [
            'name',
            'slug',
            'description',
            'status',
            'createdAt',
            'updatedAt',
            'createdBy',
            'updatedBy',
          ];
          const field = ['index'];
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
        description: 'description',
        name: 'name',
        slug: 'slug',
        index: 'index',
        status: 'status',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        createdBy: 'createdBy',
        updatedBy: 'updatedBy',
      };

      const total = await this.roleModel
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

      const data = await this.roleModel.aggregate(
        [
          { $match: match },
          { $sort: sort },
          {
            $project: {
              name: 1,
              slug: 1,
              icon: {
                $concat: [authConfig.imageUrl, 'role/', '$icon'],
              },
              web_icon: {
                $concat: [authConfig.imageUrl, 'role/', '$web_icon'],
              },
              description: 1,
              index: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              createdBy: 1,
              updatedBy: 1,
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
        'src/controller/role/role.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for update role
  public async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
    res: any,
  ): Promise<Role> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        updateRoleDto,
      );
      const role = await this.roleModel
        .findById(id)
        .select({ _id: 1, icon: 1, name: 1 })
        .lean();
      if (!role) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      } else {
        const adminData = this.request.user;
        updateRoleDto.updatedBy = adminData.name;

        const roleData = await this.roleModel
          .findOne({
            slug: updateRoleDto.slug,
            _id: { $ne: ObjectID(id) },
          })
          .select({ _id: 1, slug: 1 })
          .lean();
        if (roleData) {
          return res.json({
            message: mConfig.Role_exist,
            success: false,
          });
        } else {
          await this.commonService.uploadFileOnS3(
            updateRoleDto.icon,
            'role',
            role.icon,
          );

          updateRoleDto.icon = updateRoleDto.icon
            ? updateRoleDto.icon
            : role.icon;

          await this.commonService.uploadFileOnS3(
            updateRoleDto.web_icon,
            'role',
            role.web_icon,
          );

          updateRoleDto.web_icon = updateRoleDto.web_icon
            ? updateRoleDto.web_icon
            : role.web_icon;

          await this.roleModel
            .findByIdAndUpdate(id, updateRoleDto, { new: true })
            .select({ _id: 1 })
            .lean();
          await this.commonService.sendAllUserHiddenNotification('update_role');

          //Add Activity Log
          const logData = {
            action: 'update',
            entity_id: role._id,
            entity_name: 'Roles',
            description: `${role.name} role has been updated.`,
          };
          this.logService.createAdminLog(logData);

          return res.json({
            message: mConfig.Role_updated,
            success: true,
          });
        }
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/role/role.service.ts-update',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for delete role
  public async remove(id: string, res: any): Promise<Role> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        {id},
      );
      const role = await this.roleModel
        .findByIdAndDelete(id)
        .select({ _id: 1, icon: 1,web_icon:1, name: 1 })
        .lean();
      if (!role) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      //call unlink file function
      await this.commonService.s3ImageRemove('role', role.icon);
      await this.commonService.s3ImageRemove('role', role.web_icon);
      await this.commonService.sendAllUserHiddenNotification('update_role');

      //Add Activity Log
      const logData = {
        action: 'delete',
        entity_id: role._id,
        entity_name: 'Roles',
        description: `${role.name} role has been deleted.`,
      };
      this.logService.createAdminLog(logData);

      return res.json({
        message: mConfig.Role_deleted,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/role/role.service.ts-remove',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for get active roles list in app
  public async roleList(res: any): Promise<Role> {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        this.request.method,
        '',
      );
      const data = await this.roleModel.aggregate([
        { $match: { status: 'Active' } },
        {
          $project: {
            _id: 1,
            icon: {
              $concat: [authConfig.imageUrl, 'role/', '$icon'],
            },
            web_icon: {
              $concat: [authConfig.imageUrl, 'role/', '$web_icon'],
            },
            name: 1,
            status: 1,
            description: 1,
            slug: 1,
            createdAt: 1,
          },
        },
        { $sort: { index: 1 } },
        { $limit: 4 },
      ]);

      if (!data) {
        return res.json({
          message: mConfig.No_data_found,
          success: false,
        });
      }
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/role/role.service.ts-roleList',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  // Api for enable/disable role
  public async setRole(id: string, res: any): Promise<Role> {
    try {
      const role = await this.roleModel
        .findById(id)
        .select({ _id: 1, name: 1 })
        .lean();
      if (!role) {
        return res.json({
          success: false,
          message: mConfig.No_data_found,
        });
      } else {
        let status;
        if (role.status === 'Active') {
          status = 'Deactive';
        } else {
          status = 'Active';
        }

        const updateData = {
          status: status,
        };

        await this.roleModel
          .findByIdAndUpdate(id, updateData, { new: true })
          .select({ _id: 1 })
          .lean();

        await this.commonService.sendAllUserHiddenNotification('update_role');

        //Add Activity Log
        const logData = {
          action: 'update',
          entity_id: role._id,
          entity_name: 'Roles',
          description: `${role.name} role has been ${status}.`,
        };
        this.logService.createAdminLog(logData);

        return res.json({
          success: true,
          message: mConfig.Role_status_changed,
        });
      }
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/role/role.service.ts-setRole',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
