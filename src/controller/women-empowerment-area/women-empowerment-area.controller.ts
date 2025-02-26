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
import { Response } from 'express';
import { WomenEmpowermentAreaService } from './women-empowerment-area.service';
import { CreateWomenEmpowermentAreaDto } from './dto/create-women-empowerment-area.dto';
import { UpdateWomenEmpowermentAreaDto } from './dto/update-women-empowerment-area.dto';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';

@Controller('women-empowerment-area')
@ApiTags('Women Empowerment Area')
export class WomenEmpowermentAreaController {
  constructor(
    private readonly womenEmpowermentAreaService: WomenEmpowermentAreaService,
  ) {}
  /*
   *Api for create women empowerment type
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('create')
  create(
    @Body() createWomenEmpowermentAreaDto: CreateWomenEmpowermentAreaDto,
    @Res() res: Response,
  ) {
    return this.womenEmpowermentAreaService.create(
      createWomenEmpowermentAreaDto,
      res,
    );
  }

  /*
   *Api for listing women empowerment type
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('list')
  findAll(@Query() query, @Res() res: Response) {
    return this.womenEmpowermentAreaService.findAll(query, res);
  }

  /*
   *Api for update women empowerment type
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateWomenEmpowermentAreaDto: UpdateWomenEmpowermentAreaDto,
    @Res() res: Response,
  ) {
    return this.womenEmpowermentAreaService.update(
      id,
      updateWomenEmpowermentAreaDto,
      res,
    );
  }

  /*
   *Api for delete women empowerment type
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: string, @Res() res: Response) {
    return this.womenEmpowermentAreaService.remove(id, res);
  }

  /*
   *Api for listing women empowerment type for user
   */
  @UseGuards(AuthGuard)
  @Get('user/list')
  findAllData(@Query() query, @Res() res: Response) {
    return this.womenEmpowermentAreaService.findAllData(query, res);
  }
}
