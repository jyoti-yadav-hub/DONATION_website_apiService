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
import { HomeCmsService } from './home-cms.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { CreateHomeCmDto } from './dto/create-home-cm.dto';
import { UpdateHomeCmDto } from './dto/update-home-cm.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('home-cms')
@ApiTags('Home Cms')
export class HomeCmsController {
  constructor(private readonly homeCmsService: HomeCmsService) {}

  //Api for create homepage cms pages
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(@Body() createHomeCmDto: CreateHomeCmDto, @Res() res: Response) {
    return await this.homeCmsService.create(createHomeCmDto, res);
  }

  //Api for list homepage cms pages for Admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  findAll(@Query() query, @Res() res: Response) {
    return this.homeCmsService.findAll(query, res);
  }

  //Api for update homepage cms pages
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  update(
    @Param('id', IdMissing) id: string,
    @Body() updateHomeCmDto: UpdateHomeCmDto,
    @Res() res: Response,
  ) {
    return this.homeCmsService.update(id, updateHomeCmDto, res);
  }

  //Api for delete homepage cms pages
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return this.homeCmsService.remove(id, res);
  }

  //Api for get homepage cms page in app
  @Get('get-cms')
  getCms(@Res() res: Response) {
    return this.homeCmsService.getCms(res);
  }

  //Api for get cms page from given slug
  @Get('get-page/:slug')
  async getPage(@Param('slug') slug: string, @Res() res: Response) {
    return await this.homeCmsService.getPage(slug, res);
  }
}
