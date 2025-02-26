import { Test, TestingModule } from '@nestjs/testing';
import { EmotionalMessageService } from './emotional-message.service';

describe('EmotionalMessageService', () => {
  let service: EmotionalMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmotionalMessageService],
    }).compile();

    service = module.get<EmotionalMessageService>(EmotionalMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
