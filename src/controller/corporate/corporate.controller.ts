import {
  Controller,
  Get,
  Res,
  Put,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CorporateService } from './corporate.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateCorporateDto } from './dto/create-corporate.dto';
import { SaveOrganizationDto } from './dto/save-organization.dto';
import { UpdateCorporateDto } from './dto/update-corporate.dto';
import { SendInviteDto } from './dto/send-invite.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { CheckUserDto } from './dto/check-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { GetCorporateDto } from './dto/get-corporate.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { JoinCorporateDto } from './dto/join-corporate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InviteByEmailDto } from './dto/invite-by-email.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { OptionalAuthGuard } from 'src/auth/gaurds/optional-auth.guard';
import { VerifyCorporateInvite } from './dto/verify-corporate-invite.dto';
import { ChangeCausesDto } from './dto/change-causes.dto';
import { VerifyRequestDto } from './dto/verify-request.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AddRemoveAdminDto } from './dto/add-remove-admin.dto';
import { FundraiserRequestVerifyDto } from '../request/dto/fundraiser-request-verify.dto';
import { UserListDto } from './dto/user-list.dto';
import { BusinessEmailDto } from './dto/business-email.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('corporate')
@ApiTags('corporate')
export class CorporateController {
  constructor(private readonly corporateService: CorporateService) {}

  //Api for send invite
  @Post('send-invite')
  async sendInvite(@Body() sendInviteDto: SendInviteDto, @Res() res: Response) {
    return await this.corporateService.sendInvite(sendInviteDto, res);
  }

  // Api for create corporate
  @Post('create')
  async createCorporate(
    @Body() createCorporateDto: CreateCorporateDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.createCorporate(createCorporateDto, res);
  }

