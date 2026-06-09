import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

@Schema({ _id: true })
export class FoodItem {
  @Prop({ required: true })
  name: string;

  @Prop()
  brand?: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, default: 'g' })
  unit: string;

  @Prop({ required: true, default: 'SNACK' })
  mealType: MealType;

  @Prop({ required: true, default: 0 })
  calories: number;

  @Prop({ default: 0 })
  protein: number;

  @Prop({ default: 0 })
  carbs: number;

  @Prop({ default: 0 })
  fat: number;

  @Prop({ default: 0 })
  fiber: number;

  @Prop()
  imageUrl?: string;

  @Prop()
  barcode?: string;

  @Prop({ default: 100 })
  servingSize: number;
}

export const FoodItemSchema = SchemaFactory.createForClass(FoodItem);

@Schema({ timestamps: true })
export class FoodLog extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  date: string;

  @Prop({ type: [FoodItemSchema], default: [] })
  items: FoodItem[];

  @Prop({ default: 2000 })
  calorieGoal: number;
}

export const FoodLogSchema = SchemaFactory.createForClass(FoodLog);
FoodLogSchema.index({ userId: 1, date: 1 }, { unique: true });
