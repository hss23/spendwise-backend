import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsService } from './budgets.service';
import { getModelToken } from '@nestjs/mongoose';
import { Budget, BudgetSchema } from './schemas/budget.schema'; // Import Budget and BudgetSchema

describe('BudgetsService', () => {
  let service: BudgetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getModelToken(Budget.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
