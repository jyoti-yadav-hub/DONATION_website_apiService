import { Test, TestingModule } from '@nestjs/testing';
import { HospitalSchoolService } from './hospital-school.service';

describe('HospitalSchoolService', () => {
  let service: HospitalSchoolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HospitalSchoolService],
    }).compile();

    service = module.get<HospitalSchoolService>(HospitalSchoolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
