import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { HealthModule } from './modules/health/health.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/workoutpro'),
    ScheduleModule.forRoot(),
    AuthModule,
    ProfileModule,
    HealthModule,
    ExerciseModule,
    WorkoutModule,
    RemindersModule,
    DashboardModule,
    NutritionModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
