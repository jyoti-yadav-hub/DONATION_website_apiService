import {
  Inject,
  Injectable,
  NestMiddleware,
  RequestMethod,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogService } from 'src/common/log.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logService: LogService) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const data = {
        method: req.method,
        originalUrl: req.originalUrl,
        ip: req.headers['x-forwarded-for'],
        request: {
          headers: req.headers,
          body: req.body,
          query: req.query,
          params: req.params,
        },
      };

      // Call createApiLog to create the log entry and get the ID
      this.logService.createApiLog(data);

      // Ends middleware function execution, hence allowing to move on
      if (next) {
        next();
      }
    } catch (error) {
      // Handle errors here
      console.error(error);
      next(error); // Pass the error to Nest.js error handling
    }
  }
}
