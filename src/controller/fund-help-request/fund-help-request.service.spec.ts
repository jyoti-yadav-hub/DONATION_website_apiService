import { Test, TestingModule } from '@nestjs/testing';
import { FundHelpRequestService } from './fund-help-request.service';

describe('FundHelpRequestService', () => {
  let service: FundHelpRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FundHelpRequestService],
    }).compile();

    service = module.get<FundHelpRequestService>(FundHelpRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
