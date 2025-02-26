import { Test, TestingModule } from '@nestjs/testing';
import { CorporateTypesController } from './corporate-types.controller';
import { CorporateTypesService } from './corporate-types.service';

describe('CorporateTypesController', () => {
  let controller: CorporateTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporateTypesController],
      providers: [CorporateTypesService],
    }).compile();

    controller = module.get<CorporateTypesController>(CorporateTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
