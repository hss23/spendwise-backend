import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RecurringExpense, RecurringExpenseDocument, RecurrenceFrequency } from './schemas/recurring-expense.schema';
import { CreateRecurringExpenseDto, UpdateRecurringExpenseDto } from './dto/recurring-expense.dto';
import { ExpensesService } from '../expenses/expenses.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RecurringExpensesService {
  constructor(
    @InjectModel(RecurringExpense.name) private recurringExpenseModel: Model<RecurringExpenseDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private expensesService: ExpensesService,
    private notificationsService: NotificationsService,
  ) {}

  private calculateNextDueDate(date: Date, frequency: RecurrenceFrequency): Date {
    const nextDate = new Date(date);
    
    switch (frequency) {
      case RecurrenceFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RecurrenceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RecurrenceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RecurrenceFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }

  async create(createDto: CreateRecurringExpenseDto, userId: string): Promise<RecurringExpense> {
    const startDate = new Date(createDto.startDate);
    const nextDueDate = this.calculateNextDueDate(startDate, createDto.frequency);

    const recurringExpense = new this.recurringExpenseModel({
      ...createDto,
      user: new Types.ObjectId(userId),
      category: new Types.ObjectId(createDto.category),
      startDate,
      endDate: createDto.endDate ? new Date(createDto.endDate) : undefined,
      nextDueDate,
    });

    return recurringExpense.save();
  }

  async findAll(userId: string): Promise<RecurringExpense[]> {
    return this.recurringExpenseModel
      .find({ user: new Types.ObjectId(userId), isActive: true })
      .populate('category')
      .sort({ nextDueDate: 1 })
      .exec();
  }

  async findUpcoming(userId: string, days = 7): Promise<RecurringExpense[]> {
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + days);

    return this.recurringExpenseModel
      .find({
        user: new Types.ObjectId(userId),
        isActive: true,
        nextDueDate: { $lte: upcomingDate },
      })
      .populate('category')
      .sort({ nextDueDate: 1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<RecurringExpense> {
    const recurringExpense = await this.recurringExpenseModel
      .findOne({ _id: id, user: new Types.ObjectId(userId) })
      .populate('category')
      .exec();

    if (!recurringExpense) {
      throw new NotFoundException('Recurring expense not found');
    }

    return recurringExpense;
  }

  async update(id: string, updateDto: UpdateRecurringExpenseDto, userId: string): Promise<RecurringExpense> {
    const existingExpense = await this.findOne(id, userId);

    const updateData: any = { ...updateDto };
    
    if (updateDto.category) {
      updateData.category = new Types.ObjectId(updateDto.category);
    }
    
    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    
    if (updateDto.endDate) {
      updateData.endDate = new Date(updateDto.endDate);
    }

    // Recalculate next due date if frequency or start date changed
    if (updateDto.frequency || updateDto.startDate) {
      const frequency = updateDto.frequency || existingExpense.frequency;
      const startDate = updateDto.startDate ? new Date(updateDto.startDate) : existingExpense.startDate;
      updateData.nextDueDate = this.calculateNextDueDate(startDate, frequency);
    }

    return this.recurringExpenseModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('category')
      .exec();
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId); // Check if exists and belongs to user
    
    await this.recurringExpenseModel
      .findByIdAndUpdate(id, { isActive: false })
      .exec();
  }

  async processRecurring(id: string, userId: string): Promise<any> {
    const recurringExpense = await this.findOne(id, userId);

    if (!recurringExpense.isActive) {
      throw new BadRequestException('Recurring expense is not active');
    }

    // Create the actual expense
    const expenseData = {
      amount: recurringExpense.amount,
      category: recurringExpense.category.toString(),
      date: new Date().toISOString(),
      description: `${recurringExpense.title} - Recurring Payment`,
      paymentMethod: recurringExpense.paymentMethod,
      notes: recurringExpense.notes,
    };

    const expense = await this.expensesService.create(expenseData, userId);

    // Update recurring expense
    const nextDueDate = this.calculateNextDueDate(recurringExpense.nextDueDate, recurringExpense.frequency);
    
    await this.recurringExpenseModel.findByIdAndUpdate(id, {
      nextDueDate,
      processedCount: recurringExpense.processedCount + 1,
      $push: { processedDates: new Date() },
    });

    return { expense, nextDueDate };
  }

  @Cron('0 9 * * *') // Every day at 9 AM
  async sendUpcomingReminders(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const upcomingExpenses = await this.recurringExpenseModel
      .find({
        isActive: true,
        nextDueDate: { $lte: tomorrow },
      })
      .populate('user category')
      .exec();

    for (const expense of upcomingExpenses) {
      await this.notificationsService.create({
        type: 'RECURRING_EXPENSE_DUE' as any, // Cast to any to avoid enum import issues
        title: 'Recurring Expense Due',
        message: `${expense.title} is due on ${expense.nextDueDate.toDateString()}`,
        userId: expense.user.toString(),
        relatedEntity: expense._id.toString(),
        relatedEntityType: 'RECURRING_EXPENSE',
      });
    }
  }

  @Cron('0 */6 * * *') // Every 6 hours
  async autoProcessRecurringExpenses(): Promise<void> {
    const now = new Date();
    
    const dueExpenses = await this.recurringExpenseModel
      .find({
        isActive: true,
        isAutoPay: true,
        nextDueDate: { $lte: now },
      })
      .exec();

    for (const expense of dueExpenses) {
      try {
        await this.processRecurring(expense._id.toString(), expense.user.toString());
      } catch (error) {
        console.error(`Failed to auto-process recurring expense ${expense._id}:`, error.message);
      }
    }
  }

  async getStats(userId: string): Promise<any> {
    const cacheKey = `recurring-stats-${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const stats = await this.recurringExpenseModel.aggregate([
      { $match: { user: new Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: '$frequency',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        }
      }
    ]);

    await this.cacheManager.set(cacheKey, stats, 300); // 5 minutes cache
    return stats;
  }
}
