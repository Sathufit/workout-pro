import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { z } from 'zod';
import { Exercise } from '../../schemas/exercise.schema';
import { EXERCISE_CATEGORIES, DIFFICULTY_LEVELS } from '@workout-pro/shared';

const ExerciseQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(EXERCISE_CATEGORIES).optional(),
  equipment: z.string().optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  primaryMuscle: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

const CreateExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  instructions: z.array(z.string()).default([]),
  primaryMuscles: z.array(z.string()).default([]),
  secondaryMuscles: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  category: z.enum(EXERCISE_CATEGORIES),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  videoUrl: z.string().url().optional(),
});

@Injectable()
export class ExerciseService {
  constructor(@InjectModel(Exercise.name) private exerciseModel: Model<Exercise>) {}

  async list(userId: string, query: unknown) {
    const parsed = ExerciseQuerySchema.parse(query);
    const { search, category, equipment, difficulty, primaryMuscle, limit } = parsed;
    const skip = parsed.offset !== undefined ? parsed.offset : (parsed.page - 1) * limit;

    const filter: Record<string, unknown> = {
      $or: [{ isCustom: false }, { isCustom: true, createdByUserId: userId }],
    };
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (equipment) filter.equipment = equipment;
    if (primaryMuscle) filter.primaryMuscles = primaryMuscle;

    const [items, total] = await Promise.all([
      this.exerciseModel
        .find(filter)
        .sort(search ? { score: { $meta: 'textScore' } } : { isCustom: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.exerciseModel.countDocuments(filter),
    ]);

    return { items, total, page: parsed.page, limit, pages: Math.ceil(total / limit) };
  }

  async getById(userId: string, id: string) {
    const exercise = await this.exerciseModel
      .findOne({ _id: id, $or: [{ isCustom: false }, { isCustom: true, createdByUserId: userId }] })
      .lean();
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async create(userId: string, body: unknown) {
    const input = CreateExerciseSchema.parse(body);
    const slug = `${input.name.toLowerCase().replace(/\s+/g, '-')}-${userId.slice(-6)}`;
    return this.exerciseModel.create({ ...input, slug, isCustom: true, createdByUserId: userId });
  }

  async update(userId: string, id: string, body: unknown) {
    const exercise = await this.exerciseModel.findById(id);
    if (!exercise) throw new NotFoundException('Exercise not found');
    if (!exercise.isCustom || exercise.createdByUserId !== userId) {
      throw new ForbiddenException('Cannot modify library exercises');
    }
    const input = CreateExerciseSchema.partial().parse(body);
    return this.exerciseModel.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
  }

  async delete(userId: string, id: string) {
    const exercise = await this.exerciseModel.findById(id);
    if (!exercise) throw new NotFoundException('Exercise not found');
    if (!exercise.isCustom || exercise.createdByUserId !== userId) {
      throw new ForbiddenException('Cannot delete library exercises');
    }
    await this.exerciseModel.deleteOne({ _id: id });
  }
}
