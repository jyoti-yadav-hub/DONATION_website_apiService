import { Test, TestingModule } from '@nestjs/testing';
import { DeleteAccountService } from './delete-account.service';

describe('DeleteAccountService', () => {
  let service: DeleteAccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteAccountService],
    }).compile();

    service = module.get<DeleteAccountService>(DeleteAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
