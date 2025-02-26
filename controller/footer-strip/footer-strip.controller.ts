/* eslint-disable prettier/prettier */
import {
  Get,
  Put,
  Res,
  Post,
  Body,
  Query,
  Param,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { FooterStripService } from './footer-strip.service';
import { CreateFooterStripDto } from './dto/create-footer-strip.dto';
import { UpdateFooterStripDto } from './dto/update-footer-strip.dto';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('footer-strip')
@ApiTags('Footer-Strip')
export class FooterStripController {
  constructor(private readonly footerStripService: FooterStripService) {}

  // Api for footer strip
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createFooterStripDto: CreateFooterStripDto,
    @Res() res: Response,
  ) {
    return await this.footerStripService.createFooterStrip(
      createFooterStripDto,
      res,
    );
  }

  // Api for update footer strip
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateFooterStripDto: UpdateFooterStripDto,
    @Res() res: Response,
  ) {
    return await this.footerStripService.updateFooterStrip(
      id,
      updateFooterStripDto,
      res,
    );
  }

  //Api for delete footer strip
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.footerStripService.removeFooterStrip(id, res);
  }

  // Api for footer strip list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.footerStripService.findAll(query, res);
  }

  // Api for get footer strip in app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('find-one/:slug')
  async findOne(@Param('slug') slug: string, @Res() res: Response) {
    return await this.footerStripService.findOne(slug, res);
  }
}
