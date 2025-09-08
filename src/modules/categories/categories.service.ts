import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument, CategoryType } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async createDefaultCategories(userId: string): Promise<Category[]> {
    const defaultCategories = [
      { name: 'Food & Dining', description: 'Restaurants, groceries, food delivery', icon: '🍽️', color: '#FF6B6B', type: CategoryType.EXPENSE },
      { name: 'Transportation', description: 'Gas, public transport, rideshare', icon: '🚗', color: '#4ECDC4', type: CategoryType.EXPENSE },
      { name: 'Shopping', description: 'Clothing, electronics, general shopping', icon: '🛍️', color: '#45B7D1', type: CategoryType.EXPENSE },
      { name: 'Entertainment', description: 'Movies, games, subscriptions', icon: '🎬', color: '#96CEB4', type: CategoryType.EXPENSE },
      { name: 'Bills & Utilities', description: 'Rent, electricity, internet, phone', icon: '🏠', color: '#FFEAA7', type: CategoryType.EXPENSE },
      { name: 'Healthcare', description: 'Medical expenses, pharmacy, insurance', icon: '⚕️', color: '#FD79A8', type: CategoryType.EXPENSE },
      { name: 'Education', description: 'Books, courses, school fees', icon: '📚', color: '#A29BFE', type: CategoryType.EXPENSE },
      { name: 'Travel', description: 'Vacation, business trips, accommodation', icon: '✈️', color: '#FF7675', type: CategoryType.EXPENSE },
      { name: 'Salary', description: 'Monthly salary, bonuses', icon: '💰', color: '#00B894', type: CategoryType.INCOME },
      { name: 'Freelance', description: 'Freelance work, side projects', icon: '💼', color: '#6C5CE7', type: CategoryType.INCOME },
    ];

    const categories = await Promise.all(
      defaultCategories.map(async (cat) => {
        const category = new this.categoryModel({
          ...cat,
          user: new Types.ObjectId(userId),
          isDefault: true,
        });
        return category.save();
      })
    );

    return categories;
  }

  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    // Check if category with same name exists for this user
    const existingCategory = await this.categoryModel.findOne({
      name: createCategoryDto.name,
      user: new Types.ObjectId(userId),
      isActive: true,
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this name already exists');
    }

    const category = new this.categoryModel({
      ...createCategoryDto,
      user: new Types.ObjectId(userId),
      description: createCategoryDto.description || createCategoryDto.name,
      color: createCategoryDto.color || '#6C5CE7',
      icon: createCategoryDto.icon || '📁',
      type: createCategoryDto.type || CategoryType.EXPENSE,
    });

    return category.save();
  }

  async findAll(userId: string, type?: CategoryType): Promise<Category[]> {
    const filter: any = {
      user: new Types.ObjectId(userId),
      isActive: true,
    };

    if (type) {
      filter.type = type;
    }

    return this.categoryModel.find(filter).sort({ name: 1 }).exec();
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoryModel.findOne({
      _id: id,
      user: new Types.ObjectId(userId),
      isActive: true,
    }).exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<Category> {
    const category = await this.findOne(id, userId);

    // Check if trying to rename to an existing category name
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryModel.findOne({
        name: updateCategoryDto.name,
        user: new Types.ObjectId(userId),
        isActive: true,
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw new BadRequestException('Category with this name already exists');
      }
    }

    const updatedCategory = await this.categoryModel.findByIdAndUpdate(
      id,
      updateCategoryDto,
      { new: true }
    ).exec();

    return updatedCategory;
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.findOne(id, userId);

    if (category.isDefault) {
      throw new BadRequestException('Cannot delete default categories');
    }

    // Soft delete
    await this.categoryModel.findByIdAndUpdate(id, { isActive: false }).exec();
  }

  async getCategoryStats(userId: string, startDate?: Date, endDate?: Date): Promise<any> {
    // This will be used by reports module
    const matchStage: any = {
      user: new Types.ObjectId(userId),
      isActive: true,
    };

    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }

    return this.categoryModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          categories: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      }
    ]);
  }
}
