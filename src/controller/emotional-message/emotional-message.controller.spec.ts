import { Test, TestingModule } from '@nestjs/testing';
import { EmotionalMessageService } from './emotional-message.service';
import { EmotionalMessageController } from './emotional-message.controller';

describe('EmotionalMessageController', () => {
  let controller: EmotionalMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmotionalMessageController],
      providers: [EmotionalMessageService],
    }).compile();

    controller = module.get<EmotionalMessageController>(EmotionalMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
