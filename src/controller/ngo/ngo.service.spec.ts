import { NGOService } from './ngo.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('UsersService', () => {
  let service: NGOService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NGOService],
    }).compile();

    service = module.get<NGOService>(NGOService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
