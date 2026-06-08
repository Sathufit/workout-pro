import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class HealthMetric extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({
    required: true,
    enum: ['WEIGHT', 'HEIGHT', 'BODY_FAT', 'CALORIES_CONSUMED', 'CALORIES_BURNED', 'HYDRATION', 'SLEEP_HOURS', 'STEPS'],
  })
  type: string;

  @Prop({ required: true })
  value: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  recordedAt: Date;

  @Prop()
  note?: string;
}

export const HealthMetricSchema = SchemaFactory.createForClass(HealthMetric);
HealthMetricSchema.index({ userId: 1, type: 1, recordedAt: -1 });
