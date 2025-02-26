import { Test, TestingModule } from '@nestjs/testing';
import { FundHelpRequestController } from './fund-help-request.controller';
import { FundHelpRequestService } from './fund-help-request.service';

describe('FundHelpRequestController', () => {
  let controller: FundHelpRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FundHelpRequestController],
      providers: [FundHelpRequestService],
    }).compile();

    controller = module.get<FundHelpRequestController>(
      FundHelpRequestController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
