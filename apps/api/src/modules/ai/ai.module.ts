import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { WorkoutSession, WorkoutSessionSchema } from '../../schemas/workout-session.schema';
import { HealthMetric, HealthMetricSchema } from '../../schemas/health-metric.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkoutSession.name, schema: WorkoutSessionSchema },
      { name: HealthMetric.name, schema: HealthMetricSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
