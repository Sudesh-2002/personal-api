import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { requestIdMiddleware } from '@/middleware/requestId';
import { requestLogger } from '@/middleware/requestLogger';
import { errorHandler } from '@/middleware/errorHandler';
import { healthRouter } from '@/routes/health';
import { proxyRouter } from '@/routes/proxy';

export function createApp(): express.Application {
  const app = express();

  // ── Security Headers (OWASP recommended) ──
  app.use(helmet());

  // ── CORS ──
  app.use(
    cors({
      origin: config.NODE_ENV === 'production' ? false : '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', config.API_KEY_HEADER, 'x-request-id'],
    })
  );

  // ── Body Parsing ──
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── Request Tracking ──
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // ── Rate Limiting (RFC 6585) ──
  app.use(
    rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        type: 'about:blank',
        title: 'Too Many Requests',
        status: 429,
        detail: 'Rate limit exceeded. Please slow down.',
      },
    })
  );

  // ── Routes ──
  app.use('/', healthRouter);
  app.use('/', proxyRouter);

  // ── 404 Handler ──
  app.use((_req, res) => {
    res.status(404).json({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'The requested endpoint does not exist.',
    });
  });

  // ── Global Error Handler ──
  app.use(errorHandler);

  return app;
}