/* eslint-disable prettier/prettier */
'use strict';
import {
  Get,
  Put,
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
import { BankService } from './bank.service';
import { LinkBankDto } from './dto/link-bank.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { VerifyBankDto } from './dto/verify-bank.dto';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ParamMissing } from 'src/auth/param-missing.pipe';
import { CreateManageBankDto } from './dto/create-manageBank.dto';
import { UpdateManageBankDto } from './dto/update-manageBank.dto';
@ApiTags('Bank')
@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  //Api for add/create bank from app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async saveBankDetail(
    @Body() createBankDto: CreateBankDto,
    @Res() res: Response,
  ) {
    return await this.bankService.saveBankDetail(createBankDto, res);
  }

  //Api for update bank from app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async updateBank(
    @Param('id', IdMissing) id: string,
    @Body() updateBankDto: UpdateBankDto,
    @Res() res: Response,
  ) {
    return await this.bankService.updateBank(id, updateBankDto, res);
  }

  //Api for list user bank in app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async bankList(@Query() query, @Res() res: Response) {
    return await this.bankService.bankList(query, res);
  }

  //Api for list user bank in request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('request-bank-list')
  async bankLists(@Query('filter', ParamMissing) filter, @Res() res: Response) {
    return await this.bankService.requestBanklists(filter, res);
  }

  //Api for list bank in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async adminBankList(@Query() query, @Res() res: Response) {
    return await this.bankService.adminBankList(query, res);
  }

  //Api for delete bank from ngo
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async deleteBank(
    @Param('id', IdMissing) id: string,
    @Query('type') type: string,
    @Res() res: Response,
  ) {
    return await this.bankService.deleteBank(id, type, res);
  }

  //Api for find bank added in request
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/ngo-bank-detail/:id')
  async ngoBankDetail(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.bankService.ngoBankDetail(id, res);
  }

  //Api for get bank form in app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('get-form')
  async getBankForm(
    @Query('country_code', ParamMissing) country_code: string,
    @Res() res: Response,
  ) {
    return await this.bankService.getBankForm(country_code, res);
  }

  //Api for create bank country wise form from admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('form-create')
  async bankFormCreate(
    @Body() createManageBankDto: CreateManageBankDto,
    @Res() res: Response,
  ) {
    return await this.bankService.bankFormCreate(createManageBankDto, res);
  }

  //Api for bank form list in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('form-list')
  async bankFormList(@Query() query, @Res() res: Response) {
    return await this.bankService.bankFormList(query, res);
  }

  //Api for update bank form from admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('form-update/:id')
  async updateBankForm(
    @Param('id', IdMissing) id: string,
    @Body() updateManageBankDto: UpdateManageBankDto,
    @Res() res: Response,
  ) {
    return await this.bankService.updateBankForm(id, updateManageBankDto, res);
  }

  //Api for verify bank from admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('verify-bank/:id')
  async verifyBank(
    @Param('id') id: string,
    @Body() verifyBankDto: VerifyBankDto,
    @Res() res: Response,
  ) {
    return await this.bankService.verifyBank(id, verifyBankDto, res);
  }

  //Api for delete bank form from admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('form-delete/:id')
  async deleteBankForm(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.bankService.deleteBankForm(id, res);
  }

  //Api for link bank account in request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('link-bank-details')
  async linkBankDetails(
    @Body() linkBankDto: LinkBankDto,
    @Res() res: Response,
  ) {
    return await this.bankService.linkBankDetails(linkBankDto, res);
  }

  //Api for send notification to trustees if bank not link in request
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('bank-link-notification')
  async bankLinkNotification(
    @Body('request_id', IdMissing) request_id: string,
    @Res() res: Response,
  ) {
    return await this.bankService.bankLinkNotification(request_id, res);
  }

  //Api for send notification to trustees if bank not link in ngo
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('ngo-bank-link-notification')
  async NgoBankLinkNotification(
    @Body('ngo_id') ngo_id: string,
    @Res() res: Response,
  ) {
    return await this.bankService.NgoBankLinkNotification(ngo_id, res);
  }

  //Api for restore form in admin panel
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('restore-form/:id')
  async restoreForm(@Param('id') id: string, @Res() res: Response) {
    return await this.bankService.restoreForm(id, res);
  }

  // Api for get template
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('get-template/:id')
  async getFormSetting(@Param('id') id: string, @Res() res: Response) {
    return await this.bankService.getTemplate(id, res);
  }

  // Api for get template list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('template-list')
  async getTemplateList(@Query() query, @Res() res: Response) {
    return await this.bankService.getTemplateList(query, res);
  }
}
