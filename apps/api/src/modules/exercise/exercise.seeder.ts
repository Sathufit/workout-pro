import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise } from '../../schemas/exercise.schema';

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const CATEGORY_MAP: Record<string, string> = {
  strength: 'STRENGTH',
  stretching: 'STRETCHING',
  plyometrics: 'PLYOMETRIC',
  strongman: 'STRENGTH',
  powerlifting: 'POWERLIFTING',
  cardio: 'CARDIO',
  'olympic weightlifting': 'OLYMPIC_LIFTING',
};

const DIFFICULTY_MAP: Record<string, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  expert: 'ADVANCED',
};

const EQUIPMENT_MAP: Record<string, string> = {
  'body only': 'bodyweight',
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  cable: 'cable',
  kettlebell: 'kettlebell',
  machine: 'machine',
  bands: 'resistance_band',
  'e-z curl bar': 'barbell',
  'exercise ball': 'bodyweight',
  'medicine ball': 'machine',
  'foam roll': 'foam_roller',
  other: 'bodyweight',
};

interface RawExercise {
  id: string;
  name: string;
  category: string;
  level: string;
  mechanic?: string;
  force?: string;
  equipment?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
}

@Injectable()
export class ExerciseSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(ExerciseSeeder.name);

  constructor(
    @InjectModel(Exercise.name) private exerciseModel: Model<Exercise>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const count = await this.exerciseModel.countDocuments({ isCustom: false });
      if (count > 50) return; // already seeded

      this.logger.log('Exercise database empty — seeding from free-exercise-db...');
      const resp = await fetch(
        'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
      );
      if (!resp.ok) {
        this.logger.warn(`Seed fetch failed: ${resp.status}`);
        return;
      }

      const raw = (await resp.json()) as RawExercise[];
      const docs = raw.map((ex) => ({
        name: ex.name,
        slug: ex.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: ex.instructions?.[0] ?? '',
        instructions: ex.instructions ?? [],
        primaryMuscles: ex.primaryMuscles ?? [],
        secondaryMuscles: ex.secondaryMuscles ?? [],
        equipment: ex.equipment
          ? [EQUIPMENT_MAP[ex.equipment] ?? 'bodyweight']
          : ['bodyweight'],
        category: CATEGORY_MAP[ex.category] ?? 'STRENGTH',
        difficulty: DIFFICULTY_MAP[ex.level] ?? 'BEGINNER',
        force: ex.force,
        mechanic: ex.mechanic,
        images: (ex.images ?? []).map((img) => `${IMAGE_BASE}${img}`),
        imageUrl: ex.images?.[0] ? `${IMAGE_BASE}${ex.images[0]}` : undefined,
        isCustom: false,
      }));

      await this.exerciseModel.deleteMany({ isCustom: false });
      await this.exerciseModel.insertMany(docs, { ordered: false });
      this.logger.log(`Seeded ${docs.length} exercises successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Exercise seeding failed (non-fatal): ${msg}`);
    }
  }
}
