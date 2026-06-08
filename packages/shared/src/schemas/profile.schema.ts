import { z } from 'zod';

export const UnitSystemSchema = z.enum(['METRIC', 'IMPERIAL']);

export const FitnessGoalSchema = z.enum([
  'LOSE_WEIGHT',
  'BUILD_MUSCLE',
  'IMPROVE_ENDURANCE',
  'STAY_ACTIVE',
  'SPORT_PERFORMANCE',
]);

export const ActivityLevelSchema = z.enum([
  'SEDENTARY',
  'LIGHTLY_ACTIVE',
  'MODERATELY_ACTIVE',
  'VERY_ACTIVE',
  'EXTREMELY_ACTIVE',
]);

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().nullable(),
  fitnessGoal: FitnessGoalSchema.optional().nullable(),
  activityLevel: ActivityLevelSchema.optional().nullable(),
});

export const UpdatePreferencesSchema = z.object({
  timezone: z.string().min(1).optional(),
  unitSystem: UnitSystemSchema.optional(),
  quietHoursStart: z.number().int().min(0).max(23).optional().nullable(),
  quietHoursEnd: z.number().int().min(0).max(23).optional().nullable(),
  notificationChannels: z.array(z.enum(['email', 'push', 'sms', 'in_app'])).optional(),
});

export type UnitSystem = z.infer<typeof UnitSystemSchema>;
export type FitnessGoal = z.infer<typeof FitnessGoalSchema>;
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
