import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop()
  passwordHash?: string;

  @Prop()
  name?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ default: 'UTC' })
  timezone: string;

  @Prop({ enum: ['METRIC', 'IMPERIAL'], default: 'METRIC' })
  unitSystem: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: {
      dateOfBirth: Date,
      gender: String,
      fitnessGoal: String,
      activityLevel: String,
      phoneNumber: String,
      preferences: { type: Object, default: {} },
    },
    default: {},
  })
  profile: {
    dateOfBirth?: Date;
    gender?: string;
    fitnessGoal?: string;
    activityLevel?: string;
    phoneNumber?: string;
    preferences: Record<string, unknown>;
  };

  @Prop({ type: Object, default: { layout: [] } })
  dashboardConfig: { layout: unknown[] };
}

export const UserSchema = SchemaFactory.createForClass(User);
