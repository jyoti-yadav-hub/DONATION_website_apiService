import { Test, TestingModule } from '@nestjs/testing';
import { ManualTransferController } from './manual-transfer.controller';
import { ManualTransferService } from './manual-transfer.service';

describe('ManualTransferController', () => {
  let controller: ManualTransferController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManualTransferController],
      providers: [ManualTransferService],
    }).compile();

    controller = module.get<ManualTransferController>(ManualTransferController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
