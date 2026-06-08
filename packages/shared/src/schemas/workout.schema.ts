import { z } from 'zod';

export const CreatePlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  scheduleDays: z.array(z.number().int().min(0).max(6)).optional().default([]),
});

export const UpdatePlanSchema = CreatePlanSchema.partial();

export const PlanExerciseSchema = z.object({
  exerciseId: z.string().cuid(),
  order: z.number().int().min(0),
  targetSets: z.number().int().positive().optional().nullable(),
  targetReps: z.number().int().positive().optional().nullable(),
  targetWeight: z.number().positive().optional().nullable(),
  targetDuration: z.number().int().positive().optional().nullable(),
  restSeconds: z.number().int().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const ReorderExercisesSchema = z.object({
  order: z.array(z.string().cuid()),
});

export const StartSessionSchema = z.object({
  planId: z.string().cuid().optional().nullable(),
  name: z.string().min(1).max(100),
});

export const LogSetSchema = z.object({
  exerciseId: z.string().cuid(),
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  rpe: z.number().int().min(1).max(10).optional().nullable(),
});

export const CompleteSessionSchema = z.object({
  notes: z.string().max(1000).optional().nullable(),
});

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;
export type PlanExerciseInput = z.infer<typeof PlanExerciseSchema>;
export type StartSessionInput = z.infer<typeof StartSessionSchema>;
export type LogSetInput = z.infer<typeof LogSetSchema>;
export type CompleteSessionInput = z.infer<typeof CompleteSessionSchema>;
