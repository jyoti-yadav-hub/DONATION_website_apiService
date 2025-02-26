import { Test, TestingModule } from '@nestjs/testing';
import { NgoFormController } from './ngo-form.controller';
import { NgoFormService } from './ngo-form.service';

describe('NgoFormController', () => {
  let controller: NgoFormController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NgoFormController],
      providers: [NgoFormService],
    }).compile();

    controller = module.get<NgoFormController>(NgoFormController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
