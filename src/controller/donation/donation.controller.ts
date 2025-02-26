import { Response } from 'express';
import { ReceiptDto } from './dto/receipt-data.dto';
import { DonationService } from './donation.service';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { PaymentProcessDto } from './dto/payment-process.dto';
import { OptionalAuthGuard } from 'src/auth/gaurds/optional-auth.guard';
import { GuestPaymentProcessDto } from './dto/guest-payment-process.dto';
import { TransferFinalAmountDto } from './dto/transfer-final-amount.dto';
import { FeaturePaymentProcessDto } from './dto/feature-payment-process.dto';
import { CreateTransactionDetail } from './dto/create-transaction-detail.dto';
import { ResetTransactionProcessDto } from './dto/reset-transaction-process.dto';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  Query,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('donation')
@ApiTags('Donation')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  //Api for send receipt in email
  @Post('email-sendReceipt')
  async sendReceipt(@Body() receiptDto: ReceiptDto, @Res() res: Response) {
    return await this.donationService.sendReceipt(receiptDto, res);
  }

  //Api for download receipt in app
  @Post('download-receipt')
  async downloadReceipt(@Body() receiptDto: ReceiptDto, @Res() res: Response) {
    return await this.donationService.sendReceipt(receiptDto, res);
  }

  // API for create session for adyen payment
  @Post('create-session')
  async createSession(
    @Body() paymentSessionDto: PaymentSessionDto,
    @Res() res: Response,
  ) {
    return await this.donationService.createSession(paymentSessionDto, res);
  }

  //Api for add entry in payment process table before donation
  @Post('payment-process')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async paymentProcess(
    @Body() paymentProcessDto: PaymentProcessDto,
    @Res() res: Response,
  ) {
    return await this.donationService.paymentProcess(paymentProcessDto, res);
  }

  //Api for add entry in payment process table before donation for guest user
  @Post('guest-payment-process')
  async guestPaymentProcess(
    @Body() guestPaymentProcessDto: GuestPaymentProcessDto,
    @Res() res: Response,
  ) {
    return await this.donationService.guestPaymentProcess(
      guestPaymentProcessDto,
      res,
    );
  }

  //Api for payment for feature request
  @Post('feature-payment-process')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async featurePaymentProcess(
    @Body() featurePaymentProcessDto: FeaturePaymentProcessDto,
    @Res() res: Response,
  ) {
    return await this.donationService.featurePaymentProcess(
      featurePaymentProcessDto,
      res,
    );
  }

  //Api for create transaction detail
  @Post('create-transaction-detail')
  async createTransactionDetail(
    @Body() createTransactionDetail: CreateTransactionDetail,
    @Res() res: Response,
  ) {
    return await this.donationService.createTransactionDetail(
      createTransactionDetail,
      res,
    );
  }

  // API for handle adyen webhook notification
  @Post('handle-adyen-webhook')
  async handleAdyenWebhook(@Res() res: Response) {
    return await this.donationService.handleAdyenWebhook(res);
  }

  // API for handle stripe webhook notification
  @Post('handle-stripe-webhook')
  async handleStripeWebhook(@Res() res: Response) {
    return await this.donationService.handleStripeWebhook(res);
  }

  // API for get transaction detail
  @Post('transaction-detail')
  async transactionDetail(
    @Body('reference_id') reference_id: string,
    @Res() res: Response,
  ) {
    return await this.donationService.transactionDetail(reference_id, res);
  }

  // API for rest transaction process
  @Post('reset-transaction-process')
  async resetTransactionProcess(
    @Body() resetTransactionProcessDto: ResetTransactionProcessDto,
    @Res() res: Response,
  ) {
    return await this.donationService.resetTransactionProcess(
      resetTransactionProcessDto,
      res,
    );
  }

  // API for get generate donation receipt pdf detail
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('generate-receipt')
  async generateReceipt(@Body() request_id: string, @Res() res: Response) {
    return await this.donationService.generateDonationReceipt(request_id, res);
  }

  // API for get generate single receipt pdf detail (currently not in use)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('generate-single-receipt')
  async generateSingleReceipt(
    @Body() receiptDto: ReceiptDto,
    @Res() res: Response,
  ) {
    return await this.donationService.generateSingleReceipt(receiptDto, res);
  }

  // API for get transaction detail from payment process table
  @Post('get-transaction-detail')
  async getTransactionDetail(
    @Body('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.donationService.getTransactionDetail(id, res);
  }

  // API for delete transaction detail from payment process table
  @Delete('delete-transaction-detail')
  async deleteTransactionDetail(
    @Body('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.donationService.deleteTransactionDetail(id, res);
  }

  //Api for payment for feature request
  @Post('transfer-request-amount')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  async transferFinalAmount(
    @Body() transferFinalAmountDto: TransferFinalAmountDto,
    @Res() res: Response,
  ) {
    return await this.donationService.transferFinalAmount(
      transferFinalAmountDto,
      res,
    );
  }

  //Api for admin transaction receipt
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('admin-receipt/:id')
  async adminRecepit(@Param('id') id: string, @Res() res: Response) {
    return await this.donationService.adminRecepit(id, res);
  }

  //Api for admin transaction list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin-transaction-list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.donationService.adminTransactionList(query, res);
  }

  //Api for admin transaction by id
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin-transaction/:id')
  async findById(@Param('id') id: string, @Res() res: Response) {
    return await this.donationService.adminTransactionById(id, res);
  }

  // API for handle aauti webhook notification
  @Post('handle-aauti-webhook')
  async handleAautiWebhook(@Res() res: Response) {
    return await this.donationService.handleAautiWebhook(res);
  }
}
