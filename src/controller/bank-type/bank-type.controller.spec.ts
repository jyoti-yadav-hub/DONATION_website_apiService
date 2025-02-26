import { Test, TestingModule } from '@nestjs/testing';
import { BankTypeController } from './bank-type.controller';
import { BankTypeService } from './bank-type.service';

describe('BankTypeController', () => {
  let controller: BankTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankTypeController],
      providers: [BankTypeService],
    }).compile();

    controller = module.get<BankTypeController>(BankTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
