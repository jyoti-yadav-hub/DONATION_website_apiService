import { Test, TestingModule } from '@nestjs/testing';
import { PaymentServerLogService } from './payment-server-log.service';

describe('PaymentServerLogServiceService', () => {
  let service: PaymentServerLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentServerLogService],
    }).compile();

    service = module.get<PaymentServerLogService>(PaymentServerLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
