import { Test, TestingModule } from '@nestjs/testing';
import { CourseDiseaseService } from './course-disease.service';

describe('CourseDiseaseService', () => {
  let service: CourseDiseaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CourseDiseaseService],
    }).compile();

    service = module.get<CourseDiseaseService>(CourseDiseaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
