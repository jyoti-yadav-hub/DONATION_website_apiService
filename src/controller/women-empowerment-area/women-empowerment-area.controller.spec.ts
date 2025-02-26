import { Test, TestingModule } from '@nestjs/testing';
import { WomenEmpowermentAreaController } from './women-empowerment-area.controller';
import { WomenEmpowermentAreaService } from './women-empowerment-area.service';

describe('WomenEmpowermentAreaController', () => {
  let controller: WomenEmpowermentAreaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WomenEmpowermentAreaController],
      providers: [WomenEmpowermentAreaService],
    }).compile();

    controller = module.get<WomenEmpowermentAreaController>(WomenEmpowermentAreaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
