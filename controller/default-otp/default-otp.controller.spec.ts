import { Test, TestingModule } from '@nestjs/testing';
import { DefaultOtpController } from './default-otp.controller';
import { DefaultOtpService } from './default-otp.service';

describe('DefaultOtpController', () => {
  let controller: DefaultOtpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DefaultOtpController],
      providers: [DefaultOtpService],
    }).compile();

    controller = module.get<DefaultOtpController>(DefaultOtpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
