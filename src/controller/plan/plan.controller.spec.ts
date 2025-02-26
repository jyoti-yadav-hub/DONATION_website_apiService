import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { Test, TestingModule } from '@nestjs/testing';

describe('PlanController', () => {
  let controller: PlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanService],
      controllers: [PlanController],
    }).compile();

    controller = module.get<PlanController>(PlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
