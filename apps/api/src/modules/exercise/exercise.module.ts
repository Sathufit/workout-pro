import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { Exercise, ExerciseSchema } from '../../schemas/exercise.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Exercise.name, schema: ExerciseSchema }])],
  providers: [ExerciseService],
  controllers: [ExerciseController],
})
export class ExerciseModule {}
