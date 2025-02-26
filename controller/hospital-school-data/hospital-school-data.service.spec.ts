import { Test, TestingModule } from '@nestjs/testing';
import { HospitalSchoolDataService } from './hospital-school-data.service';

describe('HospitalSchoolDataService', () => {
  let service: HospitalSchoolDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HospitalSchoolDataService],
    }).compile();

    service = module.get<HospitalSchoolDataService>(HospitalSchoolDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
