import { CsvUploadService } from './csv-upload.service';
import { CsvUploadController } from './csv-upload.controller';
import { Test, TestingModule } from '@nestjs/testing';

describe('CsvUploadController', () => {
  let controller: CsvUploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvUploadService],
      controllers: [CsvUploadController],
    }).compile();

    controller = module.get<CsvUploadController>(CsvUploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
