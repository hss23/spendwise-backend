import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true })
export class Expense extends Document {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop()
  notes: string;

  @Prop()
  receipt: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
