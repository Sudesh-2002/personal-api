import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '@/config';
import { userIdMiddleware } from '@/middleware/userId';
import { apiKeyController } from '@/modules/apikeys/apikey.controller';
import { tokenController } from '@/modules/tokens/token.controller';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.NODE_ENV === 'production' ? false : '*' }));
  app.use(express.json({ limit: '256kb' }));

  // Health — public
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
  });

  // ── Public token endpoints (no userId required) ──────────────
  app.post('/auth/token', tokenController.exchange);
  app.post('/auth/token/refresh', tokenController.refresh);
  app.post('/auth/token/revoke', tokenController.revoke);
  app.post('/auth/token/verify', tokenController.verify);

  // ── Protected key management (userId required) ───────────────
  app.get('/auth/keys', userIdMiddleware, apiKeyController.getAll);
  app.get('/auth/keys/:id', userIdMiddleware, apiKeyController.getOne);
  app.post('/auth/keys', userIdMiddleware, apiKeyController.create);
  app.post('/auth/keys/:id/revoke', userIdMiddleware, apiKeyController.revoke);
  app.delete('/auth/keys/:id', userIdMiddleware, apiKeyController.remove);

  app.use((_req, res) => {
    res.status(404).json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Endpoint not found.' });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ type: 'about:blank', title: 'Internal Server Error', status: 500, detail: err.message });
  });

  return app;
}