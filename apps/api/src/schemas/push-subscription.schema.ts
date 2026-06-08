import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PushSubscription extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ required: true })
  p256dh: string;

  @Prop({ required: true })
  auth: string;

  @Prop()
  userAgent?: string;
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscription);
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });
