import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Goal, GoalDocument, GoalStatus } from './schemas/goal.schema';
import { CreateGoalDto, UpdateGoalDto, ContributeToGoalDto } from './dto/goal.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class GoalsService {
  constructor(
    @InjectModel(Goal.name) private goalModel: Model<GoalDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private notificationsService: NotificationsService,
  ) {}

  async create(createGoalDto: CreateGoalDto, userId: string): Promise<Goal> {
    // Calculate monthly target if deadline is provided
    let monthlyTarget = createGoalDto.monthlyTarget;
    if (!monthlyTarget && createGoalDto.deadline) {
      const deadline = new Date(createGoalDto.deadline);
      const monthsToDeadline = Math.ceil((deadline.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000));
      monthlyTarget = createGoalDto.targetAmount / monthsToDeadline;
    }

    const goal = new this.goalModel({
      ...createGoalDto,
      user: new Types.ObjectId(userId),
      deadline: createGoalDto.deadline ? new Date(createGoalDto.deadline) : undefined,
      monthlyTarget,
    });

    const savedGoal = await goal.save();
    await this.cacheManager.del(`goals-${userId}`);
    return savedGoal;
  }

  async findAll(userId: string, includeInactive = false): Promise<Goal[]> {
    const cacheKey = `goals-${userId}-${includeInactive}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached as Goal[];
    }

    const filter: any = { user: new Types.ObjectId(userId) };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const goals = await this.goalModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();

    await this.cacheManager.set(cacheKey, goals, 300); // 5 minutes cache
    return goals;
  }

  async findOne(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalModel
      .findOne({ _id: id, user: new Types.ObjectId(userId) })
      .exec();

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async update(id: string, updateGoalDto: UpdateGoalDto, userId: string): Promise<Goal> {
    const existingGoal = await this.findOne(id, userId);

    const updateData: any = { ...updateGoalDto };
    
    if (updateGoalDto.deadline) {
      updateData.deadline = new Date(updateGoalDto.deadline);
    }

    // Recalculate monthly target if target amount or deadline changed
    if ((updateGoalDto.targetAmount || updateGoalDto.deadline) && updateData.deadline) {
      const monthsToDeadline = Math.ceil((updateData.deadline.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000));
      const targetAmount = updateGoalDto.targetAmount || existingGoal.targetAmount;
      const currentAmount = existingGoal.currentAmount;
      updateData.monthlyTarget = (targetAmount - currentAmount) / monthsToDeadline;
    }

    const updatedGoal = await this.goalModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    await this.cacheManager.del(`goals-${userId}`);
    return updatedGoal;
  }

  async remove(id: string, userId: string): Promise<{ deleted: boolean; id: string }> {
    const goal = await this.findOne(id, userId);
    
    // Soft delete
    await this.goalModel.findByIdAndUpdate(id, { isActive: false }).exec();
    
    await this.cacheManager.del(`goals-${userId}`);
    return { deleted: true, id };
  }

  async contributeToGoal(id: string, contributeDto: ContributeToGoalDto, userId: string): Promise<Goal> {
    const goal = await this.findOne(id, userId);

    if (goal.status !== GoalStatus.ACTIVE) {
      throw new BadRequestException('Cannot contribute to inactive goal');
    }

    const newAmount = goal.currentAmount + contributeDto.amount;
    
    // Check if goal is achieved
    let newStatus = goal.status;
    if (newAmount >= goal.targetAmount && goal.status === GoalStatus.ACTIVE) {
      newStatus = GoalStatus.ACHIEVED;
      
      // Send achievement notification
      if (goal.notificationsEnabled) {
        await this.notificationsService.createGoalAlert(
          userId,
          goal.name,
          newAmount,
          goal.targetAmount,
          true // achieved
        );
      }
    } else if (goal.notificationsEnabled && newAmount >= goal.targetAmount * 0.5 && goal.currentAmount < goal.targetAmount * 0.5) {
      // Send progress notification at 50%
      await this.notificationsService.createGoalAlert(
        userId,
        goal.name,
        newAmount,
        goal.targetAmount,
        false // not achieved, just progress
      );
    }

    const updatedGoal = await this.goalModel.findByIdAndUpdate(
      id,
      {
        currentAmount: newAmount,
        status: newStatus,
        totalContributions: goal.totalContributions + contributeDto.amount,
        $push: {
          contributionHistory: contributeDto.amount,
          contributionDates: new Date(),
        },
      },
      { new: true }
    ).exec();

    await this.cacheManager.del(`goals-${userId}`);
    return updatedGoal;
  }

  async getGoalProgress(userId: string): Promise<any> {
    const cacheKey = `goal-progress-${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const progress = await this.goalModel.aggregate([
      { $match: { user: new Types.ObjectId(userId), isActive: true } },
      {
        $addFields: {
          progressPercentage: {
            $multiply: [
              { $divide: ['$currentAmount', '$targetAmount'] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: '$status',
          goals: { $push: '$$ROOT' },
          count: { $sum: 1 },
          totalTarget: { $sum: '$targetAmount' },
          totalCurrent: { $sum: '$currentAmount' },
        }
      },
      {
        $group: {
          _id: null,
          statusBreakdown: { $push: '$$ROOT' },
          totalGoals: { $sum: '$count' },
          overallTarget: { $sum: '$totalTarget' },
          overallProgress: { $sum: '$totalCurrent' },
        }
      }
    ]);

    const result = progress[0] || {
      statusBreakdown: [],
      totalGoals: 0,
      overallTarget: 0,
      overallProgress: 0,
    };

    await this.cacheManager.set(cacheKey, result, 300); // 5 minutes cache
    return result;
  }

  async getGoalsByCategory(userId: string): Promise<Goal[]> {
    return this.goalModel.find({
      user: new Types.ObjectId(userId),
      isActive: true,
    }).sort({ category: 1, createdAt: -1 }).exec();
  }

  async getGoalsSummary(userId: string): Promise<any> {
    const goals = await this.findAll(userId);
    const activeGoals = goals.filter(goal => goal.status === GoalStatus.ACTIVE);
    const achievedGoals = goals.filter(goal => goal.status === GoalStatus.ACHIEVED);
    
    const totalTargetAmount = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      achievedGoals: achievedGoals.length,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress: Math.round(overallProgress * 100) / 100,
      monthlyTargetSum: activeGoals.reduce((sum, goal) => sum + (goal.monthlyTarget || 0), 0),
    };
  }

  @Cron('0 9 * * 0') // Weekly on Sunday at 9 AM
  async sendWeeklyGoalReminders(): Promise<void> {
    const activeGoals = await this.goalModel.find({
      status: GoalStatus.ACTIVE,
      notificationsEnabled: true,
      deadline: { $exists: true },
    }).populate('user').exec();

    for (const goal of activeGoals) {
      const daysLeft = Math.ceil((goal.deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;

      if (daysLeft <= 30 && progressPercentage < 80) {
        await this.notificationsService.create({
          userId: goal.user.toString(),
          type: 'GOAL_PROGRESS' as any,
          title: 'Goal Deadline Approaching',
          message: `Your ${goal.name} goal deadline is in ${daysLeft} days. You're ${progressPercentage.toFixed(1)}% complete.`,
          priority: 'MEDIUM' as any,
        });
      }
    }
  }

  @Cron('0 */6 * * *') // Every 6 hours
  async processAutoSaveGoals(): Promise<void> {
    const autoSaveGoals = await this.goalModel.find({
      autoSave: true,
      status: GoalStatus.ACTIVE,
      autoSaveAmount: { $exists: true, $gt: 0 },
    }).exec();

    for (const goal of autoSaveGoals) {
      try {
        // Here you would integrate with a payment processor
        // For now, we'll just simulate the contribution
        await this.contributeToGoal(
          goal._id.toString(),
          { amount: goal.autoSaveAmount },
          goal.user.toString()
        );
      } catch (error) {
        console.error(`Failed to auto-save for goal ${goal._id}:`, error.message);
      }
    }
  }
}
