import * as jwt from 'jsonwebtoken';
import { UsersService } from './users.service';
import { Response, NextFunction } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';
const dotenv = require('dotenv');
dotenv.config({
  path: './.env',
});
@Injectable()
export class authJwtMiddleware implements NestMiddleware {
  constructor(private readonly userService: UsersService) {}

  async use(req: any, res: Response, next: NextFunction) {
    if (!req.headers['authorization']) {
      return res.status(403).json({
        message: 'Unauthorized',
      });
    }
    const Authorization =
      req.headers['authorization'].split('Bearer ')[1] || null;
    if (Authorization) {
      const secretKey = process.env.secret;
      const decoded: any = jwt.verify(Authorization, secretKey);

      const user = await this.userService.findById(decoded.id);

      if (!user) {
        return res.json({
          success: false,
          message: 'Not allowed to perfom this action.',
        });
      }

      req.user = user;
      next();
    } else {
      return res.status(404).send({
        message: 'Authentication token missing',
      });
    }
  }
}
