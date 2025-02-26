import { FooterStripService } from './footer-strip.service';
import { FooterStripController } from './footer-strip.controller';
import { Test, TestingModule } from '@nestjs/testing';

describe('FooterStripController', () => {
  let controller: FooterStripController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FooterStripService],
      controllers: [FooterStripController],
    }).compile();

    controller = module.get<FooterStripController>(FooterStripController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
