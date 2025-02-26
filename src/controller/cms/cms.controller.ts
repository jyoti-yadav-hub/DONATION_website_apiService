/* eslint-disable prettier/prettier */
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
import { CmsService } from './cms.service';
import { CreateCmDto } from './dto/create-cm.dto';
import { UpdateCmDto } from './dto/update-cm.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';

@Controller('cms')
@ApiTags('Cms')
export class CmsController {
    constructor(private readonly cmsService: CmsService) { }

    //Api for create cms
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token') //edit here
    @Post('create')
    async createCms(@Body() createCmDto: CreateCmDto, @Res() res: Response) {
        return await this.cmsService.createCms(createCmDto, res);
    }

    //Api for cms list
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token') //edit here
    @Get('list')
    async findAll(@Query() query, @Res() res: Response) {
        return await this.cmsService.findAll(query, res);
    }

    // Api for update cms
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token') //edit here
    @Put('update/:id')
    async updateCms(
        @Param('id', IdMissing) id: string,
        @Body() updateCmDto: UpdateCmDto,
        @Res() res: Response,
    ) {
        return await this.cmsService.updateCms(id, updateCmDto, res);
    }

    //Api for delete cms
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token') //edit here
    @Delete('delete/:id')
    async deleteCms(@Param('id', IdMissing) id: string, @Res() res: Response) {
        return await this.cmsService.deleteCms(id, res);
    }

    //Api for get cms page from given slug
    @Get('get-page/:slug')
    async getPage(@Param('slug') slug: string, @Res() res: Response) {
        return await this.cmsService.getPage(slug, res);
    }
}
