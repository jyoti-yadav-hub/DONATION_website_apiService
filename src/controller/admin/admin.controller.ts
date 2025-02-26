import {
  Get,
  Put,
  Res,
  Body,
  Post,
  Query,
  Delete,
  Param,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { ChangeFCMDto } from './dto/change-FCM.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { BlockRequestDto } from './dto/block-request.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { LogService } from 'src/common/log.service';
import { ParamMissing } from 'src/auth/param-missing.pipe';

@Controller('admin')
@ApiTags('Admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly logService: LogService,
  ) {}

  //Api for create admin credential
  @UseGuards( AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(@Body() createAdminDto: CreateAdminDto, @Res() res: Response) {
    return await this.adminService.create(createAdminDto, res);
  }

  //Api for admin login
  @Post('login')
  async login(@Body() loginAdminDto: LoginAdminDto, @Res() res: Response) {
    const data = await this.adminService.login(loginAdminDto, res);
    return data;
  }

  //Api for update admin profile
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update-profile/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @Res() res: Response,
  ) {
    return await this.adminService.update(id, updateAdminDto, res);
  }

  //Api for list of Admins in admin panel
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.adminService.findAll(query, res);
  }

  //Api for delete admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.adminService.remove(id, res);
  }

  //Api for forget password
  @Post('forget-password')
  async forgetPassword(
    @Body() forgetPasswordDto: ForgetPasswordDto,
    @Res() res: Response,
  ) {
    return await this.adminService.forgetPassword(forgetPasswordDto, res);
  }

  //Api for reset password
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response,
  ) {
    return await this.adminService.resetPassword(resetPasswordDto, res);
  }

  //Api for change password
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Res() res: Response,
  ) {
    return await this.adminService.changePassword(changePasswordDto, res);
  }

  //Api for admin dashboard
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin-dashboard')
  async getAdminDashboard(@Res() res: Response) {
    return await this.adminService.getAdminDashboard(res);
  }

  //Api for set admin fcm token
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('change-fcmToken')
  async changeFCM(@Body() changeFCMdDto: ChangeFCMDto, @Res() res: Response) {
    return await this.adminService.changeFCM(changeFCMdDto, res);
  }

  //Api for logout admin
  @Post('logout')
  async logout(
    @Body('token', ParamMissing) token: string,
    @Res() res: Response,
  ) {
    return await this.adminService.logout(token, res);
  }

  //Api for check email
  @Post('check-email')
  async checkEmail(@Body() checkEmailDto: CheckEmailDto, @Res() res: Response) {
    return await this.adminService.checkEmail(checkEmailDto, res);
  }

  //Api for get admin profile details
  @Get('get-profile/:id')
  async profileDetails(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    const admin = await this.adminService.findById(id);
    return res.json({
      success: true,
      data: admin,
    });
  }

  //Api for block request when request is reported as spam
  @Post('block-request')
  async blockRequest(
    @Body() blockRequestDto: BlockRequestDto,
    @Res() res: Response,
  ) {
    return await this.adminService.blockRequest(blockRequestDto, res);
  }

  //Api for block ngo when ngo is reported as spam
  @Post('block-ngo')
  async blockNGO(
    @Body() blockRequestDto: BlockRequestDto,
    @Res() res: Response,
  ) {
    return await this.adminService.blockNGO(blockRequestDto, res);
  }

  //Api for block fund when fund is reported as spam
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('block-fund')
  async blockFund(
    @Body() blockRequestDto: BlockRequestDto,
    @Res() res: Response,
  ) {
    return await this.adminService.blockfund(blockRequestDto, res);
  }

  //Api for unblock fund
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('unblock-fund')
  async unblockFund(
    @Body() blockRequestDto: BlockRequestDto,
    @Res() res: Response,
  ) {
    return await this.adminService.unblockFund(blockRequestDto, res);
  }

  //Api for unblock request
  @Post('unblock-request')
  async unblockRequest(
    @Body() blockRequestDto: BlockRequestDto,
    @Res() res: Response,
  ) {
    return await this.adminService.unblockRequest(blockRequestDto, res);
  }

  //Api for admin Log
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin-log')
  async adminLogList(@Query() query, @Res() res: Response) {
    return await this.logService.adminLogList(query, res);
  }

  // Api for convert static ngo to dynamic
  @Post('ngo-form')
  async NgoDynamicForm(@Body('data') data, @Res() res: Response) {
    return await this.adminService.ngoDynamicChanges(data, res);
  }
}
