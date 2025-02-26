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
import Response from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { EmotionalMessageService } from './emotional-message.service';
import { CreateEmotionalMessageDto } from './dto/create-emotional-message.dto';
import { UpdateEmotionalMessageDto } from './dto/update-emotional-message.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('emotional-message')
@ApiTags('Emotional Message')
export class EmotionalMessageController {
  constructor(
    private readonly emotionalMessageService: EmotionalMessageService,
  ) {}

  //Api for create emotional messages
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  create(
    @Body() createEmotionalMessageDto: CreateEmotionalMessageDto,
    @Res() res: Response,
  ) {
    return this.emotionalMessageService.create(createEmotionalMessageDto, res);
  }

  //Api for list emotional messages
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  findAll(@Query() query, @Res() res: Response) {
    return this.emotionalMessageService.findAll(query, res);
  }

  //Api for update emotional messages
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  update(
    @Param('id', IdMissing) id: string,
    @Body() updateEmotionalMessageDto: UpdateEmotionalMessageDto,
    @Res() res: Response,
  ) {
    return this.emotionalMessageService.update(
      id,
      updateEmotionalMessageDto,
      res,
    );
  }

  //Api for delete emotional messages
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return this.emotionalMessageService.remove(id, res);
  }

  //Api for get random emotional message
  @Get('get-emotional-message/:category_slug')
  getEmotionalMessage(
    @Param('category_slug') category_slug: string,
    @Res() res: Response,
  ) {
    return this.emotionalMessageService.getEmotionalMessage(category_slug, res);
  }
}
