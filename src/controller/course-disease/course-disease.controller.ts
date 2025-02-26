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
import { CourseDiseaseService } from './course-disease.service';
import { CreateCourseDiseaseDto } from './dto/create-course-disease.dto';
import { UpdateCourseDiseaseDto } from './dto/update-course-disease.dto';

@ApiTags('Course-Disease')
@Controller('course-disease')
export class CourseDiseaseController {
  constructor(private readonly courseDiseasesService: CourseDiseaseService) { }

  //Api for create courses/diseases
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createCourseDiseaseDto: CreateCourseDiseaseDto,
    @Res() res: Response,
  ) {
    return await this.courseDiseasesService.create(createCourseDiseaseDto, res);
  }

  //Api for list courses in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('course-list')
  async findCourse(@Query() query, @Res() res: Response) {
    return await this.courseDiseasesService.findAll('Course', query, res);
  }

  //Api for list diseases in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('disease-list')
  async findDisease(@Query() query, @Res() res: Response) {
    return await this.courseDiseasesService.findAll('Disease', query, res);
  }

  //Api for update courses/diseases
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateCourseDiseaseDto: UpdateCourseDiseaseDto,
    @Res() res: Response,
  ) {
    return await this.courseDiseasesService.update(
      id,
      updateCourseDiseaseDto,
      res,
    );
  }

  //Api for delete courses/diseases
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.courseDiseasesService.remove(id, res);
  }

  //Api for list diseases in dynamic form
  @Get('list')
  async courseDiseaseList(
    @Query('category') category: string,
    @Query('saayam_supported_school') saayam_supported_school: string,
    @Res() res: Response,
  ) {
    if (category === 'health') {
      return await this.courseDiseasesService.courseDiseaseList(category, res);
    } else {
      return await this.courseDiseasesService.findSchoolCourses(
        saayam_supported_school,
        res,
      );
    }
  }

  //Api for list hospital and school in admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin-list')
  async courseDiseaseAdminList(
    @Query('category') category: string,
    @Res() res: Response,
  ) {
    return await this.courseDiseasesService.courseDiseaseList(category, res);
  }
}
