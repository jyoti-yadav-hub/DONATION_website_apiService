/* eslint-disable prettier/prettier */
import {
  Get,
  Res,
  Put,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { CommentDto } from './dto/comments.dto';
import { RequestService } from './request.service';
import { PrepareFood } from './dto/prepare-food.dto';
import { NewRequestDto } from './dto/new-request.dto';
import { VolunteerService } from './volunteer.service';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { CancelRequest } from './dto/cancel-request.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateRequestDto } from './dto/update-request.dto';
import { AssignVolunteer } from './dto/assign-volunteer.dto';
import { ManualTransferDto } from './dto/manual-transfer.dto';
import { UpdateOrderStatus } from './dto/update-order-status.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IncreaseReelsCount } from './dto/increase-reels-count.dto';
import { VerifyFundraiserDto } from './dto/verify-fundraiser-request.dto';
import { UpdateVolunteerLocation } from './dto/update-volunteer-location.dto';
import { DeleteOngoingRequestsDto } from '../request/dto/delete-ongoing-requests.dto';
import { ExpiryDateDto } from '../request/dto/expiry-date.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { VerifyTestimonialDto } from './dto/verify-testimonial.dto';
import { FundraiserStatus } from './dto/fundraiser-status.dto';
import { OptionalAuthGuard } from 'src/auth/gaurds/optional-auth.guard';
import { FundraiserRequestVerifyDto } from './dto/fundraiser-request-verify.dto';
import { ReelsDto } from './dto/reels.dto';
import { SendInviteDto } from './dto/send-invite.dto';
import { VerifyFundraiserInvite } from './dto/verify-fundraiser-invite.dto';
import { GetUserByMailDto } from './dto/get-user.dto';
import { ParamMissing } from 'src/auth/param-missing.pipe';
import { RemoveAdminDto } from './dto/remove-admin.dto';
import { ManagePermissionDto } from './dto/manage-permission.dto';
import { ListAdminDto } from './dto/list-admin.dto';
import { CheckUhidDto } from './dto/check-uhid.dto';
import { LogService } from 'src/common/log.service';
import { FundraiserActivityLogDto } from './dto/fundraiser-activity-logs.dto';
import { ActivePastDto } from './dto/active-past.dto';
@ApiTags('Request')
@Controller('request')
export class RequestController {
  constructor(
    private readonly logService: LogService,
    private readonly requestService: RequestService,
    private readonly volunteerService: VolunteerService,
  ) {}

  //Api for create new cause request
  @UseGuards(AuthGuard)
  @Post('send-cause-request')
  @ApiBearerAuth('access-token')
  async createCauseRequest(
    @Body() newRequestDto: NewRequestDto,
    @Res() res: Response,
  ) {
    return await this.requestService.createCauseRequest(newRequestDto, res);
  }

  //Api for update cause request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('update-cause-request/:id')
  async updateCauseRequest(
    @Param('id', IdMissing) id: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @Res() res: Response,
  ) {
    return await this.requestService.updateCauseRequest(
      id,
      updateRequestDto,
      res,
    );
  }

  //Api for get food request list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/cause-request-list')
  async findAllRequest(@Query() query, @Res() res: Response) {
    return await this.requestService.findAllRequest(query, res);
  }

  //Api for get food request lists in app
  @UseGuards(OptionalAuthGuard)
  @Post('food-request-list')
  @ApiQuery({ name: 'category_slug', required: true })
  async findUserFoodRequests(@Body() body: object, @Res() res: Response) {
    return await this.requestService.findUserFoodRequests(body, res);
  }

  //Api for get similar food request lists in app
  @UseGuards(OptionalAuthGuard)
  @Post('similar-fundraisers/:id')
  async similarFundraiser(
    @Param('id', IdMissing) id: string,
    @Body() body: object,
    @Res() res: Response,
  ) {
    return await this.requestService.similarFundraiser(id, body, res);
  }

  //Api for get fundraisers request lists in app for volunteer
  @UseGuards(AuthGuard)
  @Post('volunteer-request-list')
  @ApiQuery({ name: 'category_slug', required: true })
  async findVolunteersRequests(@Body() body: object, @Res() res: Response) {
    return await this.requestService.findVolunteersRequests(body, res);
  }

  @Post('food-request-list-new')
  @ApiQuery({ name: 'category_slug', required: true })
  async findUserFoodRequestsNew(@Body() body: object, @Res() res: Response) {
    return await this.requestService.findUserFoodRequestsNew(body, res);
  }

  //Api for get food request detail in app
  @Get('cause-request-detail')
  async getCauseDetail(@Query() query, @Res() res: Response) {
    return await this.requestService.getDetail('app', query, res);
  }

  //Api for get food request detail admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/cause-request-detail')
  async getAdminCauseDetail(@Query() query, @Res() res: Response) {
    return await this.requestService.getRequestDetail(query, res);
  }

  // Api call for upload image and video attach in app
  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file, @Res() res: Response) {
    return await this.requestService.uploadFile(file, res);
  }

  // Api call for upload image and video attach in app
  @Post('upload-file-s3')
  async uploadFileS3(@Query('file') file: string, @Res() res: Response) {
    return await this.requestService.uploadFileS3(file, res);
  }

  //Api for update food request status(donor_accept, volunteer_accept, pickup, delivered)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('update-order-status/:id')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatus: UpdateOrderStatus,
    @Res() res: Response,
  ) {
    return await this.requestService.updateOrderStatus(
      id,
      updateOrderStatus,
      res,
    );
  }

  //Api for assign/find volunteer to food request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('assign-volunteer/:id')
  async assignVolunteer(
    @Param('id') id: string,
    @Body() assignVolunteer: AssignVolunteer,
    @Res() res: Response,
  ) {
    return await this.volunteerService.assignVolunteer(
      id,
      assignVolunteer,
      res,
    );
  }

  //Api for update volunteer location in request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('update-volunteer-location/:id')
  async updateVolunteerLocation(
    @Param('id') id: string,
    @Body() updateVolunteerLocation: UpdateVolunteerLocation,
    @Res() res: Response,
  ) {
    return await this.volunteerService.updateVolunteerLocation(
      id,
      updateVolunteerLocation,
      res,
    );
  }

  //API for cancel food request
  @UseGuards(AuthGuard)
  @Put('cancel-request/:id')
  @ApiBearerAuth('access-token')
  async cancelRequest(
    @Param('id') id: string,
    @Body() cancelRequest: CancelRequest,
    @Res() res: Response,
  ) {
    return await this.requestService.cancelRequest(id, cancelRequest, res);
  }

  //Api for add food preparing time in request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('add-food-prepare-time/:id')
  async addFoodPrepareTime(
    @Param('id') id: string,
    @Body() prepareFood: PrepareFood,
    @Res() res: Response,
  ) {
    return await this.requestService.addFoodPrepareTime(id, prepareFood, res);
  }

  //Api for verify fundraiser request in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('fundraiser-verify/:id')
  async verifyFundraiser(
    @Param('id') id: string,
    @Body() verifyFundraiserDto: VerifyFundraiserDto,
    @Res() res: Response,
  ) {
    return await this.requestService.verifyFundraiser(
      id,
      verifyFundraiserDto,
      res,
    );
  }

  //Api for report benificiary in request
  @UseGuards(AuthGuard)
  @Put('report-benificiary/:id')
  @ApiBearerAuth('access-token')
  async reportBenificiary(
    @Param('id') id: string,
    @Body('description') description: string,
    @Res() res: Response,
  ) {
    return await this.requestService.reportBenificiary(id, description, res);
  }

  //Api for get featured request list for app(Home page)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('featured-list')
  @ApiBearerAuth('access-token')
  async featureList(@Res() res: Response) {
    return await this.requestService.featureList(res);
  }

  //Api for get donors list in app
  @Get('transaction-list/:id')
  async transactionList(
    @Param('id') id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.requestService.transactionList(id, query, res);
  }

  //Api for get donors list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/donors-list/:id')
  @ApiBearerAuth('access-token')
  async donorsList(
    @Param('id') id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.requestService.transactionList(id, query, res);
  }

  //Api for get ngo donation list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/ngo-donors-list/:id')
  @ApiBearerAuth('access-token')
  async ngoDonorsList(
    @Param('id') id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.requestService.ngoDonorsList(id, query, res);
  }

  //Api for get all transaction list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/transaction-list')
  @ApiBearerAuth('access-token')
  async adminTransactionList(@Query() query, @Res() res: Response) {
    return await this.requestService.transactionList(null, query, res);
  }

  //Api for get feature transcation list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/feature-payment-list')
  @ApiBearerAuth('access-token')
  async adminFeaturePaymentList(@Query() query, @Res() res: Response) {
    return await this.requestService.adminFeaturePaymentList(query, res);
  }

  // Api for view all donation transaction receipt of user
  @UseGuards(AuthGuard)
  @Get('view-receipt/:id')
  @ApiBearerAuth('access-token')
  async receiptList(
    @Param('id') id: string,
    @Query() query: string,
    @Res() res: Response,
  ) {
    return await this.requestService.receiptList(id, query, res);
  }

  // Api for my donation list, active donation list(Home page)
  @UseGuards(AuthGuard)
  @Get('my-donations-list')
  @ApiBearerAuth('access-token')
  async myDonationsList(@Query() query, @Res() res: Response) {
    return await this.requestService.myDonationsList(query, res);
  }

  // Api for my fundraiser list for app
  @UseGuards(AuthGuard)
  @Get('fundraiser-list')
  @ApiBearerAuth('access-token')
  async fundraiserList(@Query() query, @Res() res: Response) {
    return await this.requestService.fundraiserList(query, res);
  }

  // API for get active and past fundraiser requests
  @Get('fundraiser-requests')
  async fundraiserRequest(
    @Query() activePastDto: ActivePastDto,
    @Res() res: Response,
  ) {
    return await this.requestService.fundraiserRequest(activePastDto, res);
  }

  // Api for my feature transaction list
  @UseGuards(AuthGuard)
  @Get('transaction-history')
  @ApiBearerAuth('access-token')
  async transactionHistory(@Query() query, @Res() res: Response) {
    return await this.requestService.transactionHistory(query, res);
  }

  //Api for delete request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('delete/:id')
  async deleteRequest(@Param('id') id: string, @Res() res: Response) {
    return await this.requestService.deleteRequest(id, res);
  }

  //Api for reverify fundraiser request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('fundraiser-reverify/:id')
  async reverifyRequest(@Param('id') id: string, @Res() res: Response) {
    return await this.requestService.reverifyRequest(id, res);
  }

  //Api for get urgent request list for app
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('urgent-request-list')
  async findUrgentRequest(@Body() body, @Res() res: Response) {
    return await this.requestService.findUrgentRequest(body, res);
  }

  //Api for verify urgent fundraiser request in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('verify-urgent-fundraiser/:id')
  async verifyUrgentFundraiser(
    @Param('id') id: string,
    @Body() verifyFundraiserDto: VerifyFundraiserDto,
    @Res() res: Response,
  ) {
    return await this.requestService.verifyUrgentFundraiser(
      id,
      verifyFundraiserDto,
      res,
    );
  }

  // Api for ngo transaction list
  @UseGuards(AuthGuard)
  @Get('ngo-donation-list')
  @ApiBearerAuth('access-token')
  async ngoDonationList(@Query() query, @Res() res: Response) {
    return await this.requestService.ngoDonationList(query, res);
  }

  //Api for get food request videos list for app
  @Get('reels')
  async reelsList(@Query() reelsDto: ReelsDto, @Res() res: Response) {
    return await this.requestService.reelsList(reelsDto, res);
  }

  //Api for Increase reeels count
  @Post('increase-reels-count')
  async increaseReelsCount(
    @Body() increaseReelsCount: IncreaseReelsCount,
    @Res() res: Response,
  ) {
    return await this.requestService.increaseReelsCount(
      increaseReelsCount,
      res,
    );
  }

  //Api for create comment
  @UseGuards(AuthGuard)
  @Post('add-comment')
  @ApiBearerAuth('access-token')
  async addComment(@Body() commentDto: CommentDto, @Res() res: Response) {
    return await this.requestService.addComment('request', commentDto, res);
  }

  //Api for update comment
  @UseGuards(AuthGuard)
  @Put('update-comment/:id')
  @ApiBearerAuth('access-token')
  async updateComment(
    @Param('id') id: string,
    @Body('comment') comment: string,
    @Res() res: Response,
  ) {
    return await this.requestService.updateComment(id, comment, res);
  }

  // Api for comment list
  @UseGuards(AuthGuard)
  @Get('comment-list/:name')
  @ApiBearerAuth('access-token')
  async commentList(
    @Param('name') name: string,
    @Query() query: string,
    @Res() res: Response,
  ) {
    return await this.requestService.commentList('request', name, query, res);
  }

  //Api for create fundraiser status
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create-fundraiser-status')
  async createFundraiserStatus(
    @Body() fundraiserStatus: FundraiserStatus,
    @Res() res: Response,
  ) {
    return await this.requestService.createFundraiserStatus(
      fundraiserStatus,
      res,
    );
  }

  //Api for update fundraiser status
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('update-fundraiser-status/:id')
  async updateFundraiserStatus(
    @Param('id') id: string,
    @Body() fundraiserStatus: FundraiserStatus,
    @Res() res: Response,
  ) {
    return await this.requestService.updateFundraiserStatus(
      id,
      fundraiserStatus,
      res,
    );
  }

  // Api for delete fundraiser status
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-fundraiser-status/:id')
  async remove(
    @Param('id') id: string,
    @Body('request_id') request_id: string,
    @Res() res: Response,
  ) {
    return await this.requestService.deleteFundraiserStatus(
      id,
      request_id,
      res,
    );
  }

  // Api for request admin to delete all request of user
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('delete-ongoing-requests')
  async requestForDeleteOngoingRequests(
    @Body() deleteOngoingRequestsDto: DeleteOngoingRequestsDto,
    @Res() res: Response,
  ) {
    return await this.requestService.requestForDeleteOngoingRequests(
      deleteOngoingRequestsDto,
      res,
    );
  }

  // Api for  request admin to delete all request of user
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('verify-delete-request')
  async verifyDeleteRequest(
    @Body() deleteOngoingRequestsDto: DeleteOngoingRequestsDto,
    @Res() res: Response,
  ) {
    return await this.requestService.verifyDeleteRequest(
      deleteOngoingRequestsDto,
      res,
    );
  }

  //This api is used for get form setting for request and fund at create & edit time
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('get-form-setting/:id')
  async formData(
    @Param('id') id: string,
    @Query('type') type: string,
    @Res() res: Response,
  ) {
    return await this.requestService.formData(id, type, res);
  }

  //Api for update expiry date
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('update-expiry-date')
  async updateExpiryDate(
    @Body() expiryDateDto: ExpiryDateDto,
    @Res() res: Response,
  ) {
    return await this.requestService.updateExpiryDate(expiryDateDto, res);
  }

  //Api for upload thank you video
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('upload-testimonial')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file,
    @Body('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    const data = await this.volunteerService.uploadTestimonialVideo(
      file,
      id,
      res,
    );
    return data;
  }

  //Api for update expiry date
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('verify-testimonial')
  async verifyTestimonial(
    @Body() verifyTestimonialDto: VerifyTestimonialDto,
    @Res() res: Response,
  ) {
    return await this.volunteerService.verifyTestimonial(
      verifyTestimonialDto,
      res,
    );
  }

  //Api for get testimonial video list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/testimonial-list')
  async adminTestimonialList(@Query() query, @Res() res: Response) {
    return await this.volunteerService.testimonialList('admin', query, res);
  }

  //Api for get testimonial video list in app
  @Get('testimonial-list')
  async testimonialList(@Query() query, @Res() res: Response) {
    return await this.volunteerService.testimonial(query, res);
  }

  // Api for delete comment
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-comment/:id')
  async deleteComment(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.requestService.deleteComment(id, res);
  }

  //Api for manually transfer donation
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('admin/manual-transfer')
  @UseInterceptors(FileInterceptor('file'))
  async manualTransfer(
    @Body() manualTransferdto: ManualTransferDto,
    @UploadedFile() file,
    @Res() res: Response,
  ) {
    return await this.requestService.manualTransfer(
      manualTransferdto,
      file,
      res,
    );
  }

  //Api for total amount of saayam
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/saayam-amount')
  @ApiBearerAuth('access-token')
  async adminSaayamAmount(@Query() query, @Res() res: Response) {
    return await this.requestService.adminSaayamAmount(query, res);
  }

  //Api for assign volunteer admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('admin/assign-volunteer')
  async assignVolunteerforFundraiser(
    @Body('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.volunteerService.assignVolunteerForFundraiser(id, res);
  }

  //Api for fundraiser request volunteer accept
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('volunteer-accept')
  async volunteerAccept(
    @Body('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.volunteerService.volunteerAccept(id, res);
  }

  // Api for verify fundraiser by volunteer
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('verify-fundraiser-request')
  async verifyFundraiserRequest(
    @Body() fundraiserRequestVerifyDto: FundraiserRequestVerifyDto,
    @Res() res: Response,
  ) {
    return await this.volunteerService.verifyFundraiserRequest(
      fundraiserRequestVerifyDto,
      res,
    );
  }

  //Api for send invite
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('send-invite')
  async sendInvite(@Body() sendInviteDto: SendInviteDto, @Res() res: Response) {
    return await this.requestService.sendInvite(sendInviteDto, res);
  }

  //Api for verify invitation
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('verify-fundraiser-invite')
  async verifyFundraiserInvite(
    @Body() VerifyFundraiserInvite: VerifyFundraiserInvite,
    @Res() res: Response,
  ) {
    return await this.requestService.verifyFundraiserInvite(
      VerifyFundraiserInvite,
      res,
    );
  }

  //Api for fundraiser admin list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('admin-list/:id')
  async adminList(
    @Param('id', IdMissing) id: string,
    @Query() listAdminDto: ListAdminDto,
    @Res() res: Response,
  ) {
    return await this.requestService.adminList(id, listAdminDto, res);
  }

  //Api for fundraiser admin list for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list-admin/:id')
  async listAdmins(
    @Param('id', IdMissing) id: string,
    @Query() listAdminDto: ListAdminDto,
    @Res() res: Response,
  ) {
    return await this.requestService.adminList(id, listAdminDto, res);
  }

  //Api for get user by e-mail or phone
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('get-user-by-email-phone')
  async userByMailPhone(
    @Body() getUserByMailDto: GetUserByMailDto,
    @Res() res: Response,
  ) {
    return await this.requestService.userByMailPhone(getUserByMailDto, res);
  }

  //Api for remove admin from fundraiser
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('remove-admin')
  async removeAdmin(
    @Body() removeAdminDto: RemoveAdminDto,
    @Res() res: Response,
  ) {
    return await this.requestService.removeAdmin(removeAdminDto, res);
  }

  //Api for return fundraiser admin count status wise
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('manage-admin-count')
  async manageAdminCount(
    @Query('request_id', ParamMissing) request_id: string,
    @Res() res: Response,
  ) {
    return await this.requestService.manageAdminCount(request_id, res);
  }

  //Api for manage fundraisers permission
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('manage-permission')
  async managePermission(
    @Body() managePermissionDto: ManagePermissionDto,
    @Res() res: Response,
  ) {
    return await this.requestService.managePermission(managePermissionDto, res);
  }

  //Api for Check uhid
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('check-uhid')
  async checkUser(@Body() checkUhidDto: CheckUhidDto, @Res() res: Response) {
    const data = await this.requestService.checkUser(checkUhidDto, res);
    return data;
  }

  // Api for fundraiser activity log list
  @UseGuards(AuthGuard)
  @Get('activity-log')
  @ApiBearerAuth('access-token')
  async activityLogList(
    @Query() fundraiserActivityLog: FundraiserActivityLogDto,
    @Res() res: Response,
  ) {
    return await this.logService.fundraiserLogList(fundraiserActivityLog, res);
  }

  // Api for get last updated request history
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/last-request-history')
  @ApiBearerAuth('access-token')
  async lastRequestHistory(
    @Query('request_id', ParamMissing) request_id: string,
    @Res() res: Response,
  ) {
    return await this.requestService.lastRequestHistory(request_id, res);
  }

  //Api for get request category_slug
  @Get('get-category-slug/:id')
  async getCategorySlug(@Param('id') id: string, @Res() res: Response) {
    return await this.requestService.getCategorySlug(id, res);
  }
}
