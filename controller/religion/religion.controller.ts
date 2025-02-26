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
import { ReligionService } from './religion.service';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateReligionDto } from './dto/create-religion.dto';
import { UpdateReligionDto } from './dto/update-religion.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('religion')
@ApiTags('Religion')
export class ReligionController {
  constructor(private readonly religionService: ReligionService) { }

  //Api for create religion
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createReligionDto: CreateReligionDto,
    @Res() res: Response,
  ) {
    return await this.religionService.create(createReligionDto, res);
  }

  //Api for list religion
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async find(@Query() query, @Res() res: Response) {
    return await this.religionService.findAll(query, res);
  }

  //Api for list religion in dropdown(App)
  @Get('list')
  async findList(@Query() query, @Res() res: Response) {
    return await this.religionService.findList(query, res);
  }

  //Api for update religion
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateReligionDto: UpdateReligionDto,
    @Res() res: Response,
  ) {
    return await this.religionService.update(id, updateReligionDto, res);
  }
  
  //Api for delete religion
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.religionService.delete(id, res);
  }
}
