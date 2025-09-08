import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service'; // Import ExpensesService

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let service: ExpensesService; // Declare service

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService, // Provide ExpensesService
          useValue: {
            // Mock methods that your controller uses on the service
            // e.g., findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), etc.
          },
        },
      ],
    }).compile();

    controller = module.get<ExpensesController>(ExpensesController);
    service = module.get<ExpensesService>(ExpensesService); // Get the mocked service
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
