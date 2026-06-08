import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { HealthMetric, HealthMetricSchema } from '../../schemas/health-metric.schema';
import { WorkoutSession, WorkoutSessionSchema } from '../../schemas/workout-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HealthMetric.name, schema: HealthMetricSchema },
      { name: WorkoutSession.name, schema: WorkoutSessionSchema },
    ]),
  ],
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
