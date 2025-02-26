import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { HospitalSchoolDataService } from './hospital-school-data.service';
@Controller('hospital-school-data')
@ApiTags('Hospital/School-data')
export class HospitalSchoolDataController {
  constructor(
    private readonly hospitalDataService: HospitalSchoolDataService,
  ) {}
  

  //Api for list schools
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findSchools(@Query() query, @Res() res: Response) {
    return await this.hospitalDataService.findAll(query, res);
  }

  //Api for delete hospital
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.hospitalDataService.remove(id, res);
  }
}
