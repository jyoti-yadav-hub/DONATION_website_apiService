import { Test, TestingModule } from '@nestjs/testing';
import { DisasterTypesService } from './disaster-types.service';

describe('DisasterTypesService', () => {
  let service: DisasterTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisasterTypesService],
    }).compile();

    service = module.get<DisasterTypesService>(DisasterTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
