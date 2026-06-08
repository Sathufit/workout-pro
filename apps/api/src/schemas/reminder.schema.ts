import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Reminder extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ['WORKOUT', 'HYDRATION', 'WEIGH_IN', 'NUTRITION_LOG', 'SLEEP_PREP', 'CUSTOM'] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  message?: string;

  @Prop()
  cronExpr?: string;

  @Prop()
  scheduledAt?: Date;

  @Prop({ type: [String], default: [] })
  channels: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastFiredAt?: Date;
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);
ReminderSchema.index({ userId: 1, isActive: 1 });
