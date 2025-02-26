import { FooterStripService } from './footer-strip.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('FooterStripService', () => {
  let service: FooterStripService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FooterStripService],
    }).compile();

    service = module.get<FooterStripService>(FooterStripService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
