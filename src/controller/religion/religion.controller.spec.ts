import { Test, TestingModule } from '@nestjs/testing';
import { ReligionController } from './religion.controller';
import { ReligionService } from './religion.service';

describe('ReligionController', () => {
  let controller: ReligionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReligionController],
      providers: [ReligionService],
    }).compile();

    controller = module.get<ReligionController>(ReligionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
