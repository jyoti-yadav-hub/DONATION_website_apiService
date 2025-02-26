import { FundService } from './fund.service';
import { FundController } from './fund.controller';
import { Test, TestingModule } from '@nestjs/testing';

describe('NGOController', () => {
  let controller: FundController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FundService],
      controllers: [FundController],
    }).compile();

    controller = module.get<FundController>(FundController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
