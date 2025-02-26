import { Test, TestingModule } from '@nestjs/testing';
import { NgoFormService } from './ngo-form.service';

describe('NgoFormService', () => {
  let service: NgoFormService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NgoFormService],
    }).compile();

    service = module.get<NgoFormService>(NgoFormService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
