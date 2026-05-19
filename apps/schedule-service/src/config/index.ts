import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3002),
  HOST: z.string().default('localhost'),
  DB_PATH: z.string().default('./data/schedule.db'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Colombo'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment config:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;