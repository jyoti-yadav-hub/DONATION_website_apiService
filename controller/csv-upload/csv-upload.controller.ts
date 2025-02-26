/* eslint-disable prettier/prettier */
import {
  Get,
  Put,
  Res,
  Post,
  Body,
  Query,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  Controller,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { CsvUploadService } from './csv-upload.service';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('csv-upload')
@ApiTags('CSV-Upload')
export class CsvUploadController {
  constructor(private readonly csvUploadService: CsvUploadService) {}

  //Api for upload csv
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body('type') type: string,
    @UploadedFile() file,
    @Res() res: Response,
  ) {
    return await this.csvUploadService.uploadCsv(type, file, res);
  }

  //Api for delete csv file
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.csvUploadService.removeCsvFile(id, res);
  }

  //Api for csv files list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.csvUploadService.findAll(query, res);
  }

  //Api for import csv
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('import')
  async import(@Res() res: Response) {
    return await this.csvUploadService.importCsv(res);
  }

  //Api for list csv files
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('failed-rows/:id')
  async failedRows(@Param('id', IdMissing) id: string,@Query() query, @Res() res: Response) {
    return await this.csvUploadService.failedRows(id,query, res);
  }
}
