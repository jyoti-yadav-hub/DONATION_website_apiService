import {
  Put,
  Res,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { HelpRequestService } from './help-request.service';
import { CreateHelpRequestDto } from './dto/create-help-request.dto';
import { UpdateHelpRequestDto } from './dto/update-help-request.dto';
import { VerifyHelpRequestDto } from './dto/verify-help-request.dto';
import { BlockRequestDto } from '../admin/dto/block-request.dto';

@Controller('help-request')
@ApiTags('help-request')
export class HelpRequestController {
  constructor(private readonly helpRequestService: HelpRequestService) {}

  //Api for create help request
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file,
    @Body() createHelpRequestDto: CreateHelpRequestDto,
    @Res() res: Response,
  ) {
    return await this.helpRequestService.create(
      file,
      createHelpRequestDto,
      res,
    );
  }

  //Api for help-request list for admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('admin/list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.helpRequestService.findAll(query, res);
  }

  //Api for help-request list for app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('list')
  async list(@Query() query, @Res() res: Response) {
    return await this.helpRequestService.list(query, res);
  }

  //Api for get help request detail admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/detail/:id')
  async getAdminCauseDetail(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.helpRequestService.getDetail(id, query, res);
  }

  //Api for assign volunteer admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/assign-volunteer/:id')
  async assignVolunteer(
    @Param('id', IdMissing) id: string,
    @Res() res: Response,
  ) {
    return await this.helpRequestService.assignVolunteer(id, res);
  }

  //Api for chnage status of help request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('change-status/:id')
  async verifyRequest(
    @Param('id') id: string,
    @Body() verifyHelpRequestDto: VerifyHelpRequestDto,
    @Res() res: Response,
  ) {
    return await this.helpRequestService.verifyRequest(
      id,
      verifyHelpRequestDto,
      res,
    );
  }

  //Api for report benificiary in help request
  @UseGuards(AuthGuard)
  @Post('report-benificiary/:id')
  @ApiBearerAuth('access-token')
  async reportBenificiary(
    @Param('id') id: string,
    @Body('description') description: string,
    @Res() res: Response,
  ) {
    return await this.helpRequestService.reportBenificiary(
      id,
      description,
      res,
    );
  }

  //Api for approve help request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('approve/:id')
  async approveRequest(@Param('id') id: string, @Res() res: Response) {
    return await this.helpRequestService.approveRequest(id, res);
  }

  // Api for block request when request is reported as spam
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('block-request')
  async blockRequest(
    @Body() blockRequestDto: BlockRequestDto,
    @Res() res: Response,
  ) {
    return await this.helpRequestService.blockRequest(blockRequestDto, res);
  }

  // Api for unblock request when request blocked
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('unblock-request')
  async unblockRequest(
    @Body() blockRequestDto: BlockRequestDto,
    @Res() res: Response,
  ) {
    return await this.helpRequestService.unblockRequest(blockRequestDto, res);
  }

  //Api for get my task count for volunteer
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token') //edit here
  @Get('my-task')
  async myTask(@Res() res: Response) {
    return await this.helpRequestService.myTask(res);
  }
}
