import { z } from 'zod';

export const ReminderTypeSchema = z.enum([
  'WORKOUT',
  'HYDRATION',
  'WEIGH_IN',
  'NUTRITION_LOG',
  'SLEEP_PREP',
  'CUSTOM',
]);

export const NotificationChannelSchema = z.enum(['in_app', 'email', 'push', 'sms']);

const ReminderBaseSchema = z.object({
  type: ReminderTypeSchema,
  title: z.string().min(1).max(100),
  message: z.string().max(500).optional().nullable(),
  cronExpr: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  channels: z.array(NotificationChannelSchema).min(1),
});

export const CreateReminderSchema = ReminderBaseSchema.refine(
  (data) => data.cronExpr || data.scheduledAt,
  { message: 'Either cronExpr (recurring) or scheduledAt (one-off) must be provided' },
);

export const UpdateReminderSchema = ReminderBaseSchema.partial().omit({ type: true });

export type ReminderType = z.infer<typeof ReminderTypeSchema>;
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>;
