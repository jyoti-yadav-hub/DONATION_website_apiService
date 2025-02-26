/* eslint-disable prettier/prettier */
import {
  Get,
  Res,
  Put,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';

@Controller('images')
@ApiTags('Images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  // Api for create image
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(@Body() createImageDto: CreateImageDto, @Res() res: Response) {
    return await this.imagesService.create(createImageDto, res);
  }

  // Api for image list for Admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'allData', required: false })
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.imagesService.findAll(query, res);
  }

  // Api for update image
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateImageDto: UpdateImageDto,
    @Res() res: Response,
  ) {
    return await this.imagesService.update(id, updateImageDto, res);
  }

  //Api for delete image
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.imagesService.remove(id, res);
  }

  // Api for get image
  @Get('get-images/:type')
  async findAllImages(@Param() type: string, @Res() res: Response) {
    return await this.imagesService.findImages(type, res);
  }
}
