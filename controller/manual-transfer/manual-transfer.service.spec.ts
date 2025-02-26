import { Test, TestingModule } from '@nestjs/testing';
import { ManualTransferService } from './manual-transfer.service';

describe('ManualTransferService', () => {
  let service: ManualTransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManualTransferService],
    }).compile();

    service = module.get<ManualTransferService>(ManualTransferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
