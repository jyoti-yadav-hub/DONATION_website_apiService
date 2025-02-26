import {
  Get,
  Res,
  Put,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import Response from 'express';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeleteAccountService } from './delete-account.service';
import { CreateDeleteAccountDto } from './dto/create-delete-account.dto';
import { UpdateDeleteAccountDto } from './dto/update-delete-account.dto';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { IdMissing } from 'src/auth/id-missing.pipe';

@ApiTags('Delete Account')
@Controller('delete-account')
export class DeleteAccountController {
  constructor(private readonly deleteAccountService: DeleteAccountService) { }

  //Api for create delete account form in admin panel
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createDeleteAccountDto: CreateDeleteAccountDto,
    @Res() res: Response,
  ) {
    return await this.deleteAccountService.create(createDeleteAccountDto, res);
  }

  //Api for list delete account forms for Admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Get('list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.deleteAccountService.findAll(query, res);
  }

  //Api for update delete account form data
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateDeleteAccountDto: UpdateDeleteAccountDto,
    @Res() res: Response,
  ) {
    return await this.deleteAccountService.update(
      id,
      updateDeleteAccountDto,
      res,
    );
  }

  //Api for delete form
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.deleteAccountService.remove(id, res);
  }

  //Api for get form data to display in app
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('get-form')
  async getDeleteAccountForm(@Res() res: Response) {
    return await this.deleteAccountService.getDeleteAccountForm(res);
  }
}
