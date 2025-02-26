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
import { JobTitleService } from './job-title.service';
import { CreateJobTitleDto } from './dto/create-job-title.dto';
import { UpdateJobTitleDto } from './dto/update-job-title.dto';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('job-title')
@ApiTags('job-title')
export class JobTitleController {
  constructor(private readonly jobTitleService: JobTitleService) {}

  //Api for create job title
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createJobTitleDto: CreateJobTitleDto,
    @Res() res: Response,
  ) {
    return await this.jobTitleService.create(createJobTitleDto, res);
  }

  //Api for list job title
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async find(@Query() query, @Res() res: Response) {
    return await this.jobTitleService.findAll(query, res);
  }

  //Api for list job title in dropdown(App)
  @Get('list')
  async findList(@Query() query, @Res() res: Response) {
    return await this.jobTitleService.findList(query, res);
  }

  //Api for update job title
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateJobTitleDto: UpdateJobTitleDto,
    @Res() res: Response,
  ) {
    return await this.jobTitleService.update(id, updateJobTitleDto, res);
  }

  //Api for delete job title
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.jobTitleService.delete(id, res);
  }
}
