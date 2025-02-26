import { Test, TestingModule } from '@nestjs/testing';
import { CourseDiseaseController } from './course-disease.controller';
import { CourseDiseaseService } from './course-disease.service';

describe('CourseDiseaseController', () => {
  let controller: CourseDiseaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseDiseaseController],
      providers: [CourseDiseaseService],
    }).compile();

    controller = module.get<CourseDiseaseController>(CourseDiseaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
