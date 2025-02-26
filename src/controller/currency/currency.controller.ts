/* eslint-disable prettier/prettier */
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
import { CurrencyService } from './currency.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('currency')
@ApiTags('Currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  //Api for create Currency
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createCurrencyDto: CreateCurrencyDto,
    @Res() res: Response,
  ) {
    return await this.currencyService.create(createCurrencyDto, res);
  }

  //Api for currency list - Admin panel

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.currencyService.findAll(query, res);
  }

  // Api for update currency
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
    @Res() res: Response,
  ) {
    return await this.currencyService.update(id, updateCurrencyDto, res);
  }

  //Api for delete currency
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async delete(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.currencyService.delete(id, res);
  }

  //Api for currency list for app
  @Get('currency-list')
  async find(@Query() query, @Res() res: Response) {
    return await this.currencyService.find(query, res);
  }

  //Api for currency list for app
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('available')
  async available(@Res() res: Response) {
    return await this.currencyService.availableCurrency(res);
  }
}
