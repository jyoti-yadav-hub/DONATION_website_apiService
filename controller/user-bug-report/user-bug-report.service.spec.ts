import { Test, TestingModule } from '@nestjs/testing';
import { UserBugReportService } from './user-bug-report.service';

describe('UserBugReportService', () => {
  let service: UserBugReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserBugReportService],
    }).compile();

    service = module.get<UserBugReportService>(UserBugReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
