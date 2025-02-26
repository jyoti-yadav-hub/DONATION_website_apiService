import { Test, TestingModule } from '@nestjs/testing';
import { ErrorlogController } from './error-log.controller';

describe('ErrorlogController', () => {
  let controller: ErrorlogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErrorlogController],
    }).compile();

    controller = module.get<ErrorlogController>(ErrorlogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
