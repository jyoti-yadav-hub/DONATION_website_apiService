/* eslint-disable prettier/prettier */
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
import { Response } from 'express';
import { IdMissing } from 'src/auth/id-missing.pipe';
import { RoleService } from './role.service';
import { AdminGuard } from 'src/auth/gaurds/admin.guard';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';

@Controller('role')
@ApiTags('Role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  //Api for create role
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Post('create')
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @Res() res: Response,
  ) {
    return await this.roleService.create(createRoleDto, res);
  }

  // Api for list role for Admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'allData', required: false })
  @Get('admin/list')
  async findAll(@Query() query, @Res() res: Response) {
    return await this.roleService.findAll(query, res);
  }

  // Api for update role
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('update/:id')
  async update(
    @Param('id', IdMissing) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Res() res: Response,
  ) {
    return await this.roleService.update(id, updateRoleDto, res);
  }

  //Api for delete role
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Delete('delete/:id')
  async remove(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.roleService.remove(id, res);
  }

  // Api for list role for app
  @Get('list')
  async roleList(@Res() res: Response) {
    return await this.roleService.roleList(res);
  }

  // Api for enable/disable role
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @Put('set-role/:id')
  async setRole(@Param('id', IdMissing) id: string, @Res() res: Response) {
    return await this.roleService.setRole(id, res);
  }
}
