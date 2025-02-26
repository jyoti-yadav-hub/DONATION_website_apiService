import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { authConfig } from './config/auth.config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';
import { LogModule } from './common/log.module';
import { JwtAuthGuard } from './auth/gaurds/jwt.guard';
import { FaqModule } from './controller/faq/faq.module';
import { CmsModule } from './controller/cms/cms.module';
import { NGOModule } from './controller/ngo/ngo.module';
import { JwtStrategy } from './auth/gaurds/jwt-strategy';
import { PlanModule } from './controller/plan/plan.module';
import { BankModule } from './controller/bank/bank.module';
import { RaceModule } from './controller/race/race.module';
import { AppController } from './app.controller';
import { UsersModule } from './controller/users/users.module';
import { AdminModule } from './controller/admin/admin.module';
import { SocketModule } from './controller/socket/socket.module';
import { ImagesModule } from './controller/images/images.module';
import { ReportModule } from './controller/report/report.module';
import { RequestModule } from './controller/request/request.module';
import { SettingModule } from './controller/setting/setting.module';
import { HomeCmsModule } from './controller/home-cms/home-cms.module';
import { ReligionModule } from './controller/religion/religion.module';
import { CurrencyModule } from './controller/currency/currency.module';
import { DonationModule } from './controller/donation/donation.module';
import { CategoryModule } from './controller/category/category.module';
import { ErrorlogModule } from './controller/error-log/error-log.module';
import { ContactUsModule } from './controller/contact-us/contact-us.module';
import { DefaultOtpModule } from './controller/default-otp/default-otp.module';
import { HelpRequestModule } from './controller/help-request/help-request.module';
import { NotificationModule } from './controller/notification/notification.module';
import { BankTypeModule } from './controller/bank-type/bank-type.module';
import { EmailTemplateModule } from './controller/email-template/email-template.module';
import { DeleteAccountModule } from './controller/delete-account/delete-account.module';
import { DisasterTypesModule } from './controller/disaster-types/disaster-types.module';
import { CourseDiseasesModule } from './controller/course-disease/course-disease.module';
import { UserBugReportModule } from './controller/user-bug-report/user-bug-report.module';
import { ManualTransferModule } from './controller/manual-transfer/manual-transfer.module';
import { HospitalSchoolModule } from './controller/hospital-school/hospital-school.module';
import { PaymentGatewayModule } from './controller/payment-gateway/payment-gateway.module';
import { StripeModule } from './stripe/stripe.module';
import { PostModule } from './controller/post/post.module';
import { EmotionalMessageModule } from './controller/emotional-message/emotional-message.module';
import { CorporateTypesModule } from './controller/corporate-types/corporate-types.module';
import { HospitalSchoolDataModule } from './controller/hospital-school-data/hospital-school-data.module';
import { FooterStripModule } from './controller/footer-strip/footer-strip.module';
import { CsvUploadModule } from './controller/csv-upload/csv-upload.module';
import { NgoFormModule } from './controller/ngo-form/ngo-form.module';
import { RegionModule } from './controller/fund-region/region.module';
import { FundModule } from './controller/fund/fund.module';
import { LanguageModule } from './controller/language/language.module';
import { JobTitleModule } from './controller/job-title/job-title.module';
import { DriveTypeModule } from './controller/drive-type/drive-type.module';
import { DriveModule } from './controller/drive/drive.module';
import { CorporateModule } from './controller/corporate/corporate.module';
import { RoleModule } from './controller/role/role.module';
import { BookmarkModule } from './controller/bookmark/bookmark.module';
import { ShareMessageModule } from './controller/share-message/share-message.module';
import { FundHelpRequestModule } from './controller/fund-help-request/fund-help-request.module';
import { BackupService } from './backup.service';
import { PaymentServerLogModule } from './controller/payment-server-log/payment-server-log.module';
import { ManageVolunteerModule } from './controller/manage-volunteer/manage-volunteer.module';

import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { WomenEmpowermentAreaModule } from './controller/women-empowerment-area/women-empowerment-area.module';
import { NgoDonationModule } from './controller/ngo-donation/ngo-donation.module';

const modules: any = [];
if (process.env.PRODUCTION === 'prod') {
  // configure the Nest.js Scheduler, which allows you to schedule and run tasks at specified intervals
  modules.push(ScheduleModule.forRoot());
}
modules.push(
  MongooseModule.forRoot(process.env.DB_URL, { connectionName: 'main_db' }),
  MongooseModule.forRoot(process.env.LOG_DB_URL, { connectionName: 'log_db' }),
  CmsModule,
  NGOModule,
  FaqModule,
  BankModule,
  RaceModule,
  authConfig,
  AuthModule,
  PlanModule,
  AdminModule,
  UsersModule,
  ReportModule,
  CommonModule,
  LogModule,
  ImagesModule,
  PostModule,
  SocketModule,
  BookmarkModule,
  SettingModule,
  RequestModule,
  HomeCmsModule,
  CurrencyModule,
  DefaultOtpModule,
  JobTitleModule,
  BankTypeModule,
  CorporateTypesModule,
  RegionModule,
  NgoFormModule,
  CorporateModule,
  ReligionModule,
  CategoryModule,
  ErrorlogModule,
  DonationModule,
  ContactUsModule,
  HelpRequestModule,
  ShareMessageModule,
  NotificationModule,
  DisasterTypesModule,
  DeleteAccountModule,
  UserBugReportModule,
  EmailTemplateModule,
  HospitalSchoolModule,
  CourseDiseasesModule,
  ManualTransferModule,
  EmotionalMessageModule,
  PaymentGatewayModule,
  ManageVolunteerModule,
  StripeModule,
  HospitalSchoolDataModule,
  FooterStripModule,
  CsvUploadModule,
  FundModule,
  LanguageModule,
  DriveTypeModule,
  DriveModule,
  RoleModule,
  FundHelpRequestModule,
  PaymentServerLogModule,
  WomenEmpowermentAreaModule,
  NgoDonationModule
);

@Module({
  imports: modules,
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard, JwtStrategy, BackupService],
  exports: [MongooseModule],
})
export class AppModule implements NestModule {
  //configure middleware
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
