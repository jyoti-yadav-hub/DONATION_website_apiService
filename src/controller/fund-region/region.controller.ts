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
import { RegionService } from './region.service';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('region')
@ApiTags('Region')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  //Api for create region
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(@Body() createRegionDto: CreateRegionDto, @Res() res: Response) {
    return await this.regionService.create(createRegionDto, res);
  }

  //Api for list region
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async find(@Query() query, @Res() res: Response) {
    return await this.regionService.findAll(query, res);
  }

  //Api for list region in dropdown(App)
  @Get('list')
  async findList(@Query() query, @Res() res: Response) {
    return await this.regionService.findList(query, res);
  }

  //Api for update region
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateRegionDto: UpdateRegionDto,
    @Res() res: Response,
  ) {
    return await this.regionService.update(id, updateRegionDto, res);
  }

  //Api for delete region
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.regionService.delete(id, res);
  }

  //Api for list countries by region
  @Post('countries')
  async findCountries(@Body() body, @Res() res: Response) {
    return await this.regionService.findCountries(body, res);
  }
}
