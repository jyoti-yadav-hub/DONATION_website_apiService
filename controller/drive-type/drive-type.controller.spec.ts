import { Test, TestingModule } from '@nestjs/testing';
import { DriveTypeController } from './drive-type.controller';
import { DriveTypeService } from './drive-type.service';

describe('DriveTypeController', () => {
  let controller: DriveTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriveTypeController],
      providers: [DriveTypeService],
    }).compile();

    controller = module.get<DriveTypeController>(DriveTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
