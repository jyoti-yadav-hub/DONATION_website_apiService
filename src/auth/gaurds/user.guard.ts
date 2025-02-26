/* eslint-disable prettier/prettier */
import { UsersService } from '../../controller/users/users.service';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class UserGuard implements CanActivate {
    constructor(private usersService: UsersService) { }

    //Function for authorize user
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const { user } = context.switchToHttp().getRequest();
        const result = await this.usersService.findById(user.id);

        if (!result) {
            return false;
        }
        return true;
    }
}
