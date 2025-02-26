import { Test, TestingModule } from '@nestjs/testing';
import { BankTypeService } from './bank-type.service';

describe('BankTypeService', () => {
  let service: BankTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankTypeService],
    }).compile();

    service = module.get<BankTypeService>(BankTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
