/* eslint-disable prettier/prettier */
import {
    Get,
    Res,
    Body,
    Query,
    Param,
    Delete,
    UseGuards,
    Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorlogService } from './error-log.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { DeleteErrorLogDto } from './dto/delete-error-log.dto';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('errorlog')
@ApiTags('Error Log')
export class ErrorlogController {
    constructor(private readonly errorLogService: ErrorlogService) { }

    //Api for error log list
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token')
    @Get('list')
    async findAll(@Query() query, @Res() res: Response) {
        return await this.errorLogService.findAll(query, res);
    }

    //Api for delete errorLog
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token')
    @Delete('delete/:id')
    async deleteErrorLog(@Param('id', IdMissing) id: string, @Res() res: Response) {
        return await this.errorLogService.deleteErrorLog(id, res);
    }

    //Api for delete multiple errorLog
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token')
    @Delete('delete-multiple')
    async deleteManyErrorLog(
        @Body() deleteErrorLogDto: DeleteErrorLogDto,
        @Res() res: Response,
    ) {
        return await this.errorLogService.deleteManyErrorLog(
            deleteErrorLogDto,
            res,
        );
    }
}
