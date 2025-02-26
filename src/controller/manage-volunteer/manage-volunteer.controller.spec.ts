import { Test, TestingModule } from '@nestjs/testing';
import { ManageVolunteerController } from './manage-volunteer.controller';
import { ManageVolunteerService } from './manage-volunteer.service';

describe('ManageVolunteerController', () => {
  let controller: ManageVolunteerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManageVolunteerController],
      providers: [ManageVolunteerService],
    }).compile();

    controller = module.get<ManageVolunteerController>(ManageVolunteerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
