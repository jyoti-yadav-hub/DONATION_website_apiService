import { _ } from 'lodash';
import { Model } from 'mongoose';
import nodemailer from 'nodemailer';
import { REQUEST } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { ContactUsDto } from './dto/contact-us.dto';
import { ErrorlogService } from '../error-log/error-log.service';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { UpdateContactUsDto } from './dto/update-contact-us.dto';
import mConfig from '../../config/message.config.json';
import { ContactUs, ContactUsDocument } from './entities/contact-us.entity';
import { CommonService } from '../../common/common.service';

@Injectable()
export class ContactUsService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly errorlogService: ErrorlogService,
    private readonly commonService: CommonService,
    @InjectModel(ContactUs.name)
    private contactUsModel: Model<ContactUsDocument>,
  ) {}

  //Api for send email
  public async sendMail(createContactUsDto: CreateContactUsDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        createContactUsDto,
      );
      // Create a nodemailer transporter using Gmail SMTP settings
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        // host: host.value,
        // port: port.value,
        // secure: true,
        // requireTLS: true,
        auth: {
          user: 'satishy21@groovyweb.co',
          pass: 'sy965522',
        },
      });
      // Define the email content and recipient
      const mailOptions = {
        from: {
          name: createContactUsDto.name,
          address: createContactUsDto.email,
        },
        to: 'satishy21@groovyweb.co',
        subject: createContactUsDto.subject,
        text: createContactUsDto.content,
      };
      // Send the email using the transporter
      transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
          return res.json({
            success: false,
            message: mConfig.Something_went_wrong,
          });
        } else {
          return res.json({
            success: true,
            message: mConfig.Email_send,
          });
        }
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/contact-us/contact-us.service.ts-sendMail',
      );
      return res.json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }

  //Api for save contact us detail from web
  public async createContactUs(contactUsDto: ContactUsDto, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'post',
        contactUsDto,
      );
      const createContactUs = new this.contactUsModel(contactUsDto);
      const contactUs = await createContactUs.save();

      return res.json({
        message: mConfig.contact_us_saved,
        success: true,
      });
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/contact-us/contact-us.service.ts-createContactUs',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }

  //Api for user list
  public async findAll(param, res: any) {
    try {
      this.errorlogService.createApiLog(
        this.request.originalUrl,
        'get',
        param,
      );
      const match = {};
      const filter = !_.isEmpty(param) ? param : [];

      //Check filter[parameter] is empty or not
      if (!_.isUndefined(filter) && !_.isEmpty(filter)) {
        const where = [];
        let query = [];
        const operator = param.operator ? param.operator.trim() : 'contains';
        if (!_.isUndefined(filter.name) && filter.name) {
          const query = await this.commonService.filter(
            operator,
            filter.name,
            'name',
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
        if (!_.isUndefined(filter.message) && filter.message) {
          const query = await this.commonService.filter(
            operator,
            filter.message,
            'message',
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

        if (!_.isUndefined(filter.search) && filter.search) {
          const str_fields = ['name', 'phone', 'message', 'createdAt'];
          query = await this.commonService.getGlobalFilter(
            str_fields,
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
        name: 'name',
        phone: 'phone',
        message: 'message',
        createdAt: 'createdAt',
      };
      // Define a field transformation to concatenate 'phone_code' and 'phone'
      const addFields = {
        $addFields: {
          phone: { $concat: ['$phone_code', ' ', '$phone'] },
        },
      };

      const total = await this.contactUsModel
        .aggregate([addFields, { $match: match }, { $count: 'count' }])
        .exec();

      const total_record =
        total && total[0] && total[0].count ? total[0].count : 0;

      // Calculate pagination details
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
        param.sort_type,
        param.sort,
      );

      const result = await this.contactUsModel.aggregate(
        [
          addFields,
          { $match: match },
          {
            $project: {
              _id: 1,
              name: 1,
              phone: 1,
              message: 1,
              createdAt: 1,
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
      this.errorlogService.errorLog(
        error,
        'src/controller/contact-us/contact-us.service.ts-findAll',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
