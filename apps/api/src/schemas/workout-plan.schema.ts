import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class PlanExercise {
  exerciseId: string;
  exerciseName?: string;
  order: number;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number;
  restSeconds?: number;
  notes?: string;
}

@Schema({ timestamps: true })
export class WorkoutPlan extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: false })
  isTemplate: boolean;

  @Prop({ type: [Number], default: [] })
  scheduleDays: number[];

  @Prop({
    type: [
      {
        exerciseId: { type: String, required: true },
        exerciseName: String,
        order: { type: Number, required: true },
        targetSets: Number,
        targetReps: Number,
        targetWeight: Number,
        targetDuration: Number,
        restSeconds: Number,
        notes: String,
      },
    ],
    default: [],
  })
  exercises: PlanExercise[];
}

export const WorkoutPlanSchema = SchemaFactory.createForClass(WorkoutPlan);
WorkoutPlanSchema.index({ userId: 1 });
