import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Budget, BudgetDocument, BudgetPeriod, BudgetStatus } from './schemas/budget.schema';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private notificationsService: NotificationsService,
  ) {}

  private calculatePeriodDates(period: BudgetPeriod, startDate?: Date): { start: Date; end: Date } {
    const start = startDate || new Date();
    const end = new Date(start);

    switch (period) {
      case BudgetPeriod.WEEKLY:
        end.setDate(start.getDate() + 7);
        break;
      case BudgetPeriod.MONTHLY:
        end.setMonth(start.getMonth() + 1);
        break;
      case BudgetPeriod.QUARTERLY:
        end.setMonth(start.getMonth() + 3);
        break;
      case BudgetPeriod.YEARLY:
        end.setFullYear(start.getFullYear() + 1);
        break;
    }

    return { start, end };
  }

  async create(createBudgetDto: CreateBudgetDto, userId: string): Promise<Budget> {
    // Check if budget already exists for this category and period
    const existingBudget = await this.budgetModel.findOne({
      category: new Types.ObjectId(createBudgetDto.category),
      user: new Types.ObjectId(userId),
      status: BudgetStatus.ACTIVE,
      startDate: { $lte: new Date(createBudgetDto.endDate) },
      endDate: { $gte: new Date(createBudgetDto.startDate) },
    });

    if (existingBudget) {
      throw new BadRequestException('An active budget already exists for this category in the specified period');
    }

    const { start, end } = this.calculatePeriodDates(
      createBudgetDto.period || BudgetPeriod.MONTHLY,
      createBudgetDto.startDate ? new Date(createBudgetDto.startDate) : undefined
    );

    const budget = new this.budgetModel({
      ...createBudgetDto,
      user: new Types.ObjectId(userId),
      category: new Types.ObjectId(createBudgetDto.category),
      startDate: createBudgetDto.startDate ? new Date(createBudgetDto.startDate) : start,
      endDate: createBudgetDto.endDate ? new Date(createBudgetDto.endDate) : end,
      period: createBudgetDto.period || BudgetPeriod.MONTHLY,
    });

    // Set up auto-renewal
    if (budget.autoRenew) {
      budget.nextRenewalDate = new Date(budget.endDate);
    }

    await this.cacheManager.del(`budgets-${userId}`);
    return budget.save();
  }

  async findAll(userId: string, includeInactive = false): Promise<Budget[]> {
    const cacheKey = `budgets-${userId}-${includeInactive}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached as Budget[];
    }

    const filter: any = { user: new Types.ObjectId(userId) };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const budgets = await this.budgetModel
      .find(filter)
      .populate('category')
      .sort({ createdAt: -1 })
      .exec();

    await this.cacheManager.set(cacheKey, budgets, 300); // 5 minutes cache
    return budgets;
  }

  async findOne(id: string, userId: string): Promise<Budget> {
    const budget = await this.budgetModel
      .findOne({ _id: id, user: new Types.ObjectId(userId) })
      .populate('category')
      .exec();

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async update(id: string, updateBudgetDto: UpdateBudgetDto, userId: string): Promise<Budget> {
    const existingBudget = await this.findOne(id, userId);

    const updateData: any = { ...updateBudgetDto };
    
    if (updateBudgetDto.category) {
      updateData.category = new Types.ObjectId(updateBudgetDto.category);
    }
    
    if (updateBudgetDto.startDate) {
      updateData.startDate = new Date(updateBudgetDto.startDate);
    }
    
    if (updateBudgetDto.endDate) {
      updateData.endDate = new Date(updateBudgetDto.endDate);
    }

    const updatedBudget = await this.budgetModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category')
      .exec();

    await this.cacheManager.del(`budgets-${userId}`);
    return updatedBudget;
  }

  async remove(id: string, userId: string): Promise<{ deleted: boolean; id: string }> {
    const budget = await this.findOne(id, userId);
    
    // Soft delete
    await this.budgetModel.findByIdAndUpdate(id, { isActive: false }).exec();
    
    await this.cacheManager.del(`budgets-${userId}`);
    return { deleted: true, id };
  }

  async updateSpent(categoryId: string, amount: number, userId: string, operation: 'add' | 'subtract' = 'add'): Promise<void> {
    const activeBudgets = await this.budgetModel.find({
      category: new Types.ObjectId(categoryId),
      user: new Types.ObjectId(userId),
      status: BudgetStatus.ACTIVE,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).exec();

    for (const budget of activeBudgets) {
      const newSpent = operation === 'add' ? budget.spent + amount : budget.spent - amount;
      budget.spent = Math.max(0, newSpent); // Ensure spent doesn't go negative

      // Update status based on spending
      const spentPercentage = (budget.spent / budget.amount) * 100;
      
      if (budget.spent > budget.amount && budget.status !== BudgetStatus.EXCEEDED) {
        budget.status = BudgetStatus.EXCEEDED;
        
        if (budget.notificationsEnabled) {
          await this.notificationsService.createBudgetAlert(
            userId,
            budget.name,
            budget.spent,
            budget.amount,
            'exceeded'
          );
        }
      } else if (spentPercentage >= budget.warningThreshold && budget.status === BudgetStatus.ACTIVE) {
        if (budget.notificationsEnabled) {
          await this.notificationsService.createBudgetAlert(
            userId,
            budget.name,
            budget.spent,
            budget.amount,
            'warning'
          );
        }
      }

      await budget.save();
    }

    await this.cacheManager.del(`budgets-${userId}`);
  }

  async getBudgetSummary(userId: string): Promise<any> {
    const cacheKey = `budget-summary-${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const summary = await this.budgetModel.aggregate([
      { $match: { user: new Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalSpent: { $sum: '$spent' },
        }
      },
      {
        $group: {
          _id: null,
          budgets: { $push: '$$ROOT' },
          totalBudgets: { $sum: '$count' },
          overallAmount: { $sum: '$totalAmount' },
          overallSpent: { $sum: '$totalSpent' },
        }
      }
    ]);

    const result = summary[0] || {
      budgets: [],
      totalBudgets: 0,
      overallAmount: 0,
      overallSpent: 0,
    };

    await this.cacheManager.set(cacheKey, result, 300); // 5 minutes cache
    return result;
  }

  async getActivebudgetsByCategory(userId: string): Promise<Budget[]> {
    return this.budgetModel.find({
      user: new Types.ObjectId(userId),
      status: BudgetStatus.ACTIVE,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).populate('category').exec();
  }

  @Cron('0 0 * * *') // Daily at midnight
  async checkAndRenewBudgets(): Promise<void> {
    const today = new Date();
    
    // Find budgets that need renewal
    const budgetsToRenew = await this.budgetModel.find({
      autoRenew: true,
      nextRenewalDate: { $lte: today },
      status: { $in: [BudgetStatus.ACTIVE, BudgetStatus.COMPLETED] },
    }).exec();

    for (const budget of budgetsToRenew) {
      try {
        const { start, end } = this.calculatePeriodDates(budget.period, budget.nextRenewalDate);
        
        // Create new budget for next period
        const newBudget = new this.budgetModel({
          name: budget.name,
          description: budget.description,
          category: budget.category,
          amount: budget.amount,
          user: budget.user,
          period: budget.period,
          startDate: start,
          endDate: end,
          status: BudgetStatus.ACTIVE,
          warningThreshold: budget.warningThreshold,
          notificationsEnabled: budget.notificationsEnabled,
          rolloverUnused: budget.rolloverUnused,
          autoRenew: budget.autoRenew,
          nextRenewalDate: end,
        });

        // Handle unused budget rollover
        if (budget.rolloverUnused && budget.spent < budget.amount) {
          const unusedAmount = budget.amount - budget.spent;
          newBudget.amount += unusedAmount;
        }

        await newBudget.save();

        // Mark old budget as completed
        budget.status = BudgetStatus.COMPLETED;
        await budget.save();

      } catch (error) {
        console.error(`Failed to renew budget ${budget._id}:`, error.message);
      }
    }
  }

  @Cron('0 9 * * *') // Daily at 9 AM
  async sendBudgetReminders(): Promise<void> {
    const activeBudgets = await this.budgetModel.find({
      status: BudgetStatus.ACTIVE,
      notificationsEnabled: true,
      endDate: { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      },
    }).populate('user').exec();

    for (const budget of activeBudgets) {
      const spentPercentage = (budget.spent / budget.amount) * 100;
      const daysLeft = Math.ceil((budget.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

      if (daysLeft <= 3 && spentPercentage < 90) { // Remind only if budget period ending soon and not overspent
        await this.notificationsService.create({
          userId: budget.user.toString(),
          type: 'BUDGET_WARNING' as any,
          title: 'Budget Period Ending Soon',
          message: `Your ${budget.name} budget period ends in ${daysLeft} day(s). You've spent ${spentPercentage.toFixed(1)}% of your budget.`,
          priority: 'MEDIUM' as any,
        });
      }
    }
  }
}
