import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { PaymentGatewayService } from './payment-gateway.service';
import { CreatePaymentGatewayDto } from './dto/create-payment-gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment-gateway.dto';

@ApiTags('Payment-Gateway')
@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  //Api for create payment gateway by country
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('create')
  async create(
    @Body() createPaymentGatewayDto: CreatePaymentGatewayDto,
    @Res() res: Response,
  ) {
    return await this.paymentGatewayService.create(
      createPaymentGatewayDto,
      res,
    );
  }

  //Api for payment gateway list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.paymentGatewayService.findAll(query, res);
  }

  // Api for update payment gateway
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updatePaymentGatewayDto: UpdatePaymentGatewayDto,
    @Res() res: Response,
  ) {
    return await this.paymentGatewayService.update(
      id,
      updatePaymentGatewayDto,
      res,
    );
  }

  //Api for delete payment-gateway
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('delete/:id')
  async delete(@Param('id') id: string, @Res() res: Response) {
    return await this.paymentGatewayService.delete(id, res);
  }
}
