
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetDocument = Budget & Document;

export enum BudgetPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum BudgetStatus {
  ACTIVE = 'ACTIVE',
  EXCEEDED = 'EXCEEDED',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
}

@Schema({ timestamps: true })
export class Budget {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Budget limit

  @Prop({ default: 0 })
  spent: number; // Amount spent so far

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
  period: BudgetPeriod;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ enum: BudgetStatus, default: BudgetStatus.ACTIVE })
  status: BudgetStatus;

  @Prop({ default: 80 }) // Percentage threshold for warnings
  warningThreshold: number;

  @Prop({ default: true })
  notificationsEnabled: boolean;

  @Prop({ default: true })
  rolloverUnused: boolean; // Roll over unused budget to next period

  @Prop({ type: [Number], default: [] })
  spentHistory: number[]; // Historical spending for this budget

  @Prop()
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;

  // Auto-renewal settings
  @Prop({ default: false })
  autoRenew: boolean;

  @Prop()
  nextRenewalDate?: Date;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
