/* eslint-disable prettier/prettier */
import {
  Get,
  Res,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { NotificationService } from './notification.service';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { UserNotificationDto } from './dto/user-notification.dto';
@Controller('notification')
@ApiTags('Notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  //Api for notification list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.notificationService.findAll(query, res);
  }

  //Api for corporate notification list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('corporate-list')
  async corporateList(@Query() query, @Res() res: Response) {
    return await this.notificationService.corporateList(query, res);
  }

  //Api for notification list (ADMIN)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin/list')
  async notificationList(@Query() query, @Res() res: Response) {
    return await this.notificationService.findAll(query, res);
  }

  //Api for Remove one notification
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('remove-one/:id')
  async removeOne(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.notificationService.removeOne(id, res);
  }

  //Api for Remove one notification (ADMIN)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('admin/remove-one/:id')
  async deleteOne(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.notificationService.removeOne(id, res);
  }

  //Api for Remove all notification
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('remove-all')
  async removeAll(@Res() res: Response) {
    return await this.notificationService.removeAll(null, res);
  }

  //Api for Remove all notification (ADMIN)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('admin/remove-all')
  async deleteAll(@Query() query, @Res() res: Response) {
    return await this.notificationService.removeAll(query, res);
  }

  //Api for get admin notifications badge count
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin/badge-count')
  async badgeCount(@Query() query, @Res() res: Response) {
    return await this.notificationService.badgeCount(query, res);
  }

  //Api for read all admin notifications
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin/read-all')
  async readAdminAll(@Query() query, @Res() res: Response) {
    return await this.notificationService.readAll(query, 'admin', res);
  }

  //Api for read all app notifications
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('read-all')
  async readAll(@Res() res: Response) {
    return await this.notificationService.readAll(null, 'app', res);
  }

  //Api for read one notifications in app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('read/:id')
  async readOne(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.notificationService.readOne(id, 'app', res);
  }

  //Api for read one notifications in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin/read/:id')
  async readAdminOne(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.notificationService.readOne(id, 'admin', res);
  }

  //Api for notification sent
  @Post('sent')
  async send(@Body('token') token: string, @Res() res: Response) {
    return await this.notificationService.sendNotification(token, res);
  }

  //Api for delete multiple notification
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-multiple')
  async deleteManyNotifications(@Body('ids') ids: [], @Res() res: Response) {
    return await this.notificationService.deleteManyNotifications(ids, res);
  }

  //Api for send notification to user from admin panel
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('admin/send-to-user')
  async sendToUser(
    @Body() userNotificationDto: UserNotificationDto,
    @Res() res: Response,
  ) {
    return await this.notificationService.sendToUser(userNotificationDto, res);
  }

  //Api for admin sent notification list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('sent-by-admin')
  async sentByAdmin(@Query() query, @Res() res: Response) {
    return await this.notificationService.sentByAdmin(query, res);
  }
}
