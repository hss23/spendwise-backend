import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GoalDocument = Goal & Document;

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  ACHIEVED = 'ACHIEVED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum GoalCategory {
  VACATION = 'VACATION',
  EMERGENCY_FUND = 'EMERGENCY_FUND',
  HOUSE_DOWN_PAYMENT = 'HOUSE_DOWN_PAYMENT',
  CAR_PURCHASE = 'CAR_PURCHASE',
  EDUCATION = 'EDUCATION',
  RETIREMENT = 'RETIREMENT',
  DEBT_PAYOFF = 'DEBT_PAYOFF',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class Goal {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  targetAmount: number;

  @Prop({ default: 0 })
  currentAmount: number;

  @Prop()
  deadline?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ enum: GoalStatus, default: GoalStatus.ACTIVE })
  status: GoalStatus;

  @Prop({ enum: GoalCategory, default: GoalCategory.OTHER })
  category: GoalCategory;

  @Prop({ default: 0 })
  monthlyTarget?: number; // Suggested monthly savings

  @Prop({ default: true })
  notificationsEnabled: boolean;

  @Prop()
  imageUrl?: string; // Goal visualization image

  @Prop({ type: [Number], default: [] })
  contributionHistory: number[]; // Historical contributions

  @Prop({ type: [Date], default: [] })
  contributionDates: Date[]; // Dates of contributions

  @Prop({ default: 0 })
  totalContributions: number; // Total amount contributed

  @Prop()
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;

  // Auto-save settings
  @Prop({ default: false })
  autoSave: boolean;

  @Prop()
  autoSaveAmount?: number; // Amount to auto-save

  @Prop()
  autoSaveFrequency?: string; // daily, weekly, monthly

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
