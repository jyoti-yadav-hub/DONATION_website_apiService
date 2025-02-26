import { Test, TestingModule } from '@nestjs/testing';
import { NgoDonationController } from './ngo-donation.controller';
import { NgoDonationService } from './ngo-donation.service';

describe('NgoDonationController', () => {
  let controller: NgoDonationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NgoDonationController],
      providers: [NgoDonationService],
    }).compile();

    controller = module.get<NgoDonationController>(NgoDonationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
