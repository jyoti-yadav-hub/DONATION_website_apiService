import { RequestService } from './request.service';
import { Test, TestingModule } from '@nestjs/testing';
import { VolunteerService } from './volunteer.service';
import { RequestController } from './request.controller';

describe('RequestController', () => {
  let controller: RequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestController],
      providers: [RequestService, VolunteerService],
    }).compile();

    controller = module.get<RequestController>(RequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
