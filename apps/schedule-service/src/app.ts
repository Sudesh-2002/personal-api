import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '@/config';
import { userIdMiddleware } from '@/middleware/userId';
import { eventRouter } from '@/modules/events/event.router';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.NODE_ENV === 'production' ? false : '*' }));
  app.use(express.json({ limit: '512kb' }));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'schedule-service',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/events', userIdMiddleware, eventRouter);

  app.use((_req, res) => {
    res.status(404).json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Endpoint not found.' });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ type: 'about:blank', title: 'Internal Server Error', status: 500, detail: err.message });
  });

  return app;
}