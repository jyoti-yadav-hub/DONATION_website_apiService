import { Test, TestingModule } from '@nestjs/testing';
import { ErrorlogService } from './error-log.service';

describe('ErrorlogService', () => {
  let service: ErrorlogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErrorlogService],
    }).compile();

    service = module.get<ErrorlogService>(ErrorlogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
