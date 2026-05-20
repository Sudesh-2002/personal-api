import { initDb } from '@/db/connection';
import { runMigrations } from '@/db/migrate';
import { createApp } from './app';
import { config } from '@/config';
import { logger } from '@/utils/logger';

async function main(): Promise<void> {
  await initDb();
  runMigrations();

  const app = createApp();
  const server = app.listen(config.PORT, config.HOST, () => {
    logger.info({ host: config.HOST, port: config.PORT, env: config.NODE_ENV }, '🚀 Auth Service started');
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutdown signal received');
    server.close(() => { logger.info('Server closed'); process.exit(0); });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => { logger.fatal({ err }, 'Uncaught exception'); process.exit(1); });
  process.on('unhandledRejection', (reason) => { logger.fatal({ reason }, 'Unhandled rejection'); process.exit(1); });
}

main().catch((err) => { console.error(err); process.exit(1); });