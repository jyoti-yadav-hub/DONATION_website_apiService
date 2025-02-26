/* eslint-disable prettier/prettier */
import {
  Get,
  Res,
  Put,
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
import { CategoryService } from './category.service';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { SaveDraftDto } from './dto/save-draft.dto';

@Controller('category')
@ApiTags('Category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  //Api for save draft
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('save-draft')
  async saveDraft(@Body() saveDraftDto: SaveDraftDto, @Res() res: Response) {
    return await this.categoryService.create(saveDraftDto, res, 'draft');
  }

  //Api for create category
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Res() res: Response,
  ) {
    return await this.categoryService.create(createCategoryDto, res, 'main');
  }

  //Api for list category for Admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'allData', required: false })
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.categoryService.findAll(query, res);
  }

  //Api for update category
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Res() res: Response,
  ) {
    return await this.categoryService.update(id, updateCategoryDto, res);
  }

  //Api for delete category
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.categoryService.remove(id, res);
  }

  //Api for list category for app
  @Get('category-list')
  async categoryList(@Query() query, @Res() res: Response) {
    return await this.categoryService.categoryList(query, res);
  }

  //Api for get category detail
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('detail/:id')
  async categoryDetail(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.categoryService.categoryDetail(id, res);
  }

  //Api for list category request count for Admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('category-request-count')
  async category_list(@Query() query, @Res() res: Response) {
    return await this.categoryService.categoryRequestCount(query, res);
  }

  //Api for enable/disable category
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('set-category/:id')
  async setCategory(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.categoryService.setCategory(id, res);
  }

  //Api for restore form
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('restore-form/:id')
  async restoreForm(@Param('id') id: string, @Res() res: Response) {
    return await this.categoryService.restoreForm(id, res);
  }

  // Api for get template
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('get-template/:id')
  async getFormSetting(@Param('id') id: string, @Res() res: Response) {
    return await this.categoryService.getTemplate(id, res);
  }

  // Api for get template list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('template-list')
  async getTemplateList(@Query() query, @Res() res: Response) {
    return await this.categoryService.getTemplateList(query, res);
  }
}
