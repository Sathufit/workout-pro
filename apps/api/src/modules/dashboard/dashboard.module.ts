import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User, UserSchema } from '../../schemas/user.schema';
import { HealthMetric, HealthMetricSchema } from '../../schemas/health-metric.schema';
import { WorkoutPlan, WorkoutPlanSchema } from '../../schemas/workout-plan.schema';
import { WorkoutSession, WorkoutSessionSchema } from '../../schemas/workout-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: HealthMetric.name, schema: HealthMetricSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: WorkoutSession.name, schema: WorkoutSessionSchema },
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
