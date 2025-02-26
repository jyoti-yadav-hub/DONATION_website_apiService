import { Test, TestingModule } from '@nestjs/testing';
import { ReligionService } from './religion.service';

describe('ReligionService', () => {
  let service: ReligionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReligionService],
    }).compile();

    service = module.get<ReligionService>(ReligionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