  // Api for verify email otp
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Res() res: Response) {
    return await this.corporateService.verifyOtp(verifyOtpDto, res);
  }

  // Api for send email otp
  @Post('send-otp')
  async sendOtp(@Body() sendOtpDto: SendOtpDto, @Res() res: Response) {
    return await this.corporateService.sendOtp(sendOtpDto, res);
  }

  // Api for save organization details
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('save-organization')
  async saveOrganization(
    @Body() saveOrganizationDto: SaveOrganizationDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.saveOrganization(
      'add',
      saveOrganizationDto,
      res,
    );
  }

  // Api for update basic details of corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('update-basic-details')
  async updateBasicDetails(
    @Body() updateCorporateDto: UpdateCorporateDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.updateBasicDetails(
      updateCorporateDto,
      res,
    );
  }

  // Api for update organization details
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('update-organization-details')
  async updateOrganizationDetails(
    @Body() saveOrganizationDto: SaveOrganizationDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.saveOrganization(
      'update',
      saveOrganizationDto,
      res,
    );
  }

  //Api for Check Phone or Email already exist
  @Post('check-user')
  async checkUser(@Body() checkUserDto: CheckUserDto, @Res() res: Response) {
    const data = await this.corporateService.checkUser(checkUserDto, res);
    return data;
  }

  //Api for find corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('find-corporate')
  async corporateByMailPhone(
    @Body() getCorporateDto: GetCorporateDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.corporateByMailPhone(
      getCorporateDto,
      res,
    );
  }

  //Api for display permissions form
  @Get('role-permissions')
  async getFormSetting(@Res() res: Response) {
    return await this.corporateService.getRolePermissions(res);
  }

  //Api for role list in dropdown(App)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('role-list/:id')
  async roleList(
    @Param('id') id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.corporateService.roleList(id, query, res);
  }

  //Api for create role
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create-role')
  async createRole(@Body() createRoleDto: CreateRoleDto, @Res() res: Response) {
    return await this.corporateService.createRole(createRoleDto, res);
  }

  //Api for update role
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('update-role')
  async updateRole(@Body() updateRoleDto: UpdateRoleDto, @Res() res: Response) {
    return await this.corporateService.updateRole(updateRoleDto, res);
  }

  //Api for delete role
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-role/:id')
  async deleteRole(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.corporateService.deleteRole(id, res);
  }

  //Api for join in corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('join-corporate')
  async joinCorporate(
    @Body() joinCorporateDto: JoinCorporateDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.joinCorporate(joinCorporateDto, res);
  }

  //Api for find team member
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('find-team-member')
  async findTeamMember(@Body('search') search: string, @Res() res: Response) {
    return await this.corporateService.findTeamMember(search, res);
  }

  //Api for get edit detail
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('edit/:id')
  async editCorporate(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.corporateService.editCorporate(id, res);
  }

  //Api for invite via email
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('invite-by-email')
  async inviteByEmail(
    @Body() inviteByEmailDto: InviteByEmailDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.inviteByEmail(inviteByEmailDto, res);
  }

  // Api call for upload CSV attach in app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @UploadedFile() file,
    @Body('corporate_id', IdMissing) corporate_id,
    @Res() res: Response,
  ) {
    return await this.corporateService.uploadCsv(file, corporate_id, res);
  }

  //Api for download sample csv
  @Get('sample-csv')
  async sampleCsv(@Res() res: Response) {
    return await this.corporateService.sampleCsv(res);
  }

  //Api for add team member
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('add-team-member')
  async addTeamMember(
    @Body() addTeamMemberDto: AddTeamMemberDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.addTeamMember(addTeamMemberDto, res);
  }

  //Api for verify invitation by corporation
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('verify-corporate-invite')
  async verifyCorporateInvite(
    @Body() verifyCorporateInvite: VerifyCorporateInvite,
    @Res() res: Response,
  ) {
    return await this.corporateService.verifyCorporateInvite(
      verifyCorporateInvite,
      res,
    );
  }

  //Api for get my dashboard count
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('dashboard')
  async myDashboard(@Res() res: Response) {
    return await this.corporateService.myDashboard(res);
  }

  // Api for get corporate list for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('list')
  async getCorporateList(@Query() query, @Res() res: Response) {
    return await this.corporateService.getCorporateList(query, res);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/corporate-detail/:id')
  async getCorporateDetail(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.corporateService.getCorporateDetail(id, res);
  }

  //Api for change corporate causes
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('change-causes')
  async selectCauses(
    @Body() changeCausesDto: ChangeCausesDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.changeCauses(changeCausesDto, res);
  }

  //Api for get corporate request lists for fundraiser approval
  @UseGuards(AuthGuard)
  @Post('corporate-request-list')
  @ApiQuery({ name: 'category_slug', required: true })
  async findCorporateRequests(@Body() body: object, @Res() res: Response) {
    return await this.corporateService.findCorporateRequests(body, res);
  }

  //Api for corporate fundraiser request verify
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('verify-fundraiser-request')
  async verifyFundraiserRequest(
    @Body() fundraiserRequestVerifyDto: FundraiserRequestVerifyDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.verifyFundraiserRequest(
      fundraiserRequestVerifyDto,
      res,
    );
  }

  //Api for corporate users list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('user-list')
  async userList(@Body() userListDto: UserListDto, @Res() res: Response) {
    return await this.corporateService.userList(userListDto, res);
  }

  //Api for corporate user list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/user-list/:id')
  async adminUserList(
    @Param('id') id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.corporateService.adminUserList(id, query, res);
  }

  //Api for block user from corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('block-user')
  async blockUser(@Body() blockUserDto: BlockUserDto, @Res() res: Response) {
    return await this.corporateService.blockUser(blockUserDto, res);
  }

  //Api for block user from corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('unblock-user')
  async unblockUser(
    @Body() unblockUserDto: BlockUserDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.unblockUser(unblockUserDto, res);
  }

  //Api for add user as admin in corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('add-remove-admin')
  async addAsAdmin(
    @Body() addRemoveAdminDto: AddRemoveAdminDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.addRemoveAdmin(addRemoveAdminDto, res);
  }

  //Api for remove user from corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('remove-user')
  async removeUser(@Body() removeUserDto: BlockUserDto, @Res() res: Response) {
    return await this.corporateService.removeUser(removeUserDto, res);
  }

  //Api for assign role to user in corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('assign-role')
  async assignRole(@Body() assignRoleDto: AssignRoleDto, @Res() res: Response) {
    return await this.corporateService.assignRole(assignRoleDto, res);
  }

  //Api for leave from corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('leave-corporate')
  async leaveCorporate(@Res() res: Response) {
    return await this.corporateService.leaveCorporate(res);
  }

  //Api for get donations history of user
  @UseGuards(AuthGuard)
  @Get('user-donations/:user_id')
  @ApiBearerAuth('access-token')
  async userDonations(
    @Param('user_id', IdMissing) user_id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.corporateService.userDonations(user_id, query, res);
  }

  // Api for corporate user Log
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('user-log/:user_id')
  async userLogList(
    @Param('user_id', IdMissing) user_id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.corporateService.userLogList(user_id, query, res);
  }

  //Api for check invite in corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('check-invite-email')
  async checkInvite(@Body('email') email: string, @Res() res: Response) {
    return await this.corporateService.checkInviteEmail(email, res);
  }

  //Api for check business email when join corporate
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('check-business-email')
  async checkBusinessEmail(
    @Body() businessEmailDto: BusinessEmailDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.checkBusinessEmail(
      businessEmailDto,
      res,
    );
  }

  //Api for update corporate logo
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('update-profile-photo')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePhoto(
    @UploadedFile() file,
    @Body() updateProfileDto: UpdateProfileDto,
    @Res() res: Response,
  ) {
    return await this.corporateService.updateProfilePhoto(
      file,
      updateProfileDto,
      res,
    );
  }
}
