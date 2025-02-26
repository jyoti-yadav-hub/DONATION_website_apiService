/* eslint-disable prettier/prettier */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../../controller/users/users.service';
import { _ } from 'lodash';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private usersService: UsersService) {}
  
  //Function for authorize user
  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('Unauthorized');
    } else {
      const token = authorization.split('Bearer ')[1] || null;
      if (!token) {
        return response.json({
          message: 'Authentication token missing',
          success: false,
        });
      } else {
        const findUser = await this.usersService.findByToken(token);
       
        if (_.isEmpty(findUser)) {
          // return response.json({ message: 'Unauthorized', success: false });
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              error: 'Unauthorized',
            },
            HttpStatus.FORBIDDEN,
          );
        } else {
          return (request.user = findUser);
        }
      }
    }
  }
}
