import { NGOService } from './ngo.service';
import { NGOController } from './ngo.controller';
import { Test, TestingModule } from '@nestjs/testing';

describe('NGOController', () => {
  let controller: NGOController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NGOService],
      controllers: [NGOController],
    }).compile();

    controller = module.get<NGOController>(NGOController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
