import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(128),
  scope: z
    .array(z.enum(['read', 'write', 'admin']))
    .min(1)
    .default(['read']),
  expiresAt: z.string().datetime().optional(),
});

export const exchangeTokenSchema = z.object({
  apiKey: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;