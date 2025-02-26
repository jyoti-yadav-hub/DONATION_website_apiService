import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { Test, TestingModule } from '@nestjs/testing';

describe('CmsController', () => {
  let controller: CmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CmsController],
      providers: [CmsService],
    }).compile();

    controller = module.get<CmsController>(CmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
