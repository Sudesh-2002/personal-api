import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '@/config';
import { userIdMiddleware } from '@/middleware/userId';
import { preferenceRouter } from '@/modules/preferences/preference.router';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.NODE_ENV === 'production' ? false : '*' }));
  app.use(express.json({ limit: '512kb' }));

  // Health
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'preference-service', timestamp: new Date().toISOString() });
  });

  // All preference routes require a user context
  app.use('/preferences', userIdMiddleware, preferenceRouter);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Endpoint not found.' });
  });

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ type: 'about:blank', title: 'Internal Server Error', status: 500, detail: err.message });
  });

  return app;
}