/* eslint-disable prettier/prettier */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UsersService } from '../../controller/users/users.service';
import { _ } from 'lodash';
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  //Function for optional authorize user
  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    if (authorization) {
      const token = authorization.split('Bearer ')[1] || null;
      if (token) {
        const findUser = await this.usersService.findByToken(token);

        if (!_.isEmpty(findUser)) {
          return (request.user = findUser);
        }
      }
    }
    return (request.user = {});
  }
}
