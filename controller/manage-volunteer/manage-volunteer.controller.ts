import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { ParamMissing } from 'src/auth/param-missing.pipe';
import { ManageVolunteerService } from './manage-volunteer.service';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { CreateManageVolunteerDto } from './dto/create-manage-volunteer.dto';
import { UpdateManageVolunteerDto } from './dto/update-manage-volunteer.dto';
import { RemoveVolunteerDto } from './dto/remove-volunteer.dto';
import { ManagePermissionDto } from './dto/manage-permission.dto';
import { UnblockVolunteer } from './dto/unblock-volunteer.dto';
import { OptionalAuthGuard } from 'src/auth/gaurds/optional-auth.guard';

@Controller('manage-volunteer')
@ApiTags('Manage Volunteer')
export class ManageVolunteerController {
  constructor(
    private readonly manageVolunteerService: ManageVolunteerService,
  ) {}

  //Api for Join fundraiser
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('join-request')
  async joinRequest(@Body('id') id: string, @Res() res: Response) {
    return await this.manageVolunteerService.joinRequest(id, res);
  }

  //Api for leave request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('leave-request/:id')
  async leaveRequest(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.manageVolunteerService.leaveFundraiser(id, res);
  }

  //Api for list volunteer
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('volunteer-list/:id')
  async volunteersList(
    @Param('id', IdMissing) id: string,
    @Query() query,
    @Res() res: Response,
  ) {
    return await this.manageVolunteerService.volunteerList(id, query, res);
  }

  //Api for remove volunteer from request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('remove')
  async removeVolunteer(
    @Body() removeVolunteerDto: RemoveVolunteerDto,
    @Res() res: Response,
  ) {
    return await this.manageVolunteerService.removeVolunteer(
      removeVolunteerDto,
      res,
    );
  }

  //Api for manage volunteer request permission
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('manage-permission')
  async managePermission(
    @Body() managePermissionDto: ManagePermissionDto,
    @Res() res: Response,
  ) {
    return await this.manageVolunteerService.managePermission(
      managePermissionDto,
      res,
    );
  }

  //Api for unblock volunteer in request
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Post('unblock-volunteer')
  async unblockVolunteer(
    @Body() unblockVolunteer: UnblockVolunteer,
    @Res() res: Response,
  ) {
    return await this.manageVolunteerService.unblockVolunteer(
      unblockVolunteer,
      res,
    );
  }
}
