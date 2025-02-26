/* eslint-disable prettier/prettier */
import {
  Get,
  Res,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Controller,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { UserBugReportService } from './user-bug-report.service';
import { CreateUserBugReportDto } from './dto/create-user-bug-report.dto';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user-bug-report')
@ApiTags('user-bug-report')
export class UserBugReportController {
  constructor(private readonly userBugReportService: UserBugReportService) {}

  //Api for create bug report
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file,
    @Body() createUserBugReportDto: CreateUserBugReportDto,
    @Res() res: Response,
  ) {
    return await this.userBugReportService.create(
      file,
      createUserBugReportDto,
      res,
    );
  }

  //Bug Report list Api for Admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'allData', required: false })
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.userBugReportService.findAll(query, res);
  }

  //Api for update bug status
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update-status/:id')
  async changeStatus(
    @Param('id', IdMissing) id: string,
    @Body('status') status: string,
    @Res() res: Response,
  ) {
    return await this.userBugReportService.changeStatus(id, status, res);
  }
}
