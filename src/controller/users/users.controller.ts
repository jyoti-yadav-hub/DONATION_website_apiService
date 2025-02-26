/* eslint-disable prettier/prettier */
import {
  Res,
  Get,
  Req,
  Post,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
  Controller,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { query, Request, Response } from 'express';
import { LoginUserDto } from './dto/login-user.dto';
import { CheckUserDto } from './dto/check-user.dto';
import { CreateDto } from './dto/create.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { SocialLoginDto } from './dto/social-login.dto';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ChangeUserRoleDto } from './dto/change-role.dto';
import { SelectCausesDto } from './dto/select-causes.dto';
import { SocialSignupDto } from './dto/social-signup.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { AccessTokenDto } from './dto/access-token-login.dto';
import { BlockedAccountDto } from './dto/blocked-account.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { WebSignupDto } from './dto/web-signup.dto';
import { GuestSignupDto } from './dto/guest-signup.dto';
import { VerifyPhoneOtpDto } from './dto/verify-phone-otp.dto';
import { InterviewSignupDto } from './dto/interview-signup.dto';
import { InterviewLogin } from './dto/interview-login.dto';
import { OptionalAuthGuard } from 'src/auth/gaurds/optional-auth.guard';
import { SetActiveRoleDto } from './dto/set-active-role.dto';
import { ParamMissing } from 'src/auth/param-missing.pipe';

@Controller('user')
@ApiTags('User')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //Api for register normal user
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file,
    @Body() createDto: CreateDto,
    @Res() res: Response,
  ) {
    const data = await this.usersService.create(file, createDto, res);
    return data;
  }

  //Api for register guest user
  @Post('create-user')
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const data = await this.usersService.createUser(createUserDto, res);
    return data;
  }

  //Api for update user profile
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('update-profile')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @UploadedFile() file,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
  ) {
    return await this.usersService.update(file, updateUserDto, res);
  }

  //Api for user login
  @Post('signin')
  async signin(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    const data = await this.usersService.signin(loginUserDto, res);
    return data;
  }

  //Api for user social login
  @Post('social-login')
  async socialLogin(
    @Body() socialLoginDto: SocialLoginDto,
    @Res() res: Response,
  ) {
    const data = await this.usersService.socialLogin(socialLoginDto, res);
    return data;
  }

  //Api for user list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('list')
  async findAll(@Query() query, @Req() req: Request, @Res() res: Response) {
    return await this.usersService.findAll(query, res);
  }

  //Api for logout
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('logout/:uuid')
  async logout(
    @Param('uuid') uuid: string,
    @Query('access_token', ParamMissing) access_token: string,
    @Res() res: Response,
  ) {
    return await this.usersService.logout(uuid, access_token, res);
  }

  //Api for logout from web
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('web/logout')
  async webLogout(
    @Query('access_token', ParamMissing) access_token: string,
    @Res() res: Response,
  ) {
    return await this.usersService.logout(null, access_token, res);
  }

  //Api for Check Phone or Email
  @Post('check-user')
  async checkUser(@Body() checkUserDto: CheckUserDto, @Res() res: Response) {
    const data = await this.usersService.checkUser(checkUserDto, res);
    return data;
  }

  //Api for change user role
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('change-role')
  async changeRole(
    @Body() changeUserRoleDto: ChangeUserRoleDto,
    @Res() res: Response,
  ) {
    return await this.usersService.changeRole(changeUserRoleDto, res);
  }

  //Api for Add Select Causes by Donor
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('select-causes')
  async selectCauses(
    @Body() selectCausesDto: SelectCausesDto,
    @Res() res: Response,
  ) {
    return await this.usersService.selectCauses(selectCausesDto, res);
  }

  //Api for user social login
  @Post('social-signup')
  async socialSignup(
    @Body() socialSignupDto: SocialSignupDto,
    @Res() res: Response,
  ) {
    return await this.usersService.socialSignup(socialSignupDto, res);
  }

  //Api for get user details in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('get-user-detail/:id')
  async getUserDetail(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.usersService.getUserDetail(id, res);
  }

  //Api for get user profile details
  @Get('get-user-profile/:id')
  async userProfileDetails(
    @Param('id', IdMissing) id: string,
    @Query('platform') platform: string,
    @Res() res: Response,
  ) {
    return await this.usersService.userProfileDetails(id, platform, res);
  }

  //Api for login if user already login with another device
  @Post('make-login')
  async accessTokenLogin(
    @Body() accessTokenDto: AccessTokenDto,
    @Res() res: Response,
  ) {
    return await this.usersService.accessTokenLogin(accessTokenDto, res);
  }

  //Api for change country
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('change-country')
  async changeCountry(@Body('country') country: string, @Res() res: Response) {
    return await this.usersService.changeCountry(country, res);
  }

  //Api for delete user and add user data in user deleted table
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-user/:id')
  async deleteUser(
    @Param('id', IdMissing) id: string,
    @Body() deleteAccountDto: DeleteAccountDto,
    @Res() res: Response,
  ) {
    return await this.usersService.deleteUser(id, deleteAccountDto, res);
  }

  // Api for delete account in app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-account')
  async deleteAccount(
    @Body() deleteAccountDto: DeleteAccountDto,
    @Res() res: Response,
  ) {
    return await this.usersService.deleteAccount(deleteAccountDto, res);
  }

  // Api for block/unblock user account
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('block-unblock-account')
  async blockUnblockAccount(
    @Body() blockedAccountDto: BlockedAccountDto,
    @Res() res: Response,
  ) {
    return await this.usersService.blockUnblockAccount(blockedAccountDto, res);
  }

  // Api for get user's ongoing hunger request data
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('get-user-hunger-data')
  async getHungerData(@Res() res: Response) {
    return await this.usersService.getHungerData(res);
  }

  // Api for get profile count
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('profile-count/:id')
  async profileCount(
    @Param('id', IdMissing) id: string,
    @Query('user_type') user_type: string,
    @Res() res: Response,
  ) {
    return await this.usersService.profileCount(id, user_type, res);
  }

  // Api for send otp to user mobile no
  @Post('send-otp')
  async sendOtp(@Body() sendOtpDto: SendOtpDto, @Res() res: Response) {
    return await this.usersService.sendOtp(sendOtpDto, res);
  }

  // Api for login using otp
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Res() res: Response) {
    return await this.usersService.verifyOtp(verifyOtpDto, res);
  }

  //Api for register user with otp verify
  @Post('web/signup')
  @UseInterceptors(FileInterceptor('file'))
  async webSignup(
    @UploadedFile() file,
    @Body() createDto: WebSignupDto,
    @Res() res: Response,
  ) {
    const data = await this.usersService.webSignup(file, createDto, res);
    return data;
  }

  //Api for register guest user
  @Post('web/guest-signup')
  async guestSignup(
    @Body() guestSignupDto: GuestSignupDto,
    @Res() res: Response,
  ) {
    const data = await this.usersService.guestSignup(guestSignupDto, res);
    return data;
  }

  // Api for verify phone otp
  @Post('verify-phone-otp')
  async verifyPhoneOtp(
    @Body() verifyPhoneOtpDto: VerifyPhoneOtpDto,
    @Res() res: Response,
  ) {
    return await this.usersService.verifyPhoneOtp(verifyPhoneOtpDto, res);
  }

  //Api for signup user
  @Post('signup')
  async createInterviewSignup(
    @Body() signupDto: InterviewSignupDto,
    @Res() res: Response,
  ) {
    const data = await this.usersService.createInterviewSignup(signupDto, res);
    return data;
  }

  //Api for user login
  @Post('login')
  async interviewLogin(
    @Body() loginUserDto: InterviewLogin,
    @Res() res: Response,
  ) {
    const data = await this.usersService.interviewLogin(loginUserDto, res);
    return data;
  }

  //Api for list usernames in dropdown(Admin)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('username-list')
  async userList(@Query() query, @Res() res: Response) {
    return await this.usersService.userList(query, res);
  }

  //Api for location from ip address
  @Get('get-address')
  async getAddress(@Query() query, @Res() res: Response) {
    return await this.usersService.getAddress(res);
  }

  //Api for change user role
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('set-active-role')
  async setActiveRole(
    @Body() setActiveRoleDto: SetActiveRoleDto,
    @Res() res: Response,
  ) {
    return await this.usersService.setActiveRole(setActiveRoleDto, res);
  }
}
