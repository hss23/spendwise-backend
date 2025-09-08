import { Test, TestingModule } from '@nestjs/testing';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service'; // Import GoalsService

describe('GoalsController', () => {
  let controller: GoalsController;
  let service: GoalsService; // Declare service

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [
        {
          provide: GoalsService, // Provide GoalsService
          useValue: {
            // Mock methods that your controller uses on the service
            // e.g., findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), etc.
          },
        },
      ],
    }).compile();

    controller = module.get<GoalsController>(GoalsController);
    service = module.get<GoalsService>(GoalsService); // Get the mocked service
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
