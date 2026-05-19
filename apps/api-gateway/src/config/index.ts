import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('localhost'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  API_KEY_HEADER: z.string().default('x-api-key'),

  PREFERENCE_SERVICE_URL: z.string().url(),
  SCHEDULE_SERVICE_URL: z.string().url(),
  CONTEXT_SERVICE_URL: z.string().url(),
  AUTH_SERVICE_URL: z.string().url(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;