/* eslint-disable prettier/prettier */
import {
    Get,
    Put,
    Res,
    Post,
    Body,
    Query,
    Param,
    Delete,
    UseGuards,
    Controller,
} from '@nestjs/common';
import { Response } from 'express';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { IdMissing } from 'src/auth/id-missing.pipe';

@Controller('plan')
@ApiTags('Plan')
export class PlanController {
    constructor(private readonly planService: PlanService) { }

    // Api for create plan
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token')
    @Post('create')
    async create(@Body() createPlanDto: CreatePlanDto, @Res() res: Response) {
        return await this.planService.createPlan(createPlanDto, res);
    }

    // Api for update category
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token')
    @Put('update/:id')
    async update(
        @Param('id', IdMissing) id: string,
        @Body() updatePlanDto: UpdatePlanDto,
        @Res() res: Response,
    ) {
        return await this.planService.updatePlan(id, updatePlanDto, res);
    }

    //Api for delete category
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token')
    @Delete('delete/:id')
    async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
        return await this.planService.removePlan(id, res);
    }

    // Api for Plan list for Admin
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token')
    @ApiQuery({ name: 'allData', required: false })
    @Get('list')
    async findAll(@Query() query, @Res() res: Response) {
        return await this.planService.findAll(query, res);
    }

    // Api for Plan list for User
    @UseGuards(AuthGuard)
    @ApiBearerAuth('access-token')
    @Get('plan-list')
    async list(@Res() res: Response) {
        return await this.planService.planList(res);
    }

    // Api for enable/disable plan
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth('access-token')
    @Put('set-plan/:id')
    async setCategory(@Param('id', IdMissing) id: string, @Res() res: Response) {
        return await this.planService.setPlan(id, res);
    }
}
