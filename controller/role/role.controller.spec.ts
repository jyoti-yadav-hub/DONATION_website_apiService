import { RoleService } from './role.service';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';

describe('RoleController', () => {
  let controller: RoleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService],
      controllers: [RoleController],
    }).compile();

    controller = module.get<RoleController>(RoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
