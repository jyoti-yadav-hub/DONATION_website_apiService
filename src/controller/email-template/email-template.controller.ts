/* eslint-disable prettier/prettier */
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
import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('email-template')
@ApiTags('Email Template')

export class EmailTemplateController {
    constructor(private readonly emailTemplateService: EmailTemplateService) { }

    //Api for create email template
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token') //edit here
    @Post('create')
    async create(
        @Body() createEmailTemplateDto: CreateEmailTemplateDto,
        @Res() res: Response,
    ) {
        return await this.emailTemplateService.create(createEmailTemplateDto, res);
    }

    //Api for email template list
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token') //edit here
    @Get('list')
    async findAll(@Query() query, @Res() res: Response) {
        return await this.emailTemplateService.findAll(query, res);
    }

    // Api for update Email template
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token') //edit here
    @Put('update/:id')
    async updateCms(
        @Param('id', IdMissing) id: string,
        @Body() updateEmailTemplateDto: UpdateEmailTemplateDto,
        @Res() res: Response,
    ) {
        return await this.emailTemplateService.update(
            id,
            updateEmailTemplateDto,
            res,
        );
    }

    //Api for delete email template
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token') //edit here
    @Delete('delete/:id')
    async delete(@Param('id', IdMissing) id: string, @Res() res: Response) {
        return await this.emailTemplateService.delete(id, res);
    }

    // Api for enable/disable email template
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token')
    @Put('set-email-template/:id')
    async setEmailTemplate(@Param('id', IdMissing) id: string, @Res() res: Response) {
        return await this.emailTemplateService.setEmailTemplate(id, res);
    }

    // Api for enable/disable email template
    @UseGuards(AuthGuard)
    @ApiBearerAuth('access-token')
    @Get('find-template/:slug')
    async findTemplate(@Param('slug') slug: string, @Res() res: Response) {
        return await this.emailTemplateService.findTemplate(slug, res);
    }
}
