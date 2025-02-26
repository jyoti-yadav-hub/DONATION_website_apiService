import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Res,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  //Api for create report
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(@Body() createReportDto: CreateReportDto, @Res() res: Response) {
    return await this.reportService.create(createReportDto, res);
  }

  //Api for list reports
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.reportService.findAll(query, res);
  }

  //Api for update report
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Res() res: Response,
  ) {
    return await this.reportService.update(id, updateReportDto, res);
  }

  //Api for delete report
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.reportService.remove(id, res);
  }

  //Api for get form data to display in app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('get-form')
  async getReportForm(@Query('type') type: string, @Res() res: Response) {
    return await this.reportService.getReportForm(type, res);
  }
}
