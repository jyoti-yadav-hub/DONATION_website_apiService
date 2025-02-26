import { Controller, Get, Body, UseGuards, Res } from '@nestjs/common';
import { NgoDonationService } from './ngo-donation.service';
import { DownloadDonorDemoCsv } from './dto/download-donor-demo-csv.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/gaurds/auth.guard';
import { Response } from 'express';

@Controller('ngo-donation')
@ApiTags('Ngo Donation')
export class NgoDonationController {
  constructor(private readonly ngoDonationService: NgoDonationService) {}

  /**
   * Api for downloading a demo of invite donor CSV file, with authentication and error handling.
   * @param
   * @param res
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @Get('/download-demo-csv')
  async findAll(@Res() res: Response) {
    await this.ngoDonationService.generateDemoCsv({}, res);
  }
}
