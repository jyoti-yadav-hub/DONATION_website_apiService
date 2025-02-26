import { Test, TestingModule } from '@nestjs/testing';
import { HospitalSchoolService } from './hospital-school.service';
import { HospitalSchoolController } from './hospital-school.controller';

describe('HospitalSchoolController', () => {
  let controller: HospitalSchoolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HospitalSchoolController],
      providers: [HospitalSchoolService],
    }).compile();

    controller = module.get<HospitalSchoolController>(HospitalSchoolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
