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
import { IdMissing } from 'src/auth/id-missing.pipe';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { BankTypeService } from './bank-type.service';
import { CreateBankTypeDto } from './dto/create-bank-type.dto';
import { UpdateBankTypeDto } from './dto/update-bank-type.dto';

@Controller('bank-Type')
@ApiTags('Bank Type')
export class BankTypeController {
  constructor(private readonly bankTypeService: BankTypeService) {}

  //Api for add/create bank Type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createBankTypeDto: CreateBankTypeDto,
    @Res() res: Response,
  ) {
    return await this.bankTypeService.create(createBankTypeDto, res);
  }

  //Api for bank Type list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async bankTypeList(@Query() query, @Res() res: Response) {
    return await this.bankTypeService.bankTypeList(query, res);
  }

  //Api for update bank Type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateBankTypeDto: UpdateBankTypeDto,
    @Res() res: Response,
  ) {
    return await this.bankTypeService.update(id, updateBankTypeDto, res);
  }

  //Api for delete bank Type

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('delete/:id')
  async delete(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.bankTypeService.delete(id, res);
  }

  // Api for list language in dropdown(App)
  @Get('list/:country')
  async findList(@Param('country') country: string, @Res() res: Response) {
    return await this.bankTypeService.findList(country, res);
  }
}
