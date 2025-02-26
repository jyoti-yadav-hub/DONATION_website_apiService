import { AdminService } from '../../controller/admin/admin.service';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private adminService: AdminService) {}

  //Function for authorize admin
  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log(context,"see here",context.switchToHttp().getRequest())
    const { user } = context.switchToHttp().getRequest();
    const result = await this.adminService.findById(user.id);
    user._id = user.id;
    user.active_type = 'admin';
    user.name = result.name;
    user.email = result.email;

    if (!result) {
      return false; 
    }
    return true;
  }
}
