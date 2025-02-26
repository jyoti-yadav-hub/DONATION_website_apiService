import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StripeService } from './stripe.service';
import { User, UserSchema } from '../controller/users/entities/user.entity';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: User.name, schema: UserSchema }],
      'main_db',
    ),
  ],
  exports: [StripeService],
  providers: [StripeService],
})
export class StripeModule {}
