import { Test, TestingModule } from '@nestjs/testing';
import { DefaultOtpService } from './default-otp.service';

describe('DefaultOtpService', () => {
  let service: DefaultOtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefaultOtpService],
    }).compile();

    service = module.get<DefaultOtpService>(DefaultOtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
