import {
  Get,
  Put,
  Res,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';

import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ShareMessageService } from './share-message.service';
import { CreateShareMessageDto } from './dto/create-share-message.dto';
import { UpdateShareMessageDto } from './dto/update-share-message.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('share-message')
@ApiTags('share message')
export class ShareMessageController {
  constructor(private readonly shareMessageService: ShareMessageService) {}

  //Api for create share message
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('create')
  async create(
    @Body() createShareMessageDto: CreateShareMessageDto,
    @Res() res: Response,
  ) {
    return await this.shareMessageService.create(createShareMessageDto, res);
  }

  // Api for update share message
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('update/:id')
  async updateShareMsg(
    @Param('id', IdMissing) id: string,
    @Body() updateShareMessageDto: UpdateShareMessageDto,
    @Res() res: Response,
  ) {
    return await this.shareMessageService.update(
      id,
      updateShareMessageDto,
      res,
    );
  }

  //Api for delete share message
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('delete/:id')
  async delete(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.shareMessageService.delete(id, res);
  }

  //Api for share message list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin/list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.shareMessageService.findAll(query, res);
  }

  //Api for find share message based on category
  @Get('list')
  async findOne(@Query() query, @Res() res: Response) {
    return await this.shareMessageService.findOne(query, res);
  }

  //Api for list category for admin
  @Get('category-list')
  async categoryList(@Query() query, @Res() res: Response) {
    return await this.shareMessageService.categoryList(query, res);
  }
}
