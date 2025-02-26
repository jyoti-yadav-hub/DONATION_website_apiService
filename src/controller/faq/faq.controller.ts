import {
  Get,
  Res,
  Put,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';

@Controller('faq')
@ApiTags('Faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  //Api for create FAQ
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Post('create')
  async create(@Body() createFaqDto: CreateFaqDto, @Res() res: Response) {
    return await this.faqService.create(createFaqDto, res);
  }

  //Api for FAQ list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.faqService.findAll(query, res);
  }

  // Api for FAQ list for web
  @Get('faq-list')
  async faqList(@Query() query, @Res() res: Response) {
    return await this.faqService.findAll(query, res);
  }

  // Api for update FAQ
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateFaqDto: UpdateFaqDto,
    @Res() res: Response,
  ) {
    return await this.faqService.update(id, updateFaqDto, res);
  }

  //Api for delete FAQ
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Delete('delete/:id')
  async delete(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.faqService.delete(id, res);
  }
}
