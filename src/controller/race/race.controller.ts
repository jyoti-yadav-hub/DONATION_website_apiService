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
import { RaceService } from './race.service';
import { CreateRaceDto } from './dto/create-race.dto';
import { UpdateRaceDto } from './dto/update-race.dto';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('race')
@ApiTags('Race')
export class RaceController {
  constructor(private readonly raceService: RaceService) { }

  //Api for create race
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(@Body() createRaceDto: CreateRaceDto, @Res() res: Response) {
    return await this.raceService.create(createRaceDto, res);
  }

  //Api for list race
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async find(@Query() query, @Res() res: Response) {
    return await this.raceService.findAll(query, res);
  }

  //Api for list race in dropdown(App)
  @Get('list')
  async findList(@Query() query, @Res() res: Response) {
    return await this.raceService.findList(query, res);
  }

  //Api for update race
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateRaceDto: UpdateRaceDto,
    @Res() res: Response,
  ) {
    return await this.raceService.update(id, updateRaceDto, res);
  }

  //Api for delete race
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.raceService.delete(id, res);
  }
}
