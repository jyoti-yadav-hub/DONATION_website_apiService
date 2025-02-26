import { Test, TestingModule } from '@nestjs/testing';
import { HospitalSchoolDataService } from './hospital-school-data.service';
import { HospitalSchoolDataController } from './hospital-school-data.controller';

describe('HospitalSchoolDataController', () => {
  let controller: HospitalSchoolDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HospitalSchoolDataController],
      providers: [HospitalSchoolDataService],
    }).compile();

    controller = module.get<HospitalSchoolDataController>(HospitalSchoolDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
