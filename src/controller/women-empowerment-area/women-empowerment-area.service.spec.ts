import { Test, TestingModule } from '@nestjs/testing';
import { WomenEmpowermentAreaService } from './women-empowerment-area.service';

describe('WomenEmpowermentAreaService', () => {
  let service: WomenEmpowermentAreaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WomenEmpowermentAreaService],
    }).compile();

    service = module.get<WomenEmpowermentAreaService>(WomenEmpowermentAreaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
