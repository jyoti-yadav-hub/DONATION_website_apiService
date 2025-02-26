import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  Response,
} from '@nestjs/common';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { ContactUsService } from './contact-us.service';
import { ContactUsDto } from './dto/contact-us.dto';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { UpdateContactUsDto } from './dto/update-contact-us.dto';

@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  //Api for send contact us email 
  @Post('send-mail')
  async sendMail(
    @Body() createContactUsDto: CreateContactUsDto,
    @Res() res: Response,
  ) {
    return await this.contactUsService.sendMail(createContactUsDto, res);
  }

  //Api for create copntact us
  @Post('create')
  async createContactUs(
    @Body() contactUsDto: ContactUsDto,
    @Res() res: Response,
  ) {
    return await this.contactUsService.createContactUs(contactUsDto, res);
  }

  //Api for user list
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.contactUsService.findAll(query, res);
  }
}
