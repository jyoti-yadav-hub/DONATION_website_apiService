/* eslint-disable prettier/prettier */
import {
  Put,
  Res,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Controller,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { SettingService } from './setting.service';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { CreateSettingDto } from './dto/create-setting.dto';
import { CommonSettingDto } from './dto/common-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { GetCommonSettingDto } from './dto/get-common-setting.dto';
@Controller('setting')
@ApiTags('Setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  //Api for create setting
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('create')
  async create(
    @Body() createSettingDto: CreateSettingDto,
    @Res() res: Response,
  ) {
    return await this.settingService.create(createSettingDto, res);
  }

  //Api for setting list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.settingService.findAll(query, res);
  }

  //Api for update setting
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Res() res: Response,
  ) {
    return await this.settingService.update(id, updateSettingDto, res);
  }

  //Api for delete setting
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.settingService.remove(id, res);
  }

  // Api for find setting using slug
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('find-setting/:slug')
  async findSetting(@Param('slug') slug: string, @Res() res: Response) {
    return await this.settingService.findSetting(slug, res);
  }

  //Api for create setting
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('create-common-setting')
  async createCommonSettings(
    @Body() commonSettingDto: CommonSettingDto,
    @Res() res: Response,
  ) {
    return await this.settingService.createCommonSettings(
      commonSettingDto,
      res,
    );
  }

  //Api for delete common settings
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('delete-common-setting/:id')
  async deleteCommonSetting(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.settingService.deleteCommonSetting(id, res);
  }

  //Api for common settings list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('common-setting-list')
  async commonSettingList(@Query() query, @Res() res: Response) {
    return await this.settingService.commonSettingList(query, res);
  }

  // Api for find common setting using slug
  @Get('get-country-setting')
  async getCountrySetting(
    @Query() getCommonSettingDto: GetCommonSettingDto,
    @Res() res: Response,
  ) {
    return await this.settingService.getCountrySetting(
      getCommonSettingDto,
      res,
    );
  }

  //Api for setting group
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('group-list')
  async settingGroup(@Res() res: Response) {
    return await this.settingService.settingGroup(res);
  }

  //Api for common settings list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('group-data/:group_name')
  async groupData(
    @Param('group_name') group_name: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.settingService.groupData(group_name, query, res);
  }

  // Api for enable/disable common settings
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('common-setting-status/:id')
  async setCategory(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.settingService.changeSettingStatus(id, res);
  }

  //Api for restore common settings form
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('restore-form/:id')
  async restoreForm(@Param('id') id: string, @Res() res: Response) {
    return await this.settingService.restoreForm(id, res);
  }
}
