import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { DriveService } from './drive.service';
import { CreateDriveDto } from './dto/create-drive.dto';
import { LikeDislikeDto } from './dto/like-dislike.dto';
import { UpdateDriveDto } from './dto/update-drive.dto';
import { GetReasonDto } from './dto/get-reason.dto';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { OptionalAuthGuard } from 'src/auth/gaurds/optional-auth.guard';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { RemoveAttendeeDto } from './dto/remove-attendee.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { DeleteUserDriveEventDto } from './dto/delete-user-drive-event.dto';
import { UserDriveEventDto } from './dto/user-drive-event.dto';
import { CommentDto } from './dto/comment.dto';
import { RequestService } from '../request/request.service';
import { ManagePermissionDto } from './dto/manage-permission.dto';
import { GetUserByMailDto } from './dto/get-user.dto';
import { AddAsVolunteer } from './dto/add-as-volunteer';
import { InviteVolunteerDto } from './dto/invite-volunteer.dto';
import { ParamMissing } from 'src/auth/param-missing.pipe';
import { NgoRequestsDto } from './dto/ngo-requests.dto';
@ApiTags('drive')
@Controller('drive')
export class DriveController {
  constructor(
    private readonly driveService: DriveService,
    private readonly requestService: RequestService,
  ) {}

  // Api for create drive
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(@Body() createDriveDto: CreateDriveDto, @Res() res: Response) {
    return await this.driveService.createDrive(createDriveDto, res);
  }

  //Api for list drive
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('list')
  async findAll(@Body() body: object, @Res() res: Response) {
    return await this.driveService.findAll(body, res);
  }

  //Api for list ngo drive
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('ngo-drive-list')
  async ngoDriveList(
    @Body() ngoRequestsDto: NgoRequestsDto,
    @Res() res: Response,
  ) {
    return await this.driveService.ngoDriveList(ngoRequestsDto, res);
  }

