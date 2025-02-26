import { Test, TestingModule } from '@nestjs/testing';
import { DeleteAccountController } from './delete-account.controller';
import { DeleteAccountService } from './delete-account.service';

describe('DeleteAccountController', () => {
  let controller: DeleteAccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeleteAccountController],
      providers: [DeleteAccountService],
    }).compile();

    controller = module.get<DeleteAccountController>(DeleteAccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
