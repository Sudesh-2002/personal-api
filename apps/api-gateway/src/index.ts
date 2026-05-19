import { createApp } from './app';
import { config } from '@/config';
import { logger } from '@/utils/logger';

const app = createApp();

const server = app.listen(config.PORT, config.HOST, () => {
  logger.info(
    {
      host: config.HOST,
      port: config.PORT,
      env: config.NODE_ENV,
    },
    '🚀 API Gateway started'
  );
});

// Graceful shutdown — SIGTERM (Docker/K8s) and SIGINT (Ctrl+C)
const shutdown = (signal: string): void => {
  logger.info({ signal }, 'Shutdown signal received');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force kill after 10s if graceful fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection — shutting down');
  process.exit(1);
});