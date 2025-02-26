import { Test, TestingModule } from '@nestjs/testing';
import { DriveTypeService } from './drive-type.service';

describe('DriveTypeService', () => {
  let service: DriveTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriveTypeService],
    }).compile();

    service = module.get<DriveTypeService>(DriveTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
