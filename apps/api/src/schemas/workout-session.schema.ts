import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class WorkoutSet {
  exerciseId: string;
  exerciseName?: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  rpe?: number;
  completedAt: Date;
}

@Schema({ timestamps: true })
export class WorkoutSession extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop()
  planId?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  notes?: string;

  @Prop({
    type: [
      {
        exerciseId: { type: String, required: true },
        exerciseName: String,
        setNumber: { type: Number, required: true },
        reps: Number,
        weight: Number,
        duration: Number,
        rpe: Number,
        completedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  sets: WorkoutSet[];
}

export const WorkoutSessionSchema = SchemaFactory.createForClass(WorkoutSession);
WorkoutSessionSchema.index({ userId: 1, startedAt: -1 });
