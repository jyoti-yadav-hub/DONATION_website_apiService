import { Test, TestingModule } from '@nestjs/testing';
import { ShareMessageController } from './share-message.controller';
import { ShareMessageService } from './share-message.service';

describe('ShareMessageController', () => {
  let controller: ShareMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShareMessageController],
      providers: [ShareMessageService],
    }).compile();

    controller = module.get<ShareMessageController>(ShareMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
