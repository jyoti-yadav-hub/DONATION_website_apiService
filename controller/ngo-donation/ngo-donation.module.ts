import { Module } from '@nestjs/common';
import { NgoDonationService } from './ngo-donation.service';
import { NgoDonationController } from './ngo-donation.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports:[UsersModule],
  controllers: [NgoDonationController],
  providers: [NgoDonationService]
})
export class NgoDonationModule {}
