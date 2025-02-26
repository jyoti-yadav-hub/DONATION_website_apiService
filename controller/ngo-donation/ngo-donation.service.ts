import { Injectable } from '@nestjs/common';
import { ErrorlogService } from '../error-log/error-log.service';
import mConfig from '../../config/message.config.json';

@Injectable()
export class NgoDonationService {
  constructor(private readonly errorlogService: ErrorlogService) {}

  /**
   * Api for downloading a demo of invite donor CSV file, with authentication and error handling.
   * @param
   * @param res
   */
  async generateDemoCsv(body, res: any) {
    try {
      const csvData = 'Name, Age, City\n';

      res.setHeader('Content-Disposition', 'attachment; filename=demo.csv');
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csvData);
    } catch (error) {
      this.errorlogService.errorLog(
        error,
        'src/controller/ngo-donation/ngo-donation.service.ts-generateDemoCsv',
      );
      return res.json({
        success: false,
        message: mConfig.Something_went_wrong,
      });
    }
  }
}
