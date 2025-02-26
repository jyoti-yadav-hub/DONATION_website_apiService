import {
  Get,
  Put,
  Res,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { BookmarkService } from './bookmark.service';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ParamMissing } from 'src/auth/param-missing.pipe';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { CreateBookmarkItemsDto } from './dto/create-bookmark-items.dto';
import { AddToBookmarkDto } from './dto/add-to-bookmark.dto';
import { ListDto } from './dto/list-dto.dto';

@ApiTags('Bookmark')
@Controller('bookmark')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  //Api for create collection for save post
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async createBookmark(
    @Body() createBookmarkItemsDto: CreateBookmarkItemsDto,
    @Res() res: Response,
  ) {
    return await this.bookmarkService.createBookmark(
      createBookmarkItemsDto,
      res,
    );
  }

  //Api for add item into collection
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('add-to-bookmark')
  async addToBookmark(
    @Body() addToBookmarkDto: AddToBookmarkDto,
    @Res() res: Response,
  ) {
    return await this.bookmarkService.addToBookmark(addToBookmarkDto, res);
  }

  //Api for remove item from bookmark
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('remove-from-bookmark/:id')
  async removeBookmark(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.bookmarkService.removeBookmark(id, res);
  }

  // Api for bookmark list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async bookmarkList(@Query() query, @Res() res: Response) {
    return await this.bookmarkService.bookmarkList(query, res);
  }

  // Api for bookmark fundraiser list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('fundraiser-list')
  async bookmarkFundraiserList(
    @Query() listDto: ListDto,
    @Res() res: Response,
  ) {
    return await this.bookmarkService.bookmarkFundraiserList(listDto, res);
  }

  // Api for bookmark fund list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('fund-list')
  async bookmarkFundList(@Query() listDto: ListDto, @Res() res: Response) {
    return await this.bookmarkService.bookmarkFundList(listDto, res);
  }

  //Api for bookmark drive list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('drive-list')
  async bookmarkDriveList(@Query() listDto: ListDto, @Res() res: Response) {
    return await this.bookmarkService.bookmarkDriveList(listDto, res);
  }

  //Api for bookmark ngo list
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('ngo-list')
  async bookmarkNgoList(@Query() listDto: ListDto, @Res() res: Response) {
    return await this.bookmarkService.bookmarkNgoList(listDto, res);
  }
}
