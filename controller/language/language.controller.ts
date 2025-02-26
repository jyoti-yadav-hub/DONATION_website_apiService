import {
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Controller,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { LanguageService } from './language.service';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('language')
@ApiTags('Language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  //Api for create language
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createLanguageDto: CreateLanguageDto,
    @Res() res: Response,
  ) {
    return await this.languageService.create(createLanguageDto, res);
  }

  //Api for list language
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async find(@Query() query, @Res() res: Response) {
    return await this.languageService.findAll(query, res);
  }

  //Api for list language in dropdown(App)
  @Get('list')
  async findList(@Query() query, @Res() res: Response) {
    return await this.languageService.findList(query, res);
  }

  //Api for update language
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateLanguageDto: UpdateLanguageDto,
    @Res() res: Response,
  ) {
    return await this.languageService.update(id, updateLanguageDto, res);
  }

  //Api for delete language
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.languageService.delete(id, res);
  }

}
