import { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '@/config';
import { authMiddleware } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';

const router = Router();

const proxyOptions = (target: string, pathRewrite: Record<string, string>) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      error: (err, _req, res) => {
        logger.error({ err, target }, 'Proxy error');
        (res as import('express').Response).status(502).json({
          type: 'about:blank',
          title: 'Bad Gateway',
          status: 502,
          detail: `Upstream service at ${target} is unavailable.`,
        });
      },
    },
  });

// All routes below require authentication
router.use((req, res, next) => {
  authMiddleware(req as AuthenticatedRequest, res, next).catch(next);
});

router.use(
  '/api/v1/preferences',
  proxyOptions(config.PREFERENCE_SERVICE_URL, { '^/api/v1/preferences': '' })
);

router.use(
  '/api/v1/schedule',
  proxyOptions(config.SCHEDULE_SERVICE_URL, { '^/api/v1/schedule': '' })
);

router.use(
  '/api/v1/context',
  proxyOptions(config.CONTEXT_SERVICE_URL, { '^/api/v1/context': '' })
);

router.use(
  '/api/v1/auth',
  proxyOptions(config.AUTH_SERVICE_URL, { '^/api/v1/auth': '' })
);

export { router as proxyRouter };