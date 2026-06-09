import { z } from 'zod';

export const MetricTypeSchema = z.enum([
  'WEIGHT',
  'HEIGHT',
  'BODY_FAT',
  'MUSCLE_MASS',
  'WAIST',
  'CHEST',
  'HIPS',
  'CALORIES_CONSUMED',
  'CALORIES_BURNED',
  'HYDRATION',
  'SLEEP_HOURS',
  'STEPS',
]);

export const CreateMetricSchema = z.object({
  type: MetricTypeSchema,
  value: z.number().positive(),
  unit: z.string().min(1),
  recordedAt: z.string().datetime(),
  note: z.string().max(500).optional().nullable(),
});

export const MetricQuerySchema = z.object({
  type: MetricTypeSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type MetricType = z.infer<typeof MetricTypeSchema>;
export type CreateMetricInput = z.infer<typeof CreateMetricSchema>;
export type MetricQuery = z.infer<typeof MetricQuerySchema>;
