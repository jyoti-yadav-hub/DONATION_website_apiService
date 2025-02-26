import { Test, TestingModule } from '@nestjs/testing';
import { ShareMessageService } from './share-message.service';

describe('ShareMessageService', () => {
  let service: ShareMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShareMessageService],
    }).compile();

    service = module.get<ShareMessageService>(ShareMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
