import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    logger.info({
      requestId: (req as Request & { requestId?: string }).requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  });

  next();
}