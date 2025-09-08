import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense } from './schemas/expense.schema';
import { Budget } from '../budgets/schemas/budget.schema';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(Budget.name) private budgetModel: Model<Budget>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, userId: string): Promise<Expense> {
    const newExpense = new this.expenseModel({
      ...createExpenseDto,
      user: userId,
    });

    await this.updateBudgetOnExpenseCreate(newExpense.category, newExpense.amount, userId);

    return newExpense.save();
  }

  async findAll(userId: string): Promise<Expense[]> {
    return this.expenseModel.find({ user: userId }).exec();
  }

  async findOne(id: string, userId: string): Promise<Expense> {
    const expense = await this.expenseModel.findOne({ _id: id, user: userId }).exec();
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, userId: string): Promise<Expense> {
    const originalExpense = await this.findOne(id, userId);

    const updatedExpense = await this.expenseModel.findOneAndUpdate(
      { _id: id, user: userId },
      updateExpenseDto,
      { new: true },
    ).exec();

    if (!updatedExpense) {
      throw new NotFoundException('Expense not found');
    }

    await this.updateBudgetOnExpenseUpdate(originalExpense, updatedExpense, userId);

    return updatedExpense;
  }

  async remove(id: string, userId: string): Promise<{ deleted: boolean; id: string }> {
    const expense = await this.findOne(id, userId);
    const result = await this.expenseModel.deleteOne({ _id: id, user: userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Expense not found');
    }

    await this.updateBudgetOnExpenseDelete(expense.category, expense.amount, userId);

    return { deleted: true, id };
  }

  private async updateBudgetOnExpenseCreate(category: string, amount: number, userId: string) {
    await this.budgetModel.updateOne(
      { category, user: userId },
      { $inc: { spent: amount } },
    ).exec();
  }

  private async updateBudgetOnExpenseUpdate(originalExpense: Expense, updatedExpense: Expense, userId: string) {
    if (originalExpense.category === updatedExpense.category) {
      const amountDifference = updatedExpense.amount - originalExpense.amount;
      await this.budgetModel.updateOne(
        { category: updatedExpense.category, user: userId },
        { $inc: { spent: amountDifference } },
      ).exec();
    } else {
      await this.budgetModel.updateOne(
        { category: originalExpense.category, user: userId },
        { $inc: { spent: -originalExpense.amount } },
      ).exec();
      await this.budgetModel.updateOne(
        { category: updatedExpense.category, user: userId },
        { $inc: { spent: updatedExpense.amount } },
      ).exec();
    }
  }

  private async updateBudgetOnExpenseDelete(category: string, amount: number, userId: string) {
    await this.budgetModel.updateOne(
      { category, user: userId },
      { $inc: { spent: -amount } },
    ).exec();
  }
}
