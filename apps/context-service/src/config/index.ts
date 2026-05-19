import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3003),
  HOST: z.string().default('localhost'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PREFERENCE_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  SCHEDULE_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  CONTEXT_CACHE_TTL_MS: z.coerce.number().default(30000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment config:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;