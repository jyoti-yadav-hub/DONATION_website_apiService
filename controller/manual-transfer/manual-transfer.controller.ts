import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
} from '@nestjs/common';
import { Response, query } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { ManualTransferService } from './manual-transfer.service';
import { CreateManualTransferDto } from './dto/create-manual-transfer.dto';
import { RequestManualTransferDto } from './dto/request-manual-transfer.dto';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { ApproveRejectRequest } from './dto/approve-reject-request.dto';
import { UserRequestManualTransferDto } from './dto/user-request-manual-transfer.dto';
import { UpdateUserRequestManualTransferDto } from './dto/update-user-request-manual-transfer.dto';
import { UpdateRequestManualTransferDto } from './dto/update-request-manual-transfer.dto';
@Controller('manual-transfer')
@ApiTags('manual-transfer')
export class ManualTransferController {
  constructor(private readonly manualTransferService: ManualTransferService) {}

  //Api for create transaction
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async createTransaction(
    @Body() createManualTransferDto: CreateManualTransferDto,
    @Res() res: Response,
  ) {
    return await this.manualTransferService.create(
      createManualTransferDto,
      res,
    );
  }

  // Api to list transaction request listing
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list-request')
  async listTransactionListing(@Query() query, @Res() res: Response) {
    return await this.manualTransferService.listRequest(query, res);
  }

  //Api to create request for manual transfer
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create-request')
  async createRequest(
    @Body()
    createRequestDto: RequestManualTransferDto,
    @Res() res: Response,
  ) {
    return await this.manualTransferService.createRequest(
      createRequestDto,
      res,
    );
  }

  //Api to create request for manual transfer for registered user
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('create-user-request')
  async UserCreateRequest(
    @Body() userRequestManualTransferDto: UserRequestManualTransferDto,
    @Res() res: Response,
  ) {
    return await this.manualTransferService.createRequest(
      userRequestManualTransferDto,
      res,
    );
  }

  //Api to update manual request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('update-user-request/:id')
  async updateRequest(
    @Param('id', IdMissing) id: string,
    @Body()
    updateUserRequestManualTransferDto: UpdateUserRequestManualTransferDto,
    @Res() res: Response,
  ) {
    return await this.manualTransferService.updateRequest(
      id,
      updateUserRequestManualTransferDto,
      res,
    );
  }

  //Api to update manual request for user
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Put('update-request/:id')
  async updateUserRequest(
    @Param('id', IdMissing) id: string,
    @Body()
    updateRequestManualTransferDto: UpdateRequestManualTransferDto,
    @Res() res: Response,
  ) {
    return await this.manualTransferService.updateRequest(
      id,
      updateRequestManualTransferDto,
      res,
    );
  }

  // Api to list manual request history
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('get-request')
  async getRequest(@Query() query, @Res() res: Response) {
    return await this.manualTransferService.getRequest(query, res);
  }

  //Api to cancel manual request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('cancel-request/:id')
  async cancelRequest(@Param('id') id: string, @Res() res: Response) {
    return await this.manualTransferService.cancelRequest(id, res);
  }

  // Api to list manual transaction listing for admin panel
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('admin/list')
  async requestListsForAdmin(@Query() query, @Res() res: Response) {
    return await this.manualTransferService.requestListsForAdmin(query, res);
  }

  //Api for update status of manual request
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('approve-reject-request/:id')
  async handleRequestStatus(
    @Param('id', IdMissing) id: string,
    @Body() approveRejectRequest: ApproveRejectRequest,
    @Res() res: Response,
  ) {
    return await this.manualTransferService.handleRequestStatus(
      id,
      approveRejectRequest,
      res,
    );
  }
}
