import { Test, TestingModule } from '@nestjs/testing';
import { NgoDonationService } from './ngo-donation.service';

describe('NgoDonationService', () => {
  let service: NgoDonationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NgoDonationService],
    }).compile();

    service = module.get<NgoDonationService>(NgoDonationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
