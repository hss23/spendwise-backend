import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service'; // Import BudgetsService

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let service: BudgetsService; // Declare service

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        {
          provide: BudgetsService, // Provide BudgetsService
          useValue: {
            // Mock methods that your controller uses on the service
            // e.g., findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), etc.
          },
        },
      ],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    service = module.get<BudgetsService>(BudgetsService); // Get the mocked service
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
