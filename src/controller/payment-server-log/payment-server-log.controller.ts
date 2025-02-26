/* eslint-disable prettier/prettier */
import { Post, Res, Body, Controller } from '@nestjs/common';
import { Response } from 'express';
import { PaymentServerLogService } from './payment-server-log.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('payment-server-log')
@ApiTags('Payment Server Log')
export class PaymentServerLogController {
  constructor(
    private readonly paymentServerLogService: PaymentServerLogService,
  ) {}

  //Api for create payment server logs
  @Post('create')
  async create(@Body() body: any, @Res() res: Response) {
    return await this.paymentServerLogService.create(body, res);
  }
}
