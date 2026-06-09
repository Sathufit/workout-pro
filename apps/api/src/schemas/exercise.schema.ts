import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Exercise extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  instructions: string[];

  @Prop({ type: [String], default: [] })
  primaryMuscles: string[];

  @Prop({ type: [String], default: [] })
  secondaryMuscles: string[];

  @Prop({ type: [String], default: [] })
  equipment: string[];

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  difficulty: string;

  @Prop()
  videoUrl?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop()
  force?: string;

  @Prop()
  mechanic?: string;

  @Prop({ default: false })
  isCustom: boolean;

  @Prop()
  createdByUserId?: string;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
ExerciseSchema.index({ category: 1, difficulty: 1 });
ExerciseSchema.index({ isCustom: 1, createdByUserId: 1 });
ExerciseSchema.index({ name: 'text' });
