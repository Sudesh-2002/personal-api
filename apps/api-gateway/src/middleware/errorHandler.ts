import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { ProblemDetail } from '@/types';

export class AppError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail: string,
    public type = 'about:blank'
  ) {
    super(detail);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = (req as { requestId?: string }).requestId;

  if (err instanceof AppError) {
    const problem: ProblemDetail = {
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance: req.originalUrl,
      traceId: requestId,
    };

    logger.warn({ problem, requestId }, 'Client error');
    res.status(err.status).json(problem);
    return;
  }

  logger.error({ err, requestId }, 'Unhandled server error');

  const problem: ProblemDetail = {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred. Please try again later.',
    instance: req.originalUrl,
    traceId: requestId,
  };

  res.status(500).json(problem);
}