import { Test, TestingModule } from '@nestjs/testing';
import { ManageVolunteerService } from './manage-volunteer.service';

describe('ManageVolunteerService', () => {
  let service: ManageVolunteerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManageVolunteerService],
    }).compile();

    service = module.get<ManageVolunteerService>(ManageVolunteerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
