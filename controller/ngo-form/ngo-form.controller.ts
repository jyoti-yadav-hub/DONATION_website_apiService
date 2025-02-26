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
import { ParamMissing } from 'src/auth/param-missing.pipe';
import { NgoFormService } from './ngo-form.service';
import { CreateNgoFormDto } from './dto/create-ngo-form.dto';
import { UpdateNgoFormDto } from './dto/update-ngo-form.dto';

@ApiTags('Ngo Form')
@Controller('ngo-form')
export class NgoFormController {
  constructor(private readonly ngoFormService: NgoFormService) {}

  //Api for create ngo form
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async ngoFormCreate(
    @Body() createNgoFormDto: CreateNgoFormDto,
    @Res() res: Response,
  ) {
    return await this.ngoFormService.create(createNgoFormDto, res);
  }

  //Api for ngo form list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async ngoFormList(@Query() query, @Res() res: Response) {
    return await this.ngoFormService.list(query, res);
  }

  @Get('get-form')
  async getForm(
    @Query('country_code', ParamMissing) country_code: string,
    @Res() res: Response,
  ) {
    return await this.ngoFormService.getNGOForm('app', country_code, res);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin/get-form')
  async getNgoForm(
    @Query('id', ParamMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.ngoFormService.getNGOForm('admin', id, res);
  }

  //Api for update ngo form
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async updateNgoForm(
    @Param('id', IdMissing) id: string,
    @Body() updateNgoFormDto: UpdateNgoFormDto,
    @Res() res: Response,
  ) {
    return await this.ngoFormService.update(id, updateNgoFormDto, res);
  }

  //Api for delete ngo form
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('delete/:id')
  async deleteNgoForm(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.ngoFormService.delete(id, res);
  }

  //Api for restore form
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('restore-form/:id')
  async restoreForm(@Param('id') id: string, @Res() res: Response) {
    return await this.ngoFormService.restoreForm(id, res);
  }

  // Api for get template
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('get-template/:id')
  async getFormSetting(@Param('id') id: string, @Res() res: Response) {
    return await this.ngoFormService.getTemplate(id, res);
  }

  // Api for get template list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('template-list')
  async getTemplateList(@Query() query, @Res() res: Response) {
    return await this.ngoFormService.getTemplateList(query, res);
  }
}
