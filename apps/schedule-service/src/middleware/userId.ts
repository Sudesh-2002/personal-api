import { Request, Response, NextFunction } from 'express';

export function userIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing x-user-id header.',
    });
    return;
  }
  req.userId = userId;
  next();
}