import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { FoodLog, FoodLogSchema } from '../../schemas/food-log.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: FoodLog.name, schema: FoodLogSchema }])],
  providers: [NutritionService],
  controllers: [NutritionController],
})
export class NutritionModule {}
