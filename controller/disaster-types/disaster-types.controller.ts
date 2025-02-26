import {
  Controller,
  Get,
  Res,
  Put,
  Post,
  Body,
  Patch,
  Query,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { DisasterTypesService } from './disaster-types.service';
import { CreateDisasterTypeDto } from './dto/create-disaster-type.dto';
import { UpdateDisasterTypeDto } from './dto/update-disaster-type.dto';

@ApiTags('disaster-types')
@Controller('disaster-types')
export class DisasterTypesController {
  constructor(private readonly disasterTypesService: DisasterTypesService) {}

  //API for create disaster relief type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createDisasterTypeDto: CreateDisasterTypeDto,
    @Res() res: Response,
  ) {
    return await this.disasterTypesService.create(createDisasterTypeDto, res);
  }

  //API for list disaster relief type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.disasterTypesService.findAll(query, res);
  }

  //API for update disaster relief type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateDisasterTypeDto: UpdateDisasterTypeDto,
    @Res() res: Response,
  ) {
    return await this.disasterTypesService.update(
      id,
      updateDisasterTypeDto,
      res,
    );
  }

   //API for delete disaster relief type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    return await this.disasterTypesService.remove(id, res);
  }

  //API for list disaster relief type
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async list(@Query() query, @Res() res: Response) {
    return await this.disasterTypesService.list(query, res);
  }
}
