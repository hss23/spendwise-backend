import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { getModelToken } from '@nestjs/mongoose';
import { Goal, GoalSchema } from './schemas/goal.schema'; // Import Goal and GoalSchema

describe('GoalsService', () => {
  let service: GoalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: getModelToken(Goal.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
