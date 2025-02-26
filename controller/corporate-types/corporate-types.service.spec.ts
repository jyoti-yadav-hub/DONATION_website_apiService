import { Test, TestingModule } from '@nestjs/testing';
import { CorporateTypesService } from './corporate-types.service';

describe('CorporateTypesService', () => {
  let service: CorporateTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorporateTypesService],
    }).compile();

    service = module.get<CorporateTypesService>(CorporateTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
