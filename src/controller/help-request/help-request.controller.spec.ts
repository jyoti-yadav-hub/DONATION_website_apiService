import { Test, TestingModule } from '@nestjs/testing';
import { HelpRequestController } from './help-request.controller';
import { HelpRequestService } from './help-request.service';

describe('HelpRequestController', () => {
  let controller: HelpRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HelpRequestController],
      providers: [HelpRequestService],
    }).compile();

    controller = module.get<HelpRequestController>(HelpRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
