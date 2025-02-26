import { Test, TestingModule } from '@nestjs/testing';
import { UserBugReportController } from './user-bug-report.controller';
import { UserBugReportService } from './user-bug-report.service';

describe('UserBugReportController', () => {
  let controller: UserBugReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserBugReportController],
      providers: [UserBugReportService],
    }).compile();

    controller = module.get<UserBugReportController>(UserBugReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
