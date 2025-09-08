import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Goal } from './schemas/goal.schema';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectModel(Goal.name) private goalModel: Model<Goal>,
  ) {}

  async create(createGoalDto: CreateGoalDto, userId: string): Promise<Goal> {
    const newGoal = new this.goalModel({
      ...createGoalDto,
      user: userId,
    });
    return newGoal.save();
  }

  async findAll(userId: string): Promise<Goal[]> {
    return this.goalModel.find({ user: userId }).exec();
  }

  async findOne(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalModel.findOne({ _id: id, user: userId }).exec();
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return goal;
  }

  async update(id: string, updateGoalDto: UpdateGoalDto, userId: string): Promise<Goal> {
    const updatedGoal = await this.goalModel.findOneAndUpdate(
      { _id: id, user: userId },
      updateGoalDto,
      { new: true },
    ).exec();

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    return updatedGoal;
  }

  async remove(id: string, userId: string): Promise<{ deleted: boolean; id: string }> {
    const result = await this.goalModel.deleteOne({ _id: id, user: userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Goal not found');
    }
    return { deleted: true, id };
  }
}
