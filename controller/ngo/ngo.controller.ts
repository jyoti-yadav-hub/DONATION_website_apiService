/* eslint-disable prettier/prettier */
import {
  Put,
  Res,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { NGOService } from './ngo.service';
import { CreateNgoDto } from './dto/create-ngo.dto';
import { UpdateNgoDto } from './dto/update-ngo.dto';
import { AdminCreateNgoDto } from './dto/admin-create-ngo.dto';
import { VerifyNgoDto } from './dto/verify-ngo.dto';
import { GetUserByMailDto } from './dto/get-user.dto';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { AddTrusteesDto } from './dto/add-trustees.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { RemoveTrusteeDto } from './dto/remove-trustee.dto';
import { NgoSocialLoginDto } from './dto/ngo-social-login.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { TransferFinalAmountDto } from './dto/transfer-final-amount.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { EditHistoryDto } from './dto/edit-history.dto';
import { EditVissionDto } from './dto/edit-vission.dto';
import { RequestService } from '../request/request.service';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { CreateNgo } from './dto/create.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateDto } from './dto/update.dto';
import { LikeDislikeDto } from '../drive/dto/like-dislike.dto';
import { CommentDto } from '../drive/dto/comment.dto';
import { AdminNgoCreateDto } from './dto/admin-ngo-create.dto';
import { AdminNgoUpdateDto } from './dto/admin-ngo-update.dto';
import { ParamMissing } from 'src/auth/param-missing.pipe';
import { OptionalAuthGuard } from 'src/auth/gaurds/optional-auth.guard';

@Controller('ngo')
@ApiTags('Ngo')
export class NGOController {
  constructor(
    private readonly ngoService: NGOService,
    private readonly requestService: RequestService,
  ) {}

  //Api for register NGO
  @Post('create-ngo')
  async ngoCreate(@Body() createNgoDto: CreateNgoDto, @Res() res: Response) {
    return await this.ngoService.ngoCreate(createNgoDto, res);
  }

  //Api for update ngo from admin panel
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('admin/create-ngo')
  async adminNgoCreate(
    @Body() createNgoDto: AdminCreateNgoDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.adminNgoCreate(createNgoDto, res);
  }

  //Api for register NGO from admin panel
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('admin/update-ngo/:id')
  async adminNgoUpdate(
    @Param('id', IdMissing) id: string,
    @Body() createNgoDto: AdminCreateNgoDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.adminNgoUpdate(id, createNgoDto, res);
  }

  //Edit ngo api
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/edit-ngo/:id')
  async editNgo(@Param('id') id: string, @Res() res: Response) {
    return await this.ngoService.editNgo(id, res);
  }

  //Api for register NGO
  @Post('ngo-social-login')
  async ngoSocialLogin(
    @Body() ngoSocialLoginDto: NgoSocialLoginDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.ngoCreate(ngoSocialLoginDto, res);
  }

  //Api for get user by e-mail or phone
  @Post('get-user-by-email-phone')
  async userByMailPhone(
    @Body() getUserByMailDto: GetUserByMailDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.userByMailPhone(getUserByMailDto, res);
  }

  //Api for add trustee in NGO
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('add-trustees/:id')
  async addTrustees(
    @Param('id', IdMissing) id: string,
    @Body() addTrusteesDto: AddTrusteesDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.addTrustees(id, addTrusteesDto, res);
  }

  //Api for uodate NGO profile
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('update-ngo/:id')
  async updateNgo(
    @Param('id', IdMissing) id: string,
    @Body() updateNgoDto: UpdateNgoDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.ngoupdate(id, updateNgoDto, res);
  }

  //Api for remove trustee from NGO
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('remove-trustees/:id')
  async removeTrustee(
    @Param('id', IdMissing) id: string,
    @Body() removeTrusteeDto: RemoveTrusteeDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.removeTrustees(id, removeTrusteeDto, res);
  }

  //Api for verify trustee
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('verify-trustee/:id')
  async verifyTrustee(
    @Param('id', IdMissing) id: string,
    @Body() verifyNgoDto: VerifyNgoDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.verifyTrustee(id, verifyNgoDto, res);
  }

  //Api for transfer NGO ownership to trustee2
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('transfer-ownership/:id')
  async transferOwnership(
    @Param('id', IdMissing) id: string,
    @Body() transferOwnershipDto: TransferOwnershipDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.transferOwnership(
      id,
      transferOwnershipDto,
      res,
    );
  }

  // Api for get ngo lists
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('ngo-list')
  async getNgoList(@Query() query, @Res() res: Response) {
    return await this.ngoService.getNgoList(query, res);
  }

  // Api for get ngo details
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('get-ngo-detail/:id')
  async getNgoDetails(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.ngoService.getNgoDetails(id, res);
  }

  // Api for get ngo details
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin/get-ngo-detail/:id')
  async getNgoData(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.ngoService.getNgoData(id, res);
  }

  //Api for verify NGO by admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('ngo-verify/:id')
  async ngoVerify(
    @Param('id', IdMissing) id: string,
    @Body() verifyNgoDto: VerifyNgoDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.ngoVerify(id, verifyNgoDto, res);
  }

  //Api for favourite/unfavourite NGO
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('favourite-ngo/:id')
  async ngoFavourite(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.ngoService.ngoFavourite(id, res);
  }

  //Api for get all ngo lists
  @Get('all-ngo-list')
  async findFavourite(@Query() query, @Res() res: Response) {
    return await this.ngoService.allNgoList(query, res);
  }

  //Api favourite NGO list for app
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('favourite-ngo-list')
  async findFavouriteNGO(@Query() query, @Res() res: Response) {
    return await this.ngoService.findFavouriteNGO(query, res);
  }

  //Api for chnage favourite NGO position
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('favourite-ngo-change-index')
  async changeIndex(@Body() body: string, @Res() res: Response) {
    return await this.ngoService.changeIndex(body, res);
  }

  //Api for admin delete ngo
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-ngo/:id')
  async deleteNgo(
    @Param('id', IdMissing) id: string,
    @Body('delete_reason') delete_reason: string,
    @Res() res: Response,
  ) {
    return await this.ngoService.deleteNgo(id, delete_reason, res);
  }

  //Api for report ngo
  @UseGuards(AuthGuard)
  @Put('report-ngo/:id')
  @ApiBearerAuth('access-token')
  async reportNgo(
    @Param('id') id: string,
    @Body('description') description: string,
    @Res() res: Response,
  ) {
    return await this.ngoService.reportNgo(id, description, res);
  }

  //Api for add ngo certificate
  @UseGuards(AuthGuard)
  @Post('add-certificate/:id')
  @ApiBearerAuth('access-token')
  async addCertificate(
    @Param('id') id: string,
    @Body('ngo_certificate') ngo_certificate: string,
    @Res() res: Response,
  ) {
    return await this.ngoService.addCertificate(id, ngo_certificate, res);
  }

  //Api for list ngo certificate
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('certificate-list/:id')
  async ngoCertificateList(
    @Param('id') id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.ngoService.ngoCertificateList(id, query, res);
  }

  //Api for certificate accept/reject
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('certificate-action/:id')
  async ngoCertificateAction(
    @Param('id', IdMissing) id: string,
    @Body() body,
    @Res() res: Response,
  ) {
    return await this.ngoService.ngoCertificateAction(id, body, res);
  }

  //Api for reject ngo current changes
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('reject-current-change/:id')
  async rejectCurrentChange(
    @Param('id', IdMissing) id: string,
    @Body('reason') reason: string,
    @Res() res: Response,
  ) {
    return await this.ngoService.rejectCurrentChange(id, reason, res);
  }

  //Api for edit ngo vission, mission, programs
  @UseGuards(AuthGuard)
  @Put('edit-vision/:id')
  @ApiBearerAuth('access-token')
  async editVission(
    @Param('id') id: string,
    @Body() editVissionDto: EditVissionDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.editVission(id, editVissionDto, res);
  }

  //Api for edit ngo history, values_and_principles
  @UseGuards(AuthGuard)
  @Put('edit-history/:id')
  @ApiBearerAuth('access-token')
  async editHistory(
    @Param('id') id: string,
    @Body() editHistoryDto: EditHistoryDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.editHistory(id, editHistoryDto, res);
  }

  //Api for get form settings for update
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('edit-ngo/:id')
  async formData(
    @Param('id') id: string,
    @Query('status', ParamMissing) status: string,
    @Res() res: Response,
  ) {
    return await this.ngoService.formData(id, status, res);
  }

  //Api for get form settings for update
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/edit-form/:id')
  async ngoFormData(
    @Param('id') id: string,
    @Query('status', ParamMissing) status: string,
    @Res() res: Response,
  ) {
    return await this.ngoService.formData(id, status, res);
  }

  //Api for add team member in ngo
  @UseGuards(AuthGuard)
  @Post('add-team-member')
  @ApiBearerAuth('access-token')
  async addTeamMember(
    @Body() addTeamMemberDto: AddTeamMemberDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.addTeamMember(addTeamMemberDto, res);
  }

  //Api for update team member in ngo
  @UseGuards(AuthGuard)
  @Put('update-team-member/:id')
  @ApiBearerAuth('access-token')
  async updateTeamMember(
    @Param('id') id: string,
    @Body() updateTeamMemberDto: UpdateTeamMemberDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.updateTeamMember(id, updateTeamMemberDto, res);
  }

  //Api for delete team member in ngo
  @UseGuards(AuthGuard)
  @Delete('delete-team-member/:id')
  @ApiBearerAuth('access-token')
  async deleteTeamMember(@Param('id') id: string, @Res() res: Response) {
    return await this.ngoService.deleteTeamMember(id, res);
  }

  //Api for list team member of ngo
  @Get('team-member-list/:id')
  async teamMemberList(
    @Param('id') id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.ngoService.teamMemberList(id, query, res);
  }

  //Api for list team member of ngo
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('team-member-list/:id')
  async teamMembers(
    @Param('id') id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.ngoService.teamMemberList(id, query, res);
  }

  //Api for create post in ngo
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create-post')
  async createPost(@Body() createPostDto: CreatePostDto, @Res() res: Response) {
    return await this.ngoService.createPost(createPostDto, res);
  }

  // Api for post like unlike
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('post-like-dislike')
  async likeUnlike(
    @Body() likeDislikeDto: LikeDislikeDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.likeUnlike(likeDislikeDto, res);
  }

  //Api for ngo feed list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('feed-list/:id')
  async feedList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.ngoService.feedList(id, query, res);
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
    return await this.ngoService.likeList(id, query, res);
  }

  //Api for create comment in ngo post
  @UseGuards(AuthGuard)
  @Post('add-comment')
  @ApiBearerAuth('access-token')
  async addComment(@Body() commentDto: CommentDto, @Res() res: Response) {
    return await this.ngoService.addComment(commentDto, res);
  }

  //Api for update comment in ngo post
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

  //Api for delete comment in ngo post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete-comment/:id')
  async deleteComment(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.requestService.deleteComment(id, res);
  }

  // Api for comment list in ngo post
  @UseGuards(AuthGuard)
  @Get('comment-list/:id')
  @ApiBearerAuth('access-token')
  async commentList(
    @Param('id') id: string,
    @Query() query: string,
    @Res() res: Response,
  ) {
    return await this.requestService.commentList('ngo', id, query, res);
  }

  //Api for register NGO with dynamic form
  @Post('create')
  async create(@Body() createNgo: CreateNgo, @Res() res: Response) {
    return await this.ngoService.create(createNgo, res);
  }

  //Api for update NGO from app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateDto: UpdateDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.update(id, updateDto, res);
  }

  //Api for create NGO with dynamic form
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('admin/create')
  async createNGO(@Body() createNgo: AdminNgoCreateDto, @Res() res: Response) {
    return await this.ngoService.createNgo(createNgo, res);
  }

  //Api for update NGO from admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('admin/update/:id')
  async updateNGO(
    @Param('id', IdMissing) id: string,
    @Body() updateDto: AdminNgoUpdateDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.updateNGO(id, updateDto, res);
  }

  //Api for verify NGO by admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('verify-ngo/:id')
  async verifyNgo(
    @Param('id', IdMissing) id: string,
    @Body() verifyNgoDto: VerifyNgoDto,
    @Res() res: Response,
  ) {
    return await this.ngoService.verifyNgo(id, verifyNgoDto, res);
  }

  /**
   *Api for get ngo lists
   *
   */
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('home-ngo-list')
  async homeNgoList(@Body() body: object, @Res() res: Response) {
    return await this.ngoService.homeNgoList(body, res);
  }
}