  //Api for get drive list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async adminFundList(@Query() query, @Res() res: Response) {
    return await this.driveService.adminDriveList(query, res);
  }

  //Api for get edit detail
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('edit/:id')
  async editDrive(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.driveService.editDrive(id, res);
  }

  //Api for drive details
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('detail/:id')
  async driveDetails(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.driveService.driveDetails('app', id, query, res);
  }

  //Api for get drive details
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/detail/:id')
  async getdriveDetails(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.driveService.driveDetails('admin', id, null, res);
  }

  //Api for update drive
  @UseGuards(AuthGuard)
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateDriveDto: UpdateDriveDto,
    @Res() res: Response,
  ) {
    return await this.driveService.updateDrive(id, updateDriveDto, res);
  }

  //Api for Join Drive
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('join')
  async joinDrive(@Body('id') id: string, @Res() res: Response) {
    return await this.driveService.joinDrive(id, res);
  }

  //Api for leave drive
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('leave/:id')
  async leaveDrive(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.driveService.leaveDrive(id, res);
  }

  //Api for remove attendee from volunteer
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('remove-attendee')
  async removeAttendee(
    @Body() removeAttendeeDto: RemoveAttendeeDto,
    @Res() res: Response,
  ) {
    return await this.driveService.removeAttendee(removeAttendeeDto, res);
  }

  //Api for cancel drive
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('cancel')
  async cancelDrive(
    @Body() cancelDriveDto: GetReasonDto,
    @Res() res: Response,
  ) {
    return await this.driveService.cancelDrive(cancelDriveDto, res);
  }

  // Api for report drive
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('report-drive')
  async reportDrive(
    @Body() reportDriveDto: GetReasonDto,
    @Res() res: Response,
  ) {
    return await this.driveService.reportDrive(reportDriveDto, res);
  }

  //Api for reported user list of drive for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('reported-user-list/:id')
  async reportDriveUserList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.driveService.reportDriveUserList(id, query, res);
  }

  //Api for block drive
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('block')
  async blockDrive(@Body() blockDriveDto: GetReasonDto, @Res() res: Response) {
    return await this.driveService.blockDrive(blockDriveDto, res);
  }

  //Api for unblock drive
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('unblock')
  async unblockDrive(@Body('id') id: string, @Res() res: Response) {
    return await this.driveService.unblockDrive(id, res);
  }

  //Api for list volunteer(attendes/blocked)
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('volunteer-list/:id')
  async volunteersList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.driveService.volunteerList('app', id, query, res);
  }

  // Api for list volunteer(attendes/blocked) in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/volunteer-list/:id')
  async adminVolunteersList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.driveService.volunteerList('admin', id, query, res);
  }

  // Api for delete drive
  @ApiBearerAuth('access-token') //edit here
  @UseGuards(AuthGuard)
  @Delete('delete/:id')
  async deleteDrive(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.driveService.deleteDrive(id, res);
  }

  //Api for create post in drive
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create-post')
  async createPost(@Body() createPostDto: CreatePostDto, @Res() res: Response) {
    return await this.driveService.createPost(createPostDto, res);
  }

  //Api for drive feed list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('feed-list/:id')
  async feedList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.driveService.feedList(id, query, res);
  }

  //Api for drive feed list for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/feed-list/:id')
  async adminFeedList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.driveService.feedList(id, query, res);
  }

  // Api for post like unlike
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('post-like-dislike')
  async likeUnlike(
    @Body() likeDislikeDto: LikeDislikeDto,
    @Res() res: Response,
  ) {
    return await this.driveService.likeUnlike(likeDislikeDto, res);
  }

  // Api for post likes user list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('post-like-list/:id')
  async likeList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.driveService.likeList(id, query, res);
  }

  // Api for post likes user list for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/post-like-list/:id')
  async postLikeList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.driveService.likeList(id, query, res);
  }

  //Api for create comment in drive post
  @UseGuards(AuthGuard)
  @Post('add-comment')
  @ApiBearerAuth('access-token')
  async addComment(@Body() commentDto: CommentDto, @Res() res: Response) {
    return await this.requestService.addComment('drive', commentDto, res);
  }

  //Api for update comment in drive post
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

  //Api for delete comment in drive post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-comment/:id')
  async deleteComment(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.requestService.deleteComment(id, res);
  }

  // Api for comment list in drive post
  @UseGuards(AuthGuard)
  @Get('comment-list/:id')
  @ApiBearerAuth('access-token')
  async commentList(
    @Param('id') id: string,
    @Query() query: string,
    @Res() res: Response,
  ) {
    return await this.requestService.commentList('drive', id, query, res);
  }

  // Api for comment list in drive post for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/comment-list/:id')
  @ApiBearerAuth('access-token')
  async postCommentList(
    @Param('id') id: string,
    @Query() query: string,
    @Res() res: Response,
  ) {
    return await this.requestService.commentList('drive', id, query, res);
  }

  //Api for report post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('report-post')
  async reportPost(@Body() reportDriveDto: GetReasonDto, @Res() res: Response) {
    return await this.driveService.reportPost(reportDriveDto, res);
  }

  //Api for create drive event
  @Post('event-create')
  async eventCreate(
    @Body() userDriveEventDto: UserDriveEventDto,
    @Res() res: Response,
  ) {
    return await this.driveService.eventCreate(userDriveEventDto, res);
  }

  // Api for delete drive post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-post/:id')
  async deletePost(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.driveService.deletePost(id, res);
  }

  //Api for delete drive event
  @Delete('event-delete')
  async eventDelete(
    @Body() deleteUserDriveEventDto: DeleteUserDriveEventDto,
    @Res() res: Response,
  ) {
    return await this.driveService.eventDelete(deleteUserDriveEventDto, res);
  }

  //Api for block drive post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('block-post')
  async blockPost(@Body() id: string, @Res() res: Response) {
    return await this.driveService.blockPost(id, res);
  }

  //Api for unblock volunteer in drive
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('unblock-volunteer')
  async unblockVolunteer(
    @Body() unblockVolunteer: AddAsVolunteer,
    @Res() res: Response,
  ) {
    return await this.driveService.unblockVolunteer(unblockVolunteer, res);
  }

  //Api for manage drive permission
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('manage-permission')
  async managePermission(
    @Body() managePermissionDto: ManagePermissionDto,
    @Res() res: Response,
  ) {
    return await this.driveService.managePermission(managePermissionDto, res);
  }

  //Api for get user by e-mail or phone
  @Post('get-user-by-email-phone')
  async userByMailPhone(
    @Body() getUserByMailDto: GetUserByMailDto,
    @Res() res: Response,
  ) {
    return await this.driveService.userByMailPhone(getUserByMailDto, res);
  }

  //Api for add attendees as volunteer
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('add-as-volunteer')
  async addAsVolunteer(
    @Body() addAsVolunteer: AddAsVolunteer,
    @Res() res: Response,
  ) {
    return await this.driveService.addAsVolunteer(addAsVolunteer, res);
  }

  //Api for invite volunteer
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('invite-volunteer')
  async inviteVolunteer(
    @Body() inviteVolunteerDto: InviteVolunteerDto,
    @Res() res: Response,
  ) {
    return await this.driveService.inviteVolunteer(inviteVolunteerDto, res);
  }

  //Api for get fundraiser
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('fundraiser-list')
  async fundraiserList(@Query() query: string, @Res() res: Response) {
    return await this.driveService.fundraiserList(query, res);
  }

  //Api for get fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('fund-list')
  async fundList(@Query() query: string, @Res() res: Response) {
    return await this.driveService.fundList(query, res);
  }

  //Api for get linked fundraiser
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('linked-fundraiser-list')
  async linkedfundraiserList(@Query() query, @Res() res: Response) {
    return await this.driveService.linkedfundraiserList(query, res);
  }

  //Api for get linked fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('linked-fund-list')
  async linkedfundList(@Query() query, @Res() res: Response) {
    return await this.driveService.linkedfundList(query, res);
  }

  //Api for get drive fund and fundraiser list
  @Get('fund-fundraiser-list')
  async fundFundraiserList(
    @Query('drive_id', ParamMissing) drive_id,
    @Res() res: Response,
  ) {
    return await this.driveService.fundFundraiserList(drive_id, res);
  }
}
