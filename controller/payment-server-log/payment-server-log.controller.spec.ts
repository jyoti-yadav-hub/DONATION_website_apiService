import { Test, TestingModule } from '@nestjs/testing';
import { PaymentServerLogController } from './payment-server-log.controller';

describe('PaymentServerLogController', () => {
  let controller: PaymentServerLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentServerLogController],
    }).compile();

    controller = module.get<PaymentServerLogController>(
      PaymentServerLogController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
