import { HomeCmsService } from './home-cms.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('HomeCmsService', () => {
  let service: HomeCmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomeCmsService],
    }).compile();

    service = module.get<HomeCmsService>(HomeCmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
