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
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { CorporateTypesService } from './corporate-types.service';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CreateCorporateTypeDto } from './dto/create-corporate-type.dto';
import { UpdateCorporateTypeDto } from './dto/update-corporate-type.dto';

@Controller('corporate-types')
@ApiTags('corporate-types')
export class CorporateTypesController {
  constructor(private readonly corporateTypesService: CorporateTypesService) {}

  // Api for create Corporate Type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createCorporateTypeDto: CreateCorporateTypeDto,
    @Res() res: Response,
  ) {
    return await this.corporateTypesService.create(createCorporateTypeDto, res);
  }

  // Api for update Corporate Type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateCorporateTypeDto: UpdateCorporateTypeDto,
    @Res() res: Response,
  ) {
    return await this.corporateTypesService.update(
      id,
      updateCorporateTypeDto,
      res,
    );
  }

  // Api for list Corporate Type for Admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.corporateTypesService.findAll(query, res);
  }

  //Api for delete Corporate Type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.corporateTypesService.remove(id, res);
  }

  // Api for list Corporate Type for app
  @Get('list')
  async list(@Query() query, @Res() res: Response) {
    return await this.corporateTypesService.list(query, res);
  }

  // Api for get Corporate Type detail
  @Get('get-form-setting/:type')
  async getFormSetting(@Param('type') type: string, @Res() res: Response) {
    return await this.corporateTypesService.getFormSetting(type, res);
  }

  //Api for restore form
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('restore-form/:id')
  async restoreForm(@Param('id') id: string, @Res() res: Response) {
    return await this.corporateTypesService.restoreForm(id, res);
  }
}
