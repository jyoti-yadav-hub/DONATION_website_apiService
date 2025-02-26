import { CsvUploadService } from './csv-upload.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('CsvUploadService', () => {
  let service: CsvUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvUploadService],
    }).compile();

    service = module.get<CsvUploadService>(CsvUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
