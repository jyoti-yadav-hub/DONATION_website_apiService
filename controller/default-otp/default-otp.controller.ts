import {
  Get,
  Res,
  Put,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { DefaultOtpService } from './default-otp.service';
import { CreateDefaultOtpDto } from './dto/create-default-otp.dto';
import { UpdateDefaultOtpDto } from './dto/update-default-otp.dto';

@Controller('default-otp')
@ApiTags('Default-otp')
export class DefaultOtpController {
  constructor(private readonly defaultOtpService: DefaultOtpService) {}

  //Api for create default otp
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('create')
  async create(
    @Body() createDefaultOtpDto: CreateDefaultOtpDto,
    @Res() res: Response,
  ) {
    return await this.defaultOtpService.create(createDefaultOtpDto, res);
  }

  //Api for default otp list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.defaultOtpService.findAll(query, res);
  }

  // Api for update default otp
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateDefaultOtpDto: UpdateDefaultOtpDto,
    @Res() res: Response,
  ) {
    return await this.defaultOtpService.update(id, updateDefaultOtpDto, res);
  }

  //Api for delete default otp
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('delete/:id')
  async delete(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.defaultOtpService.delete(id, res);
  }
}
