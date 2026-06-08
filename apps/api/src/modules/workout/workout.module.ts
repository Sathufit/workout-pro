import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { WorkoutPlan, WorkoutPlanSchema } from '../../schemas/workout-plan.schema';
import { WorkoutSession, WorkoutSessionSchema } from '../../schemas/workout-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: WorkoutSession.name, schema: WorkoutSessionSchema },
    ]),
  ],
  providers: [WorkoutService],
  controllers: [WorkoutController],
})
export class WorkoutModule {}
