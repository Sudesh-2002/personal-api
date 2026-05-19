import { Router, Request, Response } from 'express';
import { config } from '@/config';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    version: '0.1.0',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

router.get('/health/ready', (_req: Request, res: Response) => {
  // Extend later to ping downstream services
  res.status(200).json({ ready: true });
});

export { router as healthRouter };