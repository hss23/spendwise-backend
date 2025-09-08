import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

export enum CategoryType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: CategoryType, default: CategoryType.EXPENSE })
  type: CategoryType;

  @Prop({ required: true })
  color: string; // Hex color code

  @Prop({ required: true })
  icon: string; // Icon name or emoji

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean; // System default categories

  @Prop()
  monthlyBudgetLimit?: number; // Optional budget limit for this category
}

export const CategorySchema = SchemaFactory.createForClass(Category);
