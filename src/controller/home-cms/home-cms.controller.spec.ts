import { HomeCmsService } from './home-cms.service';
import { Test, TestingModule } from '@nestjs/testing';
import { HomeCmsController } from './home-cms.controller';

describe('HomeCmsController', () => {
  let controller: HomeCmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeCmsController],
      providers: [HomeCmsService],
    }).compile();

    controller = module.get<HomeCmsController>(HomeCmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
