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
import { FundService } from './fund.service';
import { CreateFundDto } from './dto/create-fund.dto';
import { UpdateFundDto } from './dto/update-fund.dto';
import { UpdateFundCausesDto } from './dto/update-fund-causes.dto';
import { ManagePermissionDto } from './dto/manage-permission.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VerifyFundDto } from './dto/verify-fund.dto';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { PaymentProcessDto } from './dto/payment-process.dto';
import { ViewReceiptDto } from './dto/view-receipt.dto';
import { FundDonateDto } from './dto/fund-donate.dto';
import { GetUserByMailDto } from './dto/get-user.dto';
import { ExchangeRatesDto } from './dto/exchange-rates.dto';
import { OptionalAuthGuard } from 'src/auth/gaurds/optional-auth.guard';
import { NgoRequestsDto } from '../drive/dto/ngo-requests.dto';
@Controller('fund')
@ApiTags('Fund')
export class FundController {
  constructor(private readonly fundService: FundService) {}

  //Api for create Fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async fundCreate(@Body() createFundDto: CreateFundDto, @Res() res: Response) {
    return await this.fundService.fundCreate(createFundDto, res);
  }

  //Api for update Fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async fundUpdate(
    @Param('id', IdMissing) id: string,
    @Body() updateFundDto: UpdateFundDto,
    @Res() res: Response,
  ) {
    return await this.fundService.fundUpdate(id, updateFundDto, res);
  }

  //Api for reverify fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('fund-reverify/:id')
  async fundReverify(@Param('id') id: string, @Res() res: Response) {
    return await this.fundService.fundReverify(id, res);
  }

  // Api for get Fund details
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('edit/:id')
  async getFundDataById(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.fundService.getFundDataById(id, res);
  }

  //Api for create Fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('update-fund-causes')
  async updateFundCauses(
    @Body() updateFundCausesDto: UpdateFundCausesDto,
    @Res() res: Response,
  ) {
    return await this.fundService.updateFundCauses(updateFundCausesDto, res);
  }

  // Api for get Fund lists
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('list')
  async getFundList(@Body() body: object, @Res() res: Response) {
    return await this.fundService.getFundList(body, res);
  }

  // Api for get ngo Fund lists
  @Post('ngo-fund-list')
  async getNgoFundList(
    @Body() ngoRequestsDto: NgoRequestsDto,
    @Res() res: Response,
  ) {
    return await this.fundService.getNgoFundList(ngoRequestsDto, res);
  }

  // Api for get default Fund lists
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('default-fund-list')
  async getdefaultFundList(@Body() body: object, @Res() res: Response) {
    return await this.fundService.getDefaultFundList(body, res);
  }

  // Api for get Fund lists
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('my-funds')
  async getMyFund(@Query() query, @Res() res: Response) {
    return await this.fundService.getMyFundList(query, res);
  }

  // Api for get Fund lists in web with filter
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('my-funds-list')
  async getMyFundList(@Body() body, @Res() res: Response) {
    return await this.fundService.getMyFundList(body, res);
  }

  //Api for delete Fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async deleteFund(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.fundService.deleteFund(id, res);
  }

  //Api for report benificiary in request
  @UseGuards(AuthGuard)
  @Put('report-fund/:id')
  @ApiBearerAuth('access-token')
  async reportFund(
    @Param('id') id: string,
    @Body('description') description: string,
    @Res() res: Response,
  ) {
    return await this.fundService.reportFund(id, description, res);
  }

  // Api for get Fund details
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('detail/:id')
  async getFundData(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.fundService.getFundData('app', id, query, res);
  }

  // Api for get Fund details
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/fund-detail/:id')
  async getFundDetail(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.fundService.getFundData('admin', id, null, res);
  }

  //Api for create Fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('invite-admin/:id')
  async inviteAdmin(
    @Param('id', IdMissing) id: string,
    @Body() inviteAdminDto: InviteAdminDto,
    @Res() res: Response,
  ) {
    return await this.fundService.inviteAdmin(id, inviteAdminDto, res);
  }

  //Api for create Fund
  // @UseGuards(AuthGuard)
  // @ApiBearerAuth('access-token')
  @Get('admin-list/:id')
  async adminList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.fundService.adminList(id, 'app', query, res);
  }

  //Api for Fund admin list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('fund-admin-list/:id')
  async FundAdminList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.fundService.adminList(id, 'admin', query, res);
  }

  //Api for create Fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('remove-admin/:id')
  async removeAdmin(
    @Param('id', IdMissing) id: string,
    @Body('admin_id') admin_id: string,
    @Res() res: Response,
  ) {
    return await this.fundService.removeAdmin(id, admin_id, res);
  }

  //Api for leave Fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('leave/:id')
  async leaveFund(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.fundService.leaveFund(id, res);
  }

  //Api for create Fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('manage-permission/:id')
  async managePermission(
    @Param('id', IdMissing) id: string,
    @Body() managePermissionDto: ManagePermissionDto,
    @Res() res: Response,
  ) {
    return await this.fundService.managePermission(
      id,
      managePermissionDto,
      res,
    );
  }

  //Api for add entry in payment process table before donation
  @Post('payment-process')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async paymentProcess(
    @Body() paymentProcessDto: PaymentProcessDto,
    @Res() res: Response,
  ) {
    return await this.fundService.paymentProcess(paymentProcessDto, res);
  }

  //Api for verify fund in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('verify-fund/:id')
  async verifyFund(
    @Param('id', IdMissing) id: string,
    @Body() verifyFundDto: VerifyFundDto,
    @Res() res: Response,
  ) {
    return await this.fundService.verifyFund(id, verifyFundDto, res);
  }

  //Api for get fund list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/fund-list')
  async adminFundList(@Query() query, @Res() res: Response) {
    return await this.fundService.adminFundList(query, res);
  }

  //Api for Fund donors
  @Get('donors/:id')
  async getFundDonors(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.fundService.getFundDonors(id, query, res);
  }

  // API for download or view receipt
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('generate-receipt')
  async generateReceipt(
    @Body() viewReceiptDto: ViewReceiptDto,
    @Res() res: Response,
  ) {
    return await this.fundService.generateReceipt(viewReceiptDto, res);
  }

  //Api for Fund donated

  @Get('donated/:id')
  async getFundDonated(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.fundService.getFundDonated('fund', id, query, res);
  }

  //Api for Cancel fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('cancel-fund/:id')
  async cancelFund(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.fundService.cancelFund(id, res);
  }

  // Api for get Fund lists
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('user-funds')
  async getUserFunds(@Query() query, @Res() res: Response) {
    return await this.fundService.getUserFunds(query, res);
  }

  //Api for donate to request from fund
  @Post('donate')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async fundDonate(@Body() fundDonateDto: FundDonateDto, @Res() res: Response) {
    return await this.fundService.fundDonate(fundDonateDto, res);
  }

  // Api for get Fund dashboard
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('dashboard')
  async getFundDashboard(@Query() query, @Res() res: Response) {
    return await this.fundService.getFundDashboard(query, res);
  }

  //Api for get user by e-mail or phone
  @Post('get-user-by-email-phone')
  async userByMailPhone(
    @Body() getUserByMailDto: GetUserByMailDto,
    @Res() res: Response,
  ) {
    return await this.fundService.userByMailPhone(getUserByMailDto, res);
  }

  //Api for get currency exchange rates
  @Post('exchange-rates')
  async getExchangeRates(
    @Body() exchangeRatesDto: ExchangeRatesDto,
    @Res() res: Response,
  ) {
    return await this.fundService.getExchangeRates(exchangeRatesDto, res);
  }

  //Api add fund to default
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('admin/add-to-default')
  async addToDefault(
    @Body('fund_id') fund_id: string,
    @Body('type') type: string,
    @Res() res: Response,
  ) {
    return await this.fundService.addToDefault(fund_id, type, res);
  }

  // Api for fund transaction list
  @UseGuards(AuthGuard)
  @Get('fund-donation-list')
  @ApiBearerAuth('access-token')
  async fundDonationList(@Query() query, @Res() res: Response) {
    return await this.fundService.fundDonationList(query, res);
  }
}
