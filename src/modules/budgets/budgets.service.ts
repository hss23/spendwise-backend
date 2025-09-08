import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Budget } from './schemas/budget.schema';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<Budget>,
  ) {}

  async create(createBudgetDto: CreateBudgetDto, userId: string): Promise<Budget> {
    const newBudget = new this.budgetModel({
      ...createBudgetDto,
      user: userId,
    });
    return newBudget.save();
  }

  async findAll(userId: string): Promise<Budget[]> {
    return this.budgetModel.find({ user: userId }).exec();
  }

  async findOne(id: string, userId: string): Promise<Budget> {
    const budget = await this.budgetModel.findOne({ _id: id, user: userId }).exec();
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  async update(id: string, updateBudgetDto: UpdateBudgetDto, userId: string): Promise<Budget> {
    const updatedBudget = await this.budgetModel.findOneAndUpdate(
      { _id: id, user: userId },
      updateBudgetDto,
      { new: true },
    ).exec();

    if (!updatedBudget) {
      throw new NotFoundException('Budget not found');
    }

    return updatedBudget;
  }

  async remove(id: string, userId: string): Promise<{ deleted: boolean; id: string }> {
    const result = await this.budgetModel.deleteOne({ _id: id, user: userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Budget not found');
    }
    return { deleted: true, id };
  }
}
