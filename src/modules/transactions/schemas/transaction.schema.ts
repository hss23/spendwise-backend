import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income',
}

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
