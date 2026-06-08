import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkoutPlan } from '../../schemas/workout-plan.schema';
import { WorkoutSession } from '../../schemas/workout-session.schema';
import {
  CreatePlanInput, UpdatePlanInput, PlanExerciseInput,
  StartSessionInput, LogSetInput, CompleteSessionInput,
} from '@workout-pro/shared';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectModel(WorkoutPlan.name) private planModel: Model<WorkoutPlan>,
    @InjectModel(WorkoutSession.name) private sessionModel: Model<WorkoutSession>,
  ) {}

  // ── Plans ──────────────────────────────────────────────────────────────────

  async listPlans(userId: string) {
    return this.planModel.find({ userId }).sort({ updatedAt: -1 }).lean();
  }

  async createPlan(userId: string, input: CreatePlanInput) {
    return this.planModel.create({ userId, ...input, exercises: [] });
  }

  async getPlan(userId: string, id: string) {
    const plan = await this.planModel.findOne({ _id: id, userId }).lean();
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async updatePlan(userId: string, id: string, input: UpdatePlanInput) {
    await this.getPlan(userId, id);
    return this.planModel.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
  }

  async deletePlan(userId: string, id: string) {
    await this.getPlan(userId, id);
    await this.planModel.deleteOne({ _id: id });
  }

  async duplicatePlan(userId: string, id: string) {
    const plan = await this.getPlan(userId, id);
    return this.planModel.create({
      userId,
      name: `${plan.name} (Copy)`,
      description: plan.description,
      scheduleDays: plan.scheduleDays,
      exercises: plan.exercises,
    });
  }

  // ── Plan Exercises ─────────────────────────────────────────────────────────

  async addExerciseToPlan(userId: string, planId: string, input: PlanExerciseInput) {
    await this.getPlan(userId, planId);
    return this.planModel
      .findByIdAndUpdate(planId, { $push: { exercises: input } }, { new: true })
      .lean();
  }

  async updatePlanExercise(userId: string, planId: string, exerciseId: string, input: Partial<PlanExerciseInput>) {
    await this.getPlan(userId, planId);
    const update = Object.fromEntries(
      Object.entries(input).map(([k, v]) => [`exercises.$.${k}`, v]),
    );
    return this.planModel
      .findOneAndUpdate({ _id: planId, 'exercises.exerciseId': exerciseId }, { $set: update }, { new: true })
      .lean();
  }

  async removeExerciseFromPlan(userId: string, planId: string, exerciseId: string) {
    await this.getPlan(userId, planId);
    await this.planModel.findByIdAndUpdate(planId, {
      $pull: { exercises: { exerciseId } },
    });
  }

  async reorderExercises(userId: string, planId: string, order: string[]) {
    const plan = await this.getPlan(userId, planId);
    const reordered = order.map((exerciseId, index) => {
      const ex = (plan.exercises as Array<{ exerciseId: string } & Record<string, unknown>>).find((e) => e.exerciseId === exerciseId);
      return { ...ex, order: index };
    });
    await this.planModel.findByIdAndUpdate(planId, { $set: { exercises: reordered } });
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  async startSession(userId: string, input: StartSessionInput) {
    return this.sessionModel.create({ userId, ...input, startedAt: new Date(), sets: [] });
  }

  async listSessions(userId: string, query: Record<string, string | undefined>) {
    const page = parseInt(query.page ?? '1');
    const limit = parseInt(query.limit ?? '20');
    const filter: Record<string, unknown> = { userId };
    if (query.planId) filter.planId = query.planId;
    if (query.from || query.to) {
      filter.startedAt = {
        ...(query.from && { $gte: new Date(query.from) }),
        ...(query.to && { $lte: new Date(query.to) }),
      };
    }

    const [items, total] = await Promise.all([
      this.sessionModel.find(filter).sort({ startedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.sessionModel.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getSession(userId: string, id: string) {
    const session = await this.sessionModel.findOne({ _id: id, userId }).lean();
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async completeSession(userId: string, id: string, input: CompleteSessionInput) {
    const session = await this.getSession(userId, id);
    if (session.completedAt) throw new BadRequestException('Session already completed');
    return this.sessionModel
      .findByIdAndUpdate(id, { $set: { completedAt: new Date(), notes: input.notes } }, { new: true })
      .lean();
  }

  async logSet(userId: string, sessionId: string, input: LogSetInput) {
    await this.getSession(userId, sessionId);
    const set = { ...input, completedAt: new Date() };
    return this.sessionModel
      .findByIdAndUpdate(sessionId, { $push: { sets: set } }, { new: true })
      .lean();
  }

  async deleteSet(userId: string, sessionId: string, setIndex: string) {
    await this.getSession(userId, sessionId);
    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');
    const idx = parseInt(setIndex, 10);
    (session.sets as unknown[]).splice(idx, 1);
    await session.save();
    return session;
  }

  // ── Progress ───────────────────────────────────────────────────────────────

  async getExerciseProgress(userId: string, exerciseId: string) {
    const sessions = await this.sessionModel
      .find({ userId, completedAt: { $exists: true, $ne: null } })
      .select('startedAt sets')
      .lean();

    return sessions
      .flatMap((s) =>
        (s.sets as Array<{ exerciseId: string } & Record<string, unknown>>)
          .filter((set) => set.exerciseId === exerciseId)
          .map((set) => ({ ...set, sessionDate: s.startedAt })),
      )
      .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
  }

  async getStats(userId: string) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [totalSessions, sessionsThisWeek, allSessions] = await Promise.all([
      this.sessionModel.countDocuments({ userId, completedAt: { $exists: true, $ne: null } }),
      this.sessionModel.countDocuments({ userId, completedAt: { $exists: true, $ne: null }, startedAt: { $gte: weekStart } }),
      this.sessionModel.find({ userId }).select('sets').lean(),
    ]);

    const totalSets = allSessions.reduce((sum, s) => sum + (s.sets as unknown[]).length, 0);
    return { totalSessions, sessionsThisWeek, totalSets };
  }
}
