import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true })
export class Goal extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  targetAmount: number;

  @Prop({ default: 0 })
  currentAmount: number;

  @Prop()
  deadline: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
