import {
  Controller,
  Res,
  Post,
  Get,
  Query,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { FundHelpRequestService } from './fund-help-request.service';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateFundHelpRequestDto } from './dto/create-fund-help-request.dto';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { OptionalAuthGuard } from 'src/auth/gaurds/optional-auth.guard';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { FundService } from '../fund/fund.service';

@ApiTags('Fund Help Request')
@Controller('fund-help-request')
export class FundHelpRequestController {
  constructor(
    private readonly fundHelpRequestService: FundHelpRequestService,
    private readonly fundService: FundService,
  ) {}

  // Api to save new help request in fund
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createFundHelpRequestDto: CreateFundHelpRequestDto,
    @Res() res: Response,
  ) {
    return this.fundHelpRequestService.create(createFundHelpRequestDto, res);
  }

  // Api for get user fundraisers list match with fund causes
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('fundraisers-list')
  async getFundraisersList(@Body() body: object, @Res() res: Response) {
    return await this.fundHelpRequestService.getFundraisersList(body, res);
  }

  //Api for list of fund help request for app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('list')
  async findAll(@Body() body, @Res() res: Response) {
    return await this.fundHelpRequestService.findAll(body, res);
  }

  //Api for list of fund help request for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async getAdminFundraisersList(@Query() query, @Res() res: Response) {
    return await this.fundHelpRequestService.findAll(query, res);
  }

  //Api for find similar fundraisers list for app
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('similar-fundraisers')
  async fundraiserList(@Body() body, @Res() res: Response) {
    return await this.fundHelpRequestService.findSimilarFundraisers(body, res);
  }

  //Api for list donations in help requests

  @Get('donated/:id')
  async getFundDonated(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.fundService.getFundDonated(
      'help_request',
      id,
      query,
      res,
    );
  }
}
