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
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HospitalSchoolService } from './hospital-school.service';
import { HospitalSchoolListDto } from './dto/hospital-school-list.dto';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { CreateSchoolDto } from './dto/create-school.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
@Controller('hospital-school')
@ApiTags('Hospital/School')
export class HospitalSchoolController {
  constructor(private readonly hospitalService: HospitalSchoolService) {}

  //Api for save draft
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('save-draft')
  async saveDraft(@Body() saveDraftDto: SaveDraftDto, @Res() res: Response) {
    return await this.hospitalService.create(saveDraftDto, res, 'draft');
  }

  //Api for create hospital
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create-hospital')
  async createHospital(
    @Body() createHospitalDto: CreateHospitalDto,
    @Res() res: Response,
  ) {
    return await this.hospitalService.create(createHospitalDto, res, 'main');
  }

  //Api for create school
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create-school')
  async createSchool(
    @Body() createSchoolDto: CreateSchoolDto,
    @Res() res: Response,
  ) {
    return await this.hospitalService.create(createSchoolDto, res, 'main');
  }

  //Api for list hospitals
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('hospital-list')
  async findHospitals(@Query() query, @Res() res: Response) {
    return await this.hospitalService.findAll('Hospital', query, res);
  }

  //Api for list schools
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('school-list')
  async findSchools(@Query() query, @Res() res: Response) {
    return await this.hospitalService.findAll('School', query, res);
  }

  //Api for update hospital
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update-hospital/:id')
  async updateHospital(
    @Param('id', IdMissing) id: string,
    @Body() updateHospitalDto: UpdateHospitalDto,
    @Res() res: Response,
  ) {
    return await this.hospitalService.update(id, updateHospitalDto, res);
  }

  //Api for update school
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update-school/:id')
  async updateSchool(
    @Param('id', IdMissing) id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
    @Res() res: Response,
  ) {
    return await this.hospitalService.update(id, updateSchoolDto, res);
  }

  //Api for delete hospital
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.hospitalService.remove(id, res);
  }

  //Api for list hospital and school in dynamic form
  @Get('list')
  async hospitalSchoolList(
    @Query() hospitalSchoolListDto: HospitalSchoolListDto,
    @Res() res: Response,
  ) {
    return await this.hospitalService.hospitalSchoolList(
      hospitalSchoolListDto,
      res,
    );
  }
}
