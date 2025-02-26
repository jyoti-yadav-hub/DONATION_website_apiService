import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  Query,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { DriveTypeService } from './drive-type.service';
import { CreateDriveTypeDto } from './dto/create-drive-type.dto';
import { UpdateDriveTypeDto } from './dto/update-drive-type.dto';
import { Response } from 'express';


@ApiTags('drive-type')
@Controller('drive-type')
export class DriveTypeController {
  constructor(private readonly driveTypeService: DriveTypeService) {}

  //Api for create drive type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createDriveTypeDto: CreateDriveTypeDto,
    @Res() res: Response,
  ) {
    return await this.driveTypeService.create(createDriveTypeDto, res);
  }

  //Api for get drive type for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.driveTypeService.findAll(query, res);
  }

  //Api for drive type listing
  @Get('list')
  async list(@Query() query, @Res() res: Response) {
    return await this.driveTypeService.list(query, res);
  }

  //Api for update drive type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateDriveTypeDto: UpdateDriveTypeDto,
    @Res() res: Response,
  ) {
    return await this.driveTypeService.update(id, updateDriveTypeDto, res);
  }

  //Api for delete drive type
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    return await this.driveTypeService.remove(id, res);
  }
}
