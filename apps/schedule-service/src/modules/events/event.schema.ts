import { z } from 'zod';

const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).default(1),
  until: z.string().datetime().optional(),
  count: z.number().int().min(1).optional(),
  byDay: z.array(z.enum(['SU','MO','TU','WE','TH','FR','SA'])).optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(1024).optional(),
  location: z.string().max(256).optional(),
  startAt: z.string().datetime({ message: 'startAt must be a valid ISO datetime' }),
  endAt: z.string().datetime({ message: 'endAt must be a valid ISO datetime' }),
  allDay: z.boolean().default(false),
  timezone: z.string().default('UTC'),
  recurrenceRule: recurrenceRuleSchema.optional(),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
  category: z.string().min(1).max(64).default('general'),
}).refine((d) => new Date(d.endAt) >= new Date(d.startAt), {
  message: 'endAt must be after or equal to startAt',
  path: ['endAt'],
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(1024).optional(),
  location: z.string().max(256).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  timezone: z.string().optional(),
  recurrenceRule: recurrenceRuleSchema.nullable().optional(),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
  category: z.string().min(1).max(64).optional(),
});

export const querySchema = z.object({
  status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
  category: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type QueryInput = z.infer<typeof querySchema>;