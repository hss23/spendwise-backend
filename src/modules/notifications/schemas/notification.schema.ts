import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  BUDGET_WARNING = 'BUDGET_WARNING',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  GOAL_PROGRESS = 'GOAL_PROGRESS',
  RECURRING_EXPENSE_DUE = 'RECURRING_EXPENSE_DUE',
  EXPENSE_REMINDER = 'EXPENSE_REMINDER',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  UNUSUAL_SPENDING = 'UNUSUAL_SPENDING',
  RECEIPT_PROCESSED = 'RECEIPT_PROCESSED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @Prop()
  actionUrl?: string; // URL to navigate to when notification is clicked

  @Prop()
  relatedEntity?: string; // ID of related entity (expense, budget, etc.)

  @Prop()
  relatedEntityType?: string; // Type of related entity

  @Prop()
  metadata?: Record<string, any>; // Additional data

  @Prop({ default: Date.now })
  scheduledAt: Date; // When notification should be shown

  @Prop()
  expiresAt?: Date; // When notification expires

  @Prop({ default: true })
  isActive: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
