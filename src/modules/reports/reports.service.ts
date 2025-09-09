import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Expense } from '../expenses/schemas/expense.schema';
import { Budget } from '../budgets/schemas/budget.schema';
import { Goal } from '../goals/schemas/goal.schema';
import { Transaction } from '../transactions/schemas/transaction.schema';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SpendingAnalytics {
  totalSpent: number;
  totalIncome: number;
  netFlow: number;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  dailySpending: Array<{
    date: string;
    amount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    expenses: number;
    income: number;
    net: number;
  }>;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(Budget.name) private budgetModel: Model<Budget>,
    @InjectModel(Goal.name) private goalModel: Model<Goal>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getSpendingAnalytics(userId: string, dateRange: DateRange): Promise<SpendingAnalytics> {
    const cacheKey = `analytics-${userId}-${dateRange.startDate.toISOString()}-${dateRange.endDate.toISOString()}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached as SpendingAnalytics;
    }

    const matchStage = {
      user: new Types.ObjectId(userId),
      date: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      },
    };

    // Total expenses and income
    const [expenseSum, incomeSum] = await Promise.all([
      this.expenseModel.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.transactionModel.aggregate([
        { 
          $match: {
            ...matchStage,
            type: 'INCOME',
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalSpent = expenseSum[0]?.total || 0;
    const totalIncome = incomeSum[0]?.total || 0;

    // Expenses by category
    const expensesByCategory = await this.expenseModel.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$categoryInfo.name',
          amount: { $sum: '$amount' },
        },
      },
      {
        $addFields: {
          percentage: {
            $multiply: [{ $divide: ['$amount', totalSpent] }, 100],
          },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    // Daily spending trend
    const dailySpending = await this.expenseModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          amount: 1,
          _id: 0,
        },
      },
    ]);

    // Monthly trends (last 12 months)
    const monthlyTrends = await this.getMonthlyTrends(userId);

    const analytics: SpendingAnalytics = {
      totalSpent,
      totalIncome,
      netFlow: totalIncome - totalSpent,
      expensesByCategory: expensesByCategory.map(item => ({
        category: item._id,
        amount: item.amount,
        percentage: Math.round(item.percentage * 100) / 100,
      })),
      dailySpending,
      monthlyTrends,
    };

    await this.cacheManager.set(cacheKey, analytics, 1800); // 30 minutes cache
    return analytics;
  }

  async getMonthlyTrends(userId: string, months = 12): Promise<Array<{
    month: string;
    expenses: number;
    income: number;
    net: number;
  }>> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const [expenseTrends, incomeTrends] = await Promise.all([
      this.expenseModel.aggregate([
        {
          $match: {
            user: new Types.ObjectId(userId),
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            expenses: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.transactionModel.aggregate([
        {
          $match: {
            user: new Types.ObjectId(userId),
            type: 'INCOME',
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            income: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Merge expense and income data
    const trendsMap = new Map<string, { expenses: number; income: number }>();

    expenseTrends.forEach(item => {
      trendsMap.set(item._id, { expenses: item.expenses, income: 0 });
    });

    incomeTrends.forEach(item => {
      const existing = trendsMap.get(item._id) || { expenses: 0, income: 0 };
      existing.income = item.income;
      trendsMap.set(item._id, existing);
    });

    return Array.from(trendsMap.entries()).map(([month, data]) => ({
      month,
      expenses: data.expenses,
      income: data.income,
      net: data.income - data.expenses,
    }));
  }

  async getBudgetPerformance(userId: string): Promise<any> {
    const cacheKey = `budget-performance-${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const budgets = await this.budgetModel.find({
      user: new Types.ObjectId(userId),
      isActive: true,
    }).populate('category').exec();

    const performance = budgets.map(budget => {
      const spentPercentage = (budget.spent / budget.amount) * 100;
      const remaining = budget.amount - budget.spent;
      const daysLeft = Math.ceil((budget.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

      return {
        budgetName: budget.name,
        category: budget.category,
        amount: budget.amount,
        spent: budget.spent,
        remaining,
        spentPercentage: Math.round(spentPercentage * 100) / 100,
        status: budget.status,
        daysLeft: Math.max(0, daysLeft),
        isOverBudget: budget.spent > budget.amount,
        variance: budget.spent - budget.amount,
      };
    });

    await this.cacheManager.set(cacheKey, performance, 300); // 5 minutes cache
    return performance;
  }

  async getGoalsProgress(userId: string): Promise<any> {
    const cacheKey = `goals-progress-${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const goals = await this.goalModel.find({
      user: new Types.ObjectId(userId),
      isActive: true,
    }).exec();

    const progress = goals.map(goal => {
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      const remaining = goal.targetAmount - goal.currentAmount;
      const daysLeft = goal.deadline 
        ? Math.ceil((goal.deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null;

      return {
        goalName: goal.name,
        category: goal.category,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        remaining,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        status: goal.status,
        deadline: goal.deadline,
        daysLeft: daysLeft && daysLeft > 0 ? daysLeft : null,
        monthlyTarget: goal.monthlyTarget,
        isAchievable: daysLeft ? (remaining / daysLeft) <= (goal.monthlyTarget || 0) * 30 : true,
      };
    });

    await this.cacheManager.set(cacheKey, progress, 300); // 5 minutes cache
    return progress;
  }

  async getFinancialHealthScore(userId: string): Promise<{
    score: number;
    breakdown: {
      budgetCompliance: number;
      savingsRate: number;
      debtToIncome: number;
      emergencyFund: number;
    };
    recommendations: string[];
  }> {
    const cacheKey = `health-score-${userId}`;
    const cached = await this.cacheManager.get(cacheKey) as any;
    
    if (cached) {
      return cached;
    }

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [budgetPerformance, monthlyData, goals] = await Promise.all([
      this.getBudgetPerformance(userId),
      this.getSpendingAnalytics(userId, { startDate: lastMonth, endDate: new Date() }),
      this.goalModel.find({ user: new Types.ObjectId(userId), isActive: true }).exec(),
    ]);

    // Calculate budget compliance score (0-25)
    const overBudgetCount = budgetPerformance.filter(b => b.isOverBudget).length;
    const budgetComplianceScore = Math.max(0, 25 - (overBudgetCount * 5));

    // Calculate savings rate score (0-25)
    const savingsRate = monthlyData.netFlow / monthlyData.totalIncome * 100;
    const savingsRateScore = Math.min(25, Math.max(0, savingsRate * 2.5));

    // Debt to income ratio (simplified - assume no debt for now) (0-25)
    const debtToIncomeScore = 25;

    // Emergency fund score (0-25)
    const emergencyGoals = goals.filter(g => g.category === 'EMERGENCY_FUND');
    const emergencyFundScore = emergencyGoals.length > 0 ? 25 : 0;

    const totalScore = budgetComplianceScore + savingsRateScore + debtToIncomeScore + emergencyFundScore;

    const recommendations = [];
    if (budgetComplianceScore < 20) recommendations.push('Consider reviewing and adjusting your budget limits');
    if (savingsRateScore < 15) recommendations.push('Try to increase your monthly savings rate');
    if (emergencyFundScore === 0) recommendations.push('Create an emergency fund goal for financial security');
    if (monthlyData.netFlow < 0) recommendations.push('Your expenses exceed income - consider reducing spending');

    const result = {
      score: Math.round(totalScore),
      breakdown: {
        budgetCompliance: Math.round(budgetComplianceScore),
        savingsRate: Math.round(savingsRateScore),
        debtToIncome: Math.round(debtToIncomeScore),
        emergencyFund: Math.round(emergencyFundScore),
      },
      recommendations,
    };

    await this.cacheManager.set(cacheKey, result, 1800); // 30 minutes cache
    return result;
  }

  async getExpenseComparison(userId: string, currentPeriod: DateRange, previousPeriod: DateRange): Promise<any> {
    const [currentData, previousData] = await Promise.all([
      this.getSpendingAnalytics(userId, currentPeriod),
      this.getSpendingAnalytics(userId, previousPeriod),
    ]);

    const comparison = {
      current: currentData,
      previous: previousData,
      changes: {
        totalSpentChange: currentData.totalSpent - previousData.totalSpent,
        totalSpentPercentageChange: previousData.totalSpent > 0 
          ? ((currentData.totalSpent - previousData.totalSpent) / previousData.totalSpent) * 100 
          : 0,
        netFlowChange: currentData.netFlow - previousData.netFlow,
      },
      categoryComparison: currentData.expensesByCategory.map(current => {
        const previous = previousData.expensesByCategory.find(p => p.category === current.category);
        const previousAmount = previous?.amount || 0;
        
        return {
          category: current.category,
          currentAmount: current.amount,
          previousAmount,
          change: current.amount - previousAmount,
          percentageChange: previousAmount > 0 ? ((current.amount - previousAmount) / previousAmount) * 100 : 0,
        };
      }),
    };

    return comparison;
  }

  async exportData(userId: string, format: 'CSV' | 'PDF', dateRange: DateRange): Promise<Buffer> {
    const analytics = await this.getSpendingAnalytics(userId, dateRange);
    
    if (format === 'CSV') {
      return this.generateCSV(analytics, dateRange);
    } else {
      return this.generatePDF(analytics, dateRange);
    }
  }

  private generateCSV(analytics: SpendingAnalytics, dateRange: DateRange): Buffer {
    let csv = 'Date,Category,Amount,Type\n';
    
    // Add daily spending data
    analytics.dailySpending.forEach(day => {
      csv += `${day.date},Daily Total,${day.amount},Expense\n`;
    });

    // Add category breakdown
    analytics.expensesByCategory.forEach(category => {
      csv += `${dateRange.startDate.toISOString().split('T')[0]},${category.category},${category.amount},Category Total\n`;
    });

    return Buffer.from(csv, 'utf8');
  }

  private generatePDF(analytics: SpendingAnalytics, dateRange: DateRange): Buffer {
    // This would integrate with a PDF generation library like puppeteer or PDFKit
    // For now, return a simple text representation
    const content = `
SpendWise Financial Report
Period: ${dateRange.startDate.toDateString()} - ${dateRange.endDate.toDateString()}

Summary:
Total Spent: $${analytics.totalSpent.toFixed(2)}
Total Income: $${analytics.totalIncome.toFixed(2)}
Net Flow: $${analytics.netFlow.toFixed(2)}

Category Breakdown:
${analytics.expensesByCategory.map(cat => `${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage}%)`).join('\n')}
    `;
    
    return Buffer.from(content, 'utf8');
  }
}
