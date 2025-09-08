import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Expense } from '../../expenses/schemas/expense.schema';

@Schema({ timestamps: true })
export class Receipt extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  url: string;

  @Prop()
  text: string;

  @Prop({ type: Types.ObjectId, ref: 'Expense' })
  expense: Expense;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);
