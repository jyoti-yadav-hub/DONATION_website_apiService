import { Test, TestingModule } from '@nestjs/testing';
import { DisasterTypesController } from './disaster-types.controller';
import { DisasterTypesService } from './disaster-types.service';

describe('DisasterTypesController', () => {
  let controller: DisasterTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisasterTypesController],
      providers: [DisasterTypesService],
    }).compile();

    controller = module.get<DisasterTypesController>(DisasterTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
