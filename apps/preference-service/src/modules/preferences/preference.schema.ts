import { z } from 'zod';

const categoryField = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_-]+$/, 'category must be lowercase alphanumeric, dash, or underscore');

const keyField = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-z0-9_-]+$/, 'key must be lowercase alphanumeric, dash, or underscore');

export const createPreferenceSchema = z.object({
  category: categoryField,
  key: keyField,
  value: z.unknown(),
  description: z.string().max(256).optional(),
});

export const updatePreferenceSchema = z
  .object({
    value: z.unknown().optional(),
    description: z.string().max(256).optional(),
  })
  .refine((d) => d.value !== undefined || d.description !== undefined, {
    message: 'At least one of value or description must be provided',
  });

export const upsertPreferenceSchema = z.object({
  category: categoryField,
  key: keyField,
  value: z.unknown(),
  description: z.string().max(256).optional(),
});

export const querySchema = z.object({
  category: z.string().optional(),
});

export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>;
export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;
export type UpsertPreferenceInput = z.infer<typeof upsertPreferenceSchema>;
export type QueryInput = z.infer<typeof querySchema>;