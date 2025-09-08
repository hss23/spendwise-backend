import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecurringExpenseDocument = RecurringExpense & Document;

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CHECK = 'CHECK',
}

@Schema({ timestamps: true })
export class RecurringExpense {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, enum: RecurrenceFrequency })
  frequency: RecurrenceFrequency;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date; // Optional end date

  @Prop({ required: true })
  nextDueDate: Date;

  @Prop({ enum: PaymentMethod, default: PaymentMethod.BANK_TRANSFER })
  paymentMethod: PaymentMethod;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isAutoPay: boolean;

  @Prop({ default: 3 })
  reminderDaysBefore: number; // Days before due date to send reminder

  @Prop({ default: 0 })
  processedCount: number; // How many times this recurring expense has been processed

  @Prop({ type: [Date], default: [] })
  processedDates: Date[]; // Dates when this recurring expense was processed

  @Prop()
  notes?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const RecurringExpenseSchema = SchemaFactory.createForClass(RecurringExpense);
